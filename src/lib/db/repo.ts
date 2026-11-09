import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import mongoose, { Schema } from "mongoose";
import type { RowDataPacket } from "mysql2/promise";
import { connectDB, shouldAttemptMongo } from "../mongodb";
import { conReintento, db as mysqlDb, isMysqlConfigured, TABLAS, TABLA_CONSECUTIVOS } from "../db/mysql";

// Repositorio genérico. Motor según configuración:
//   1. MySQL/MariaDB (MYSQL_URL o MYSQL_HOST...) — hosting cPanel
//   2. MongoDB (MONGODB_URI)
//   3. Memoria + archivo local (.data/casa-taty.json) para desarrollo sin base de datos.

export type Entity = { id: string };

export const COLLECTIONS = [
  "rooms",
  "residents",
  "stays",
  "cargos",
  "pagos",
  "reportes",
  "gastos",
  "ventas",
  "inventario",
  "movinventario",
  "config",
  "counters",
  "staffs",
  "minutas",
] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

type Backend = "mysql" | "mongo" | "local";

export async function backend(): Promise<Backend> {
  if (isMysqlConfigured()) return "mysql";
  if (shouldAttemptMongo()) {
    try {
      await connectDB();
      return "mongo";
    } catch {
      // cae al almacén local
    }
  }
  return "local";
}

// ---------- Almacén local ----------
type LocalData = Record<string, Record<string, Entity>>;

declare global {
  // eslint-disable-next-line no-var
  var casaTatyLocal: LocalData | undefined;
}

const DATA_DIR = process.env.LOCAL_DATA_DIR || path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "casa-taty.json");

function local(): LocalData {
  if (!global.casaTatyLocal) {
    let loaded: LocalData = {};
    try {
      loaded = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
      loaded = {};
    }
    global.casaTatyLocal = loaded;
  }
  for (const c of COLLECTIONS) global.casaTatyLocal[c] ??= {};
  return global.casaTatyLocal;
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;
function flush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(local(), null, 1));
    } catch {
      // Sistema de archivos de solo lectura (p. ej. Vercel): queda en memoria.
    }
  }, 50);
}

// ---------- Mongo ----------
const models = new Map<string, mongoose.Model<Record<string, unknown>>>();
function model(name: CollectionName) {
  let m = models.get(name);
  if (!m) {
    const modelName = `Casa_${name}`;
    m =
      (mongoose.models[modelName] as mongoose.Model<Record<string, unknown>>) ||
      mongoose.model<Record<string, unknown>>(
        modelName,
        new Schema({ id: { type: String, index: true } }, { strict: false, versionKey: false }),
        name
      );
    models.set(name, m);
  }
  return m;
}

function fromDoc<T>(doc: Record<string, unknown>): T {
  const { _id, ...rest } = doc;
  return { ...rest, id: (rest.id as string) ?? String(_id) } as T;
}

function idQuery(id: string) {
  return mongoose.isValidObjectId(id) && id.length === 24 ? { $or: [{ id }, { _id: id }] } : { id };
}

// ---------- MySQL ----------
function tabla(name: CollectionName) {
  if (name === "counters") throw new Error("La colección counters no tiene tabla en MySQL; usa nextSeq");
  return TABLAS[name];
}

// La base está en el hosting (lejos): cada consulta tarda. Se guarda una copia de cada tabla en memoria
// y solo se vuelve a leer cada CACHE_MS; las escrituras van a MySQL y actualizan la copia al instante.
const CACHE_MS = 15_000;
type TablaCache = {
  filas: Map<string, string>;
  leida: number;
  cargando: Promise<Map<string, string>> | null;
  // Escrituras hechas mientras se recargaba: se reaplican para no perderlas con la lectura vieja.
  pendientes: Map<string, string | null>;
};

declare global {
  // eslint-disable-next-line no-var
  var casaTatyCache: Map<CollectionName, TablaCache> | undefined;
}
const tablaCache = (global.casaTatyCache ??= new Map());

function cacheDe(name: CollectionName): TablaCache {
  let c = tablaCache.get(name);
  if (!c) tablaCache.set(name, (c = { filas: new Map(), leida: 0, cargando: null, pendientes: new Map() }));
  return c;
}

async function mysqlTabla(name: CollectionName): Promise<Map<string, string>> {
  const c = cacheDe(name);
  if (Date.now() - c.leida < CACHE_MS) return c.filas;
  // Ya leída antes: responde con la copia y actualiza en segundo plano (nadie espera a la base).
  if (c.leida > 0) {
    void recargar(name, c).catch(() => {});
    return c.filas;
  }
  return recargar(name, c);
}

function recargar(name: CollectionName, c: TablaCache) {
  return (c.cargando ??= (async () => {
    c.pendientes.clear();
    try {
      const [rows] = await conReintento(async () => (await mysqlDb()).query<RowDataPacket[]>(`SELECT id, datos FROM ${tabla(name)}`));
      const filas = new Map(rows.map((r) => [String(r.id), r.datos as string]));
      for (const [id, d] of c.pendientes) {
        if (d === null) filas.delete(id);
        else filas.set(id, d);
      }
      c.filas = filas;
      c.leida = Date.now();
      return c.filas;
    } finally {
      c.cargando = null;
    }
  })());
}

function anotar(name: CollectionName, id: string, datos: string | null) {
  const c = cacheDe(name);
  if (datos === null) c.filas.delete(id);
  else c.filas.set(id, datos);
  if (c.cargando) c.pendientes.set(id, datos);
}

async function mysqlRows<T>(name: CollectionName): Promise<T[]> {
  return [...(await mysqlTabla(name)).values()].map((d) => JSON.parse(d) as T);
}

async function mysqlGet<T>(name: CollectionName, id: string): Promise<T | null> {
  const d = (await mysqlTabla(name)).get(id);
  return d ? (JSON.parse(d) as T) : null;
}

async function mysqlPut(name: CollectionName, item: Entity) {
  const datos = JSON.stringify(item);
  await conReintento(async () => (await mysqlDb()).query(
    `INSERT INTO ${tabla(name)} (id, datos) VALUES (?, ?) ON DUPLICATE KEY UPDATE datos = VALUES(datos)`,
    [item.id, datos]
  ));
  anotar(name, item.id, datos);
}

function matches<T extends Entity>(item: T, filter: Partial<T>) {
  return Object.entries(filter).every(([k, v]) => (item as Record<string, unknown>)[k] === v);
}

export function repo<T extends Entity>(name: CollectionName) {
  return {
    async list(filter: Partial<T> = {}): Promise<T[]> {
      const b = await backend();
      if (b === "mysql") return (await mysqlRows<T>(name)).filter((i) => matches(i, filter));
      if (b === "mongo") {
        const docs = await model(name).find(filter as Record<string, unknown>).lean();
        return docs.map((d) => fromDoc<T>(d as Record<string, unknown>));
      }
      return Object.values(local()[name] as Record<string, T>)
        .filter((i) => matches(i, filter))
        .map((i) => structuredClone(i));
    },

    async get(id: string): Promise<T | null> {
      const b = await backend();
      if (b === "mysql") return mysqlGet<T>(name, id);
      if (b === "mongo") {
        const doc = await model(name).findOne(idQuery(id)).lean();
        return doc ? fromDoc<T>(doc as Record<string, unknown>) : null;
      }
      const item = local()[name][id] as T | undefined;
      return item ? structuredClone(item) : null;
    },

    async create(data: Omit<T, "id"> & { id?: string }): Promise<T> {
      const item = { ...data, id: data.id || randomUUID() } as T;
      const b = await backend();
      if (b === "mysql") {
        await mysqlPut(name, item);
        return item;
      }
      if (b === "mongo") {
        await model(name).create(item as unknown as Record<string, unknown>);
        return item;
      }
      local()[name][item.id] = structuredClone(item);
      flush();
      return item;
    },

    async update(id: string, patch: Partial<T>): Promise<T | null> {
      const { id: _ignored, ...rest } = patch as Record<string, unknown>;
      void _ignored;
      const b = await backend();
      if (b === "mysql") {
        const current = await mysqlGet<T>(name, id);
        if (!current) return null;
        const next = { ...current, ...rest, id } as T;
        await mysqlPut(name, next);
        return next;
      }
      if (b === "mongo") {
        const doc = await model(name)
          .findOneAndUpdate(idQuery(id), { $set: rest }, { new: true })
          .lean();
        return doc ? fromDoc<T>(doc as Record<string, unknown>) : null;
      }
      const current = local()[name][id];
      if (!current) return null;
      local()[name][id] = { ...current, ...structuredClone(rest), id } as Entity;
      flush();
      return structuredClone(local()[name][id] as T);
    },

    async upsert(id: string, data: Omit<T, "id">): Promise<T> {
      const existing = await this.get(id);
      if (existing) return (await this.update(id, data as Partial<T>)) as T;
      return this.create({ ...data, id } as Omit<T, "id"> & { id: string });
    },

    async remove(id: string): Promise<boolean> {
      const b = await backend();
      if (b === "mysql") {
        const [res] = await conReintento(async () => (await mysqlDb()).query<RowDataPacket[] & { affectedRows: number }>(
          `DELETE FROM ${tabla(name)} WHERE id = ?`,
          [id]
        ));
        anotar(name, id, null);
        return (res as unknown as { affectedRows: number }).affectedRows > 0;
      }
      if (b === "mongo") {
        const res = await model(name).deleteOne(idQuery(id));
        return res.deletedCount > 0;
      }
      if (!local()[name][id]) return false;
      delete local()[name][id];
      flush();
      return true;
    },

    async count(): Promise<number> {
      const b = await backend();
      if (b === "mysql") {
        return (await mysqlTabla(name)).size;
      }
      if (b === "mongo") return model(name).countDocuments();
      return Object.keys(local()[name]).length;
    },
  };
}

/** Consecutivo atómico (para numerar facturas). */
export async function nextSeq(key: string, start = 1): Promise<number> {
  const b = await backend();
  if (b === "mysql") {
    const conn = await conReintento(async () => (await mysqlDb()).getConnection());
    try {
      await conn.query(
        `INSERT INTO ${TABLA_CONSECUTIVOS} (nombre, ultimo) VALUES (?, LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE ultimo = LAST_INSERT_ID(ultimo + 1)`,
        [key]
      );
      const [rows] = await conn.query<RowDataPacket[]>("SELECT LAST_INSERT_ID() AS seq");
      return Number(rows[0].seq) + start - 1;
    } finally {
      conn.release();
    }
  }
  if (b === "mongo") {
    const doc = await model("counters")
      .findOneAndUpdate({ id: key }, { $inc: { seq: 1 } }, { new: true, upsert: true })
      .lean();
    const seq = Number((doc as Record<string, unknown>).seq);
    return seq + start - 1;
  }
  const counters = local().counters as Record<string, Entity & { seq?: number }>;
  const current = counters[key]?.seq ?? 0;
  counters[key] = { id: key, seq: current + 1 };
  flush();
  return current + start;
}
