import mysql from "mysql2/promise";

// Conexión a MySQL/MariaDB (p. ej. el hosting cPanel). Se activa con MYSQL_URL o con MYSQL_HOST/USER/PASSWORD/DATABASE.
// Cada colección tiene su propia tabla con nombre en español (ver TABLAS); cada fila guarda el registro como JSON.

/** Nombre de la tabla MySQL de cada colección. */
export const TABLAS = {
  rooms: "habitaciones",
  residents: "pensionados",
  stays: "estadias",
  cargos: "cargos",
  pagos: "pagos",
  reportes: "reportes",
  gastos: "gastos",
  ventas: "ventas",
  inventario: "inventario",
  movinventario: "movimientos_inventario",
  config: "configuracion",
  staffs: "personal",
  minutas: "minutas",
} as const;

/** Tabla con los consecutivos (numeración de facturas). */
export const TABLA_CONSECUTIVOS = "consecutivos";

declare global {
  // eslint-disable-next-line no-var
  var casaTatyMysql: { pool: mysql.Pool | null; ready: Promise<void> | null } | undefined;
}

const cache = (global.casaTatyMysql ??= { pool: null, ready: null });

export function isMysqlConfigured() {
  return Boolean(process.env.MYSQL_URL || (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE));
}

function createPool() {
  const common = {
    connectionLimit: 10,
    enableKeepAlive: true,
    connectTimeout: 8000,
    charset: "utf8mb4",
    ...(process.env.MYSQL_SSL === "true" ? { ssl: { rejectUnauthorized: false } } : {}),
  };
  if (process.env.MYSQL_URL) return mysql.createPool({ uri: process.env.MYSQL_URL, ...common });
  return mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ...common,
  });
}

export async function db() {
  if (!cache.pool) cache.pool = createPool();
  cache.ready ??= (async () => {
    for (const tabla of Object.values(TABLAS)) {
      await cache.pool!.query(`CREATE TABLE IF NOT EXISTS ${tabla} (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        datos LONGTEXT NOT NULL,
        actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) DEFAULT CHARSET=utf8mb4`);
    }
    await cache.pool!.query(`CREATE TABLE IF NOT EXISTS ${TABLA_CONSECUTIVOS} (
      nombre VARCHAR(64) NOT NULL PRIMARY KEY,
      ultimo INT NOT NULL DEFAULT 0
    ) DEFAULT CHARSET=utf8mb4`);
  })().catch((e) => {
    cache.ready = null;
    throw e;
  });
  await cache.ready;
  return cache.pool;
}

const ERRORES_DE_RED = new Set(["ENOTFOUND", "EAI_AGAIN", "ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "EPIPE", "PROTOCOL_CONNECTION_LOST"]);

/** true si el error es de conexión con la base (internet o servidor), no de los datos. */
export function esErrorDeRed(e: unknown) {
  const code = (e as { code?: string })?.code;
  return Boolean(code && ERRORES_DE_RED.has(code));
}

/** Reintenta hasta 3 veces cuando falla la conexión (cortes cortos de internet). */
export async function conReintento<T>(fn: () => Promise<T>): Promise<T> {
  for (let intento = 1; ; intento++) {
    try {
      return await fn();
    } catch (e) {
      if (intento >= 3 || !esErrorDeRed(e)) throw e;
      await new Promise((r) => setTimeout(r, 500 * intento));
    }
  }
}
