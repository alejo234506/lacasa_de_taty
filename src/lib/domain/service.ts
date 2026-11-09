import { randomUUID } from "crypto";
import { repo, nextSeq } from "../db/repo";
import {
  MAX_PERSONAS_HABITACION,
  PERIODOS,
  type PeriodoTarifa,
  type Area,
  type Cargo,
  type Config,
  type FacturaLinea,
  type Gasto,
  type InventarioItem,
  type MetodoPago,
  type MovInventario,
  type Pago,
  type PlanComida,
  type ReportePago,
  type Resident,
  type Room,
  type RoomBaseStatus,
  type RoomStatus,
  type Stay,
  type Venta,
} from "./types";

export class AppError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const rooms = repo<Room>("rooms");
const residents = repo<Resident>("residents");
const stays = repo<Stay>("stays");
const cargos = repo<Cargo>("cargos");
const pagos = repo<Pago>("pagos");
const reportes = repo<ReportePago>("reportes");
const gastos = repo<Gasto>("gastos");
const ventas = repo<Venta>("ventas");
const inventario = repo<InventarioItem>("inventario");
const movInventario = repo<MovInventario>("movinventario");
const config = repo<Config>("config");

// ---------------------------------------------------------------- Fechas
const TZ_OFFSET_MS = -5 * 60 * 60 * 1000; // Colombia (UTC-5, sin horario de verano)

export function nowIso() {
  return new Date().toISOString();
}

function local(iso: string | Date = new Date()) {
  return new Date(new Date(iso).getTime() + TZ_OFFSET_MS);
}

export function periodoDe(iso: string | Date = new Date()) {
  return local(iso).toISOString().slice(0, 7);
}

function semanaDe(iso: string | Date = new Date()) {
  const d = local(iso);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-S${String(week).padStart(2, "0")}`;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function periodoLabel(periodo: string) {
  const [y, m] = periodo.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

function horaDe(iso: string) {
  const d = local(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function nochesEntre(desde: string, hasta: string) {
  return Math.max(1, Math.ceil((new Date(hasta).getTime() - new Date(desde).getTime()) / 86400000 - 0.25));
}

/** Días, semanas o meses (según el periodo) transcurridos; siempre al menos 1. */
function periodosEntre(desde: string, hasta: string, periodo: PeriodoTarifa) {
  return Math.ceil(nochesEntre(desde, hasta) / PERIODOS[periodo].dias);
}

function periodo(v: unknown): PeriodoTarifa {
  if (v === "DIA" || v === "SEMANA" || v === "MES") return v;
  throw new AppError("Elige si la tarifa es por día, por semana o por mes");
}

function cuantos(n: number, p: PeriodoTarifa) {
  return `${n} ${n === 1 ? PERIODOS[p].unidad : PERIODOS[p].unidades}`;
}

function num(v: unknown, campo: string, { min = 0, allowZero = true } = {}) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || (!allowZero && n === 0)) {
    throw new AppError(`Valor no válido para ${campo}`);
  }
  return Math.round(n);
}

function texto(v: unknown, campo: string, requerido = true) {
  const s = typeof v === "string" ? v.trim() : "";
  if (requerido && !s) throw new AppError(`Falta ${campo}`);
  return s;
}

const METODOS: MetodoPago[] = ["Efectivo", "Transferencia", "Nequi", "Daviplata", "Tarjeta", "Otro"];
function metodo(v: unknown): MetodoPago {
  return METODOS.includes(v as MetodoPago) ? (v as MetodoPago) : "Efectivo";
}

const AREAS: Area[] = ["HABITACIONES", "COMIDA", "GENERAL"];
function area(v: unknown, def: Area = "GENERAL"): Area {
  return AREAS.includes(v as Area) ? (v as Area) : def;
}

// ---------------------------------------------------------------- Periodos cerrados
async function cierreDe(periodo: string) {
  return config.get(`cierre-${periodo}`);
}

async function assertAbierto(iso = nowIso()) {
  const periodo = periodoDe(iso);
  const c = await cierreDe(periodo);
  if (c?.cerrado) {
    throw new AppError(`El periodo ${periodoLabel(periodo)} está cerrado. Reábrelo en "Ganancias y cierre" para registrar movimientos.`, 409);
  }
}

// ---------------------------------------------------------------- Semilla
// La base arranca vacía: habitaciones, pensionados e inventario se registran desde el panel.
let seeded: Promise<void> | null = null;

export function ensureData() {
  seeded ??= (async () => {
    if (!(await config.get("caja"))) {
      await config.create({ id: "caja", saldo: 0, base: 0 });
    }
  })().catch((e) => {
    seeded = null;
    throw e;
  });
  return seeded;
}

// ---------------------------------------------------------------- Residentes (normalización)
type LegacyResident = Partial<Resident> & { tarifaMensual?: number; comidaIncluida?: boolean };

function normalizeResident(r: LegacyResident): Resident {
  const legacyTarifa = Number(r.tarifaMensual ?? 0);
  return {
    id: r.id!,
    nombre: r.nombre ?? "",
    documento: r.documento ?? "",
    telefono: r.telefono ?? "",
    habitacion: r.habitacion ?? "",
    grupo: r.grupo ?? "REGULAR_13_20",
    estudios: r.estudios ?? "",
    tarifaHabitacion: r.tarifaHabitacion ?? legacyTarifa,
    planComida: r.planComida ?? (r.comidaIncluida ? "MENSUAL" : "NINGUNO"),
    tarifaComida: r.tarifaComida ?? 0,
    saldo: Number(r.saldo ?? 0),
    ausente: Boolean(r.ausente),
    accessToken: r.accessToken ?? randomUUID(),
    activo: r.activo !== false,
    createdAt: r.createdAt ?? nowIso(),
  };
}

export function comidaMensualEquivalente(r: Pick<Resident, "planComida" | "tarifaComida">) {
  if (r.planComida === "MENSUAL") return r.tarifaComida;
  if (r.planComida === "SEMANAL") return r.tarifaComida * 4;
  return 0;
}

export function residentLink(token: string) {
  const base = process.env.APP_URL || "http://localhost:3000";
  return `${base}/mi-casa/${token}`;
}

async function activeResidents() {
  return (await residents.list()).map(normalizeResident).filter((r) => r.activo);
}

export function residentToView(r: Resident) {
  const comidaMes = comidaMensualEquivalente(r);
  return {
    id: r.id,
    nombre: r.nombre,
    documento: r.documento,
    telefono: r.telefono,
    habitacion: r.habitacion,
    grupo: r.grupo,
    estudios: r.estudios,
    tarifaHabitacion: r.tarifaHabitacion,
    planComida: r.planComida,
    tarifaComida: r.tarifaComida,
    comidaIncluida: r.planComida !== "NINGUNO",
    tarifaMensual: r.tarifaHabitacion + comidaMes,
    saldo: r.saldo,
    alDia: r.saldo <= 0,
    ausente: r.ausente,
    link: residentLink(r.accessToken),
  };
}
export type ResidentView = ReturnType<typeof residentToView>;

// ---------------------------------------------------------------- Habitaciones
export interface StayView extends Stay {
  habitaciones: string[];
  cantidad: number; // días, semanas o meses según el periodo
  totalAlojamiento: number;
  totalConsumos: number;
  total: number;
}

function stayToView(s: Stay, allRooms: Room[], hasta = nowIso()): StayView {
  const cantidad = periodosEntre(s.desde, s.estado === "CERRADA" && s.cerradaEn ? s.cerradaEn : hasta, s.periodo);
  const totalConsumos = s.consumos.reduce((a, c) => a + c.monto, 0);
  const totalAlojamiento = cantidad * s.tarifa;
  return {
    ...s,
    habitaciones: s.roomIds.map((id) => allRooms.find((r) => r.id === id)?.numero ?? "?"),
    cantidad,
    totalAlojamiento,
    totalConsumos,
    total: totalAlojamiento + totalConsumos,
  };
}

export async function listRooms() {
  await ensureData();
  const [allRooms, res, activeStays] = await Promise.all([rooms.list(), activeResidents(), stays.list({ estado: "ACTIVA" })]);
  allRooms.sort((a, b) => a.numero.localeCompare(b.numero, "es", { numeric: true }));

  return allRooms.map((room) => {
    const inRoom = res.filter((r) => r.habitacion === room.numero);
    const presentes = inRoom.filter((r) => !r.ausente);
    const stay = activeStays.find((s) => s.roomIds.includes(room.id));
    let estado: RoomStatus;
    if (room.estadoBase === "MANT") estado = "MANT";
    else if (stay) estado = "HOTEL";
    else if (inRoom.length > 0) estado = "PENS";
    else estado = room.estadoBase;

    const pensionAusente = inRoom.length > 0 && presentes.length === 0;
    const disponibleHotel = !stay && room.estadoBase !== "MANT" && presentes.length === 0;

    return {
      ...room,
      estado,
      residentes: inRoom.map((r) => ({ id: r.id, nombre: r.nombre, ausente: r.ausente, saldo: r.saldo })),
      personas: stay ? stay.personas : presentes.length,
      pensionAusente,
      disponibleHotel,
      stay: stay ? stayToView(stay, allRooms) : null,
    };
  });
}
export type RoomView = Awaited<ReturnType<typeof listRooms>>[number];

function roomInput(body: Record<string, unknown>, partial = false) {
  const out: Partial<Room> = {};
  if (!partial || body.numero !== undefined) {
    out.numero = texto(body.numero, "el apodo o número de la habitación");
    if (out.numero.length > 30) throw new AppError("El apodo o número de la habitación admite máximo 30 caracteres");
  }
  if (!partial || body.tipo !== undefined) out.tipo = texto(body.tipo ?? "Individual", "el tipo");
  if (!partial || body.capacidad !== undefined) {
    const c = num(body.capacidad ?? 1, "capacidad", { min: 1 });
    if (c > MAX_PERSONAS_HABITACION) throw new AppError(`Cada habitación admite máximo ${MAX_PERSONAS_HABITACION} personas`);
    out.capacidad = c;
  }
  if (!partial || body.periodo !== undefined) out.periodo = periodo(body.periodo ?? "DIA");
  if (!partial || body.tarifa !== undefined) out.tarifa = num(body.tarifa ?? 0, "la tarifa", { allowZero: false });
  if (body.notas !== undefined) out.notas = texto(body.notas, "notas", false);
  return out;
}

export async function createRoom(body: Record<string, unknown>) {
  await ensureData();
  const data = roomInput(body) as Omit<Room, "id">;
  const all = await rooms.list();
  if (all.some((r) => r.numero === data.numero)) throw new AppError(`Ya existe la habitación ${data.numero}`);
  return rooms.create({ ...data, notas: data.notas ?? "", estadoBase: "LIBRE", cuentaId: null, cuentaNombre: "" });
}

export async function updateRoom(id: string, body: Record<string, unknown>) {
  const room = await rooms.get(id);
  if (!room) throw new AppError("Habitación no encontrada", 404);
  const patch = roomInput(body, true);
  const res = await activeResidents();

  if (patch.numero && patch.numero !== room.numero) {
    const all = await rooms.list();
    if (all.some((r) => r.numero === patch.numero)) throw new AppError(`Ya existe la habitación ${patch.numero}`);
  }
  if (patch.capacidad !== undefined) {
    const ocupantes = res.filter((r) => r.habitacion === room.numero).length;
    if (patch.capacidad < ocupantes) {
      throw new AppError(`La habitación tiene ${ocupantes} pensionados; la capacidad no puede ser menor`);
    }
  }

  const updated = await rooms.update(id, patch);
  if (patch.numero && patch.numero !== room.numero) {
    for (const r of res.filter((x) => x.habitacion === room.numero)) {
      await residents.update(r.id, { habitacion: patch.numero });
    }
  }
  return updated;
}

export async function setRoomEstado(id: string, estadoBase: RoomBaseStatus, notas?: string) {
  if (!["LIBRE", "SUCIA", "MANT"].includes(estadoBase)) throw new AppError("Estado no válido");
  const room = await rooms.get(id);
  if (!room) throw new AppError("Habitación no encontrada", 404);
  if (estadoBase === "MANT") {
    const stay = (await stays.list({ estado: "ACTIVA" })).find((s) => s.roomIds.includes(id));
    if (stay) throw new AppError("Haz check-out del huésped antes de enviar a mantenimiento");
  }
  return rooms.update(id, { estadoBase, ...(notas !== undefined ? { notas } : {}) });
}

export async function deleteRoom(id: string) {
  const room = await rooms.get(id);
  if (!room) throw new AppError("Habitación no encontrada", 404);
  const res = await activeResidents();
  if (res.some((r) => r.habitacion === room.numero)) {
    throw new AppError("No se puede eliminar: tiene pensionados asignados. Muévelos primero.");
  }
  const activeStay = (await stays.list({ estado: "ACTIVA" })).some((s) => s.roomIds.includes(id));
  if (activeStay) throw new AppError("No se puede eliminar: tiene un huésped activo");
  if (room.cuentaId) await separarRoom(id);
  await rooms.remove(id);
  return { ok: true };
}

export async function unirRooms(ids: unknown, nombre: unknown) {
  if (!Array.isArray(ids) || ids.length < 2) throw new AppError("Selecciona al menos dos habitaciones para unir");
  const selected = await Promise.all(ids.map((id) => rooms.get(String(id))));
  if (selected.some((r) => !r)) throw new AppError("Alguna habitación no existe", 404);
  const activeStays = await stays.list({ estado: "ACTIVA" });
  if (activeStays.some((s) => s.roomIds.some((rid) => ids.includes(rid)))) {
    throw new AppError("No se pueden unir habitaciones con huéspedes activos");
  }
  // Si alguna ya pertenece a una cuenta, se reutiliza esa cuenta.
  const existing = selected.find((r) => r!.cuentaId)?.cuentaId;
  const cuentaId = existing || randomUUID();
  const cuentaNombre =
    texto(nombre, "nombre", false) ||
    selected.find((r) => r!.cuentaNombre)?.cuentaNombre ||
    `Cuenta ${selected.map((r) => r!.numero).join(" + ")}`;
  for (const r of selected) await rooms.update(r!.id, { cuentaId, cuentaNombre });
  const all = await rooms.list({ cuentaId });
  for (const r of all) await rooms.update(r.id, { cuentaNombre });
  return { cuentaId, cuentaNombre };
}

export async function separarRoom(id: string) {
  const room = await rooms.get(id);
  if (!room?.cuentaId) throw new AppError("La habitación no está unida a ninguna cuenta");
  const activeStay = (await stays.list({ estado: "ACTIVA" })).some((s) => s.roomIds.includes(id));
  if (activeStay) throw new AppError("No se puede separar con un huésped activo");
  await rooms.update(id, { cuentaId: null, cuentaNombre: "" });
  const rest = await rooms.list({ cuentaId: room.cuentaId });
  if (rest.length === 1) await rooms.update(rest[0].id, { cuentaId: null, cuentaNombre: "" });
  return { ok: true };
}

// ---------------------------------------------------------------- Hotel (estadías por noche)
export async function checkIn(roomId: string, body: Record<string, unknown>) {
  await assertAbierto();
  const room = await rooms.get(roomId);
  if (!room) throw new AppError("Habitación no encontrada", 404);
  const group = room.cuentaId ? await rooms.list({ cuentaId: room.cuentaId }) : [room];
  const [res, activeStays] = await Promise.all([activeResidents(), stays.list({ estado: "ACTIVA" })]);

  for (const r of group) {
    if (r.estadoBase === "MANT") throw new AppError(`La habitación ${r.numero} está en mantenimiento`);
    if (activeStays.some((s) => s.roomIds.includes(r.id))) throw new AppError(`La habitación ${r.numero} ya tiene huésped`);
    const presentes = res.filter((p) => p.habitacion === r.numero && !p.ausente);
    if (presentes.length) {
      throw new AppError(
        `La habitación ${r.numero} tiene pensionados presentes (${presentes.map((p) => p.nombre).join(", ")}). Márcalos como ausentes para alquilarla.`
      );
    }
  }

  const capacidad = group.reduce((a, r) => a + r.capacidad, 0);
  const personas = num(body.personas ?? 1, "personas", { min: 1 });
  if (personas > capacidad) {
    throw new AppError(`Capacidad máxima ${capacidad} personas (máx. ${MAX_PERSONAS_HABITACION} por habitación)`);
  }
  const per = body.periodo !== undefined ? periodo(body.periodo) : group[0].periodo;
  const cantidad = num(body.cantidad ?? 1, PERIODOS[per].unidades, { min: 1 });
  const tarifa =
    body.tarifa !== undefined && body.tarifa !== ""
      ? num(body.tarifa, "la tarifa")
      : group.reduce((a, r) => a + r.tarifa, 0);

  const desde = nowIso();
  const stay = await stays.create({
    roomIds: group.map((r) => r.id),
    huesped: texto(body.huesped, "el nombre del huésped"),
    documento: texto(body.documento, "documento", false),
    telefono: texto(body.telefono, "teléfono", false),
    personas,
    periodo: per,
    tarifa,
    desde,
    hastaPrevisto: new Date(new Date(desde).getTime() + cantidad * PERIODOS[per].dias * 86400000).toISOString(),
    consumos: [],
    estado: "ACTIVA",
    cerradaEn: null,
    facturaId: null,
    deAusente: group.some((r) => res.some((p) => p.habitacion === r.numero)),
  } as Omit<Stay, "id">);
  for (const r of group) await rooms.update(r.id, { estadoBase: "LIBRE" });
  return stay;
}

export async function addConsumo(stayId: string, concepto: unknown, monto: unknown, ventaId?: string) {
  await assertAbierto();
  const stay = await stays.get(stayId);
  if (!stay || stay.estado !== "ACTIVA") throw new AppError("Estadía no activa", 404);
  const consumo = { concepto: texto(concepto, "concepto"), monto: num(monto, "monto", { allowZero: false }), fecha: nowIso(), ...(ventaId ? { ventaId } : {}) };
  return stays.update(stayId, { consumos: [...stay.consumos, consumo] });
}

export async function checkOut(stayId: string, body: Record<string, unknown>) {
  await assertAbierto();
  const stay = await stays.get(stayId);
  if (!stay || stay.estado !== "ACTIVA") throw new AppError("Estadía no activa", 404);
  const allRooms = await rooms.list();
  const view = stayToView(stay, allRooms);
  const cantidad =
    body.cantidad !== undefined && body.cantidad !== "" ? num(body.cantidad, PERIODOS[stay.periodo].unidades, { min: 1 }) : view.cantidad;
  const alojamiento = cantidad * stay.tarifa;
  const habitaciones = view.habitaciones.join(" + ");

  const lineas: FacturaLinea[] = [
    {
      concepto: `Alojamiento hab. ${habitaciones} · ${cuantos(cantidad, stay.periodo)} × ${stay.tarifa.toLocaleString("es-CO")}${(stay as Stay & { deAusente?: boolean }).deAusente ? " (habitación de pensionado ausente)" : ""}`,
      area: "HABITACIONES",
      monto: alojamiento,
    },
    ...stay.consumos.map((c) => ({ concepto: `Consumo: ${c.concepto}`, area: "COMIDA" as Area, monto: c.monto })),
  ];
  const total = lineas.reduce((a, l) => a + l.monto, 0);

  const pago = await crearFactura({
    origen: "HOTEL",
    residentIds: [],
    stayId,
    cuentaId: null,
    cliente: stay.huesped,
    documento: stay.documento,
    habitacion: habitaciones,
    metodo: metodo(body.metodo),
    referencia: texto(body.referencia, "referencia", false),
    comprobante: texto(body.comprobante, "comprobante", false),
    lineas,
    total,
    saldoAnterior: total,
    saldoNuevo: 0,
    asignaciones: [],
  });

  await stays.update(stayId, { estado: "CERRADA", cerradaEn: nowIso(), facturaId: pago.id });
  for (const id of stay.roomIds) await rooms.update(id, { estadoBase: "SUCIA" });
  return pago;
}

export async function listStays(estado?: "ACTIVA" | "CERRADA") {
  const [list, allRooms] = await Promise.all([stays.list(estado ? { estado } : {}), rooms.list()]);
  return list.map((s) => stayToView(s, allRooms)).sort((a, b) => b.desde.localeCompare(a.desde));
}

// ---------------------------------------------------------------- Pensionados
async function validarCapacidad(numero: string, excludeId?: string) {
  const all = await rooms.list();
  const room = all.find((r) => r.numero === numero);
  if (!room) throw new AppError(`La habitación ${numero} no existe. Créala primero en Habitaciones.`);
  const res = await activeResidents();
  const ocupantes = res.filter((r) => r.habitacion === numero && r.id !== excludeId).length;
  if (ocupantes + 1 > room.capacidad) {
    throw new AppError(`La habitación ${numero} ya está llena (${ocupantes}/${room.capacidad} personas)`);
  }
  const stay = (await stays.list({ estado: "ACTIVA" })).find((s) => s.roomIds.includes(room.id));
  if (stay) throw new AppError(`La habitación ${numero} tiene un huésped por noches (${stay.huesped}). Haz check-out primero.`);
}

function residentInput(body: Record<string, unknown>, partial = false) {
  const out: Partial<Resident> = {};
  const has = (k: string) => !partial || body[k] !== undefined;
  if (has("nombre")) out.nombre = texto(body.nombre, "el nombre");
  if (has("documento")) out.documento = texto(body.documento, "el documento");
  if (has("habitacion")) out.habitacion = texto(body.habitacion, "la habitación");
  if (body.telefono !== undefined) out.telefono = texto(body.telefono, "teléfono", false);
  if (body.estudios !== undefined) out.estudios = texto(body.estudios, "estudios", false);
  if (has("grupo")) out.grupo = body.grupo === "MEDICINA_30_05" ? "MEDICINA_30_05" : "REGULAR_13_20";
  if (has("tarifaHabitacion")) out.tarifaHabitacion = num(body.tarifaHabitacion ?? 0, "tarifa de habitación");
  if (has("planComida")) {
    const p = body.planComida as PlanComida;
    out.planComida = ["NINGUNO", "SEMANAL", "MENSUAL"].includes(p) ? p : "NINGUNO";
  }
  if (has("tarifaComida")) out.tarifaComida = out.planComida === "NINGUNO" ? 0 : num(body.tarifaComida ?? 0, "tarifa de comida");
  if (body.saldo !== undefined) out.saldo = Math.round(Number(body.saldo) || 0);
  if (body.ausente !== undefined) out.ausente = Boolean(body.ausente);
  return out;
}

export async function listResidents() {
  await ensureData();
  const res = await activeResidents();
  return res.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map(residentToView);
}

export async function getResident(id: string) {
  const r = await residents.get(id);
  if (!r) throw new AppError("Pensionado no encontrado", 404);
  return normalizeResident(r);
}

export async function createResident(body: Record<string, unknown>) {
  await ensureData();
  const data = residentInput(body) as Resident;
  const res = await activeResidents();
  if (res.some((r) => r.documento === data.documento)) throw new AppError("Ya existe un pensionado con ese documento");
  await validarCapacidad(data.habitacion);
  const created = await residents.create({
    ...data,
    telefono: data.telefono ?? "",
    estudios: data.estudios ?? "",
    saldo: data.saldo ?? 0,
    ausente: false,
    accessToken: randomUUID(),
    activo: true,
    createdAt: nowIso(),
  });
  return residentToView(normalizeResident(created));
}

export async function updateResident(id: string, body: Record<string, unknown>) {
  const current = await getResident(id);
  const patch = residentInput(body, true);
  if (patch.planComida === undefined && patch.tarifaComida !== undefined && current.planComida === "NINGUNO") patch.tarifaComida = 0;
  if (patch.habitacion && patch.habitacion !== current.habitacion) await validarCapacidad(patch.habitacion, id);
  if (patch.ausente === false && current.ausente) {
    const all = await rooms.list();
    const room = all.find((r) => r.numero === current.habitacion);
    const stay = room && (await stays.list({ estado: "ACTIVA" })).find((s) => s.roomIds.includes(room.id));
    if (stay) throw new AppError(`Su habitación está alquilada a ${stay.huesped}. Haz check-out antes de marcar el regreso.`);
  }
  const updated = await residents.update(id, patch);
  return residentToView(normalizeResident(updated!));
}

export async function deactivateResident(id: string) {
  await getResident(id);
  await residents.update(id, { activo: false });
  return { ok: true };
}

export async function regenerateLink(id: string) {
  await getResident(id);
  const token = randomUUID();
  await residents.update(id, { accessToken: token });
  return { link: residentLink(token) };
}

/** Genera el cobro del periodo: mensualidad (habitación + comida mensual) o semana de comida. */
export async function cargarPeriodo(id: string, tipo: "MES" | "SEMANA_COMIDA", force = false) {
  await assertAbierto();
  const r = await getResident(id);
  const fecha = nowIso();
  const periodo = periodoDe(fecha);
  const existentes = await cargos.list({ residentId: id });
  const nuevos: Omit<Cargo, "id">[] = [];

  if (tipo === "MES") {
    const etiqueta = `Mensualidad ${periodoLabel(periodo)}`;
    if (!force && existentes.some((c) => c.concepto.startsWith(etiqueta))) {
      throw new AppError(`${r.nombre} ya tiene cargada la ${etiqueta.toLowerCase()}`);
    }
    if (r.tarifaHabitacion > 0) {
      nuevos.push({ residentId: id, fecha, periodo, concepto: `${etiqueta} · habitación ${r.habitacion}`, area: "HABITACIONES", monto: r.tarifaHabitacion });
    }
    if (r.planComida === "MENSUAL" && r.tarifaComida > 0) {
      nuevos.push({ residentId: id, fecha, periodo, concepto: `${etiqueta} · alimentación mensual`, area: "COMIDA", monto: r.tarifaComida });
    }
  } else {
    if (r.planComida !== "SEMANAL") throw new AppError(`${r.nombre} no tiene plan de comida semanal`);
    const semana = semanaDe(fecha);
    const etiqueta = `Alimentación semana ${semana}`;
    if (!force && existentes.some((c) => c.concepto === etiqueta)) throw new AppError(`Ya se cargó la ${etiqueta.toLowerCase()}`);
    nuevos.push({ residentId: id, fecha, periodo, concepto: etiqueta, area: "COMIDA", monto: r.tarifaComida });
  }

  if (!nuevos.length) throw new AppError("No hay valores para cargar (tarifas en cero)");
  for (const c of nuevos) await cargos.create(c);
  const total = nuevos.reduce((a, c) => a + c.monto, 0);
  await residents.update(id, { saldo: r.saldo + total });
  return { cargado: total, cargos: nuevos.length };
}

/** Carga en lote a todos los pensionados activos (los que ya lo tienen se omiten). */
export async function cargarPeriodoTodos(tipo: "MES" | "SEMANA_COMIDA") {
  const res = await activeResidents();
  let ok = 0;
  let total = 0;
  const omitidos: string[] = [];
  for (const r of res) {
    if (tipo === "SEMANA_COMIDA" && r.planComida !== "SEMANAL") continue;
    try {
      const out = await cargarPeriodo(r.id, tipo);
      ok += 1;
      total += out.cargado;
    } catch (e) {
      if (e instanceof AppError && e.status === 409) throw e;
      omitidos.push(r.nombre);
    }
  }
  return { cargados: ok, total, omitidos };
}

export async function estadoCuenta(id: string) {
  const r = await getResident(id);
  const [c, p, rep] = await Promise.all([cargos.list({ residentId: id }), pagos.list(), reportes.list({ residentId: id })]);
  const susPagos = p.filter((x) => x.residentIds.includes(id));
  const movimientos = [
    ...c.map((x) => ({ fecha: x.fecha, tipo: "CARGO" as const, concepto: x.concepto, monto: x.monto, ref: "" })),
    ...susPagos.map((x) => ({
      fecha: x.fecha,
      tipo: x.anulado ? ("ANULADO" as const) : ("PAGO" as const),
      concepto: `Pago ${x.numero} · ${x.metodo}${x.referencia ? ` · ref ${x.referencia}` : ""}`,
      monto: (x as Pago & { asignaciones?: Asignacion[] }).asignaciones?.find((a) => a.residentId === id)?.monto ?? x.total,
      ref: x.id,
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return {
    resident: residentToView(r),
    movimientos,
    pagos: susPagos.sort((a, b) => b.fecha.localeCompare(a.fecha)),
    reportes: rep.sort((a, b) => b.fecha.localeCompare(a.fecha)),
  };
}

// ---------------------------------------------------------------- Pagos y facturas
type Asignacion = { residentId: string; monto: number };
type NuevaFactura = Omit<Pago, "id" | "numero" | "fecha" | "periodo" | "registradoPor" | "anulado"> & { asignaciones: Asignacion[] };

async function crearFactura(data: NuevaFactura, registradoPor = "Recepción") {
  const fecha = nowIso();
  const seq = await nextSeq("factura");
  return pagos.create({
    ...data,
    numero: `FAC-${String(seq).padStart(6, "0")}`,
    fecha,
    periodo: periodoDe(fecha),
    registradoPor,
    anulado: false,
  } as Omit<Pago, "id">);
}

function lineasPension(r: Resident, monto: number): FacturaLinea[] {
  const comidaMes = comidaMensualEquivalente(r);
  const base = r.tarifaHabitacion + comidaMes;
  const comida = base > 0 ? Math.round((monto * comidaMes) / base) : 0;
  const hab = monto - comida;
  const out: FacturaLinea[] = [];
  if (hab > 0) out.push({ concepto: `${r.nombre} · pensión habitación ${r.habitacion}`, area: "HABITACIONES", monto: hab });
  if (comida > 0) {
    out.push({ concepto: `${r.nombre} · alimentación (plan ${r.planComida.toLowerCase()})`, area: "COMIDA", monto: comida });
  }
  return out;
}

export async function registrarPago(body: Record<string, unknown>, registradoPor?: string) {
  await assertAbierto();
  const monto = num(body.monto, "monto", { allowZero: false });
  const base = {
    metodo: metodo(body.metodo),
    referencia: texto(body.referencia, "referencia", false),
    comprobante: texto(body.comprobante, "comprobante", false),
  };

  // Pago a una cuenta de habitaciones unidas: se reparte entre sus pensionados.
  if (body.cuentaId) {
    const cuentaId = String(body.cuentaId);
    const cuentaRooms = await rooms.list({ cuentaId });
    if (!cuentaRooms.length) throw new AppError("Cuenta no encontrada", 404);
    const numeros = cuentaRooms.map((r) => r.numero);
    const miembros = (await activeResidents()).filter((r) => numeros.includes(r.habitacion)).sort((a, b) => b.saldo - a.saldo);
    if (!miembros.length) throw new AppError("La cuenta no tiene pensionados");

    let restante = monto;
    const asignaciones: Asignacion[] = [];
    for (const m of miembros) {
      if (restante <= 0) break;
      const parte = Math.min(Math.max(m.saldo, 0), restante);
      if (parte > 0) {
        asignaciones.push({ residentId: m.id, monto: parte });
        restante -= parte;
      }
    }
    if (restante > 0) {
      const first = asignaciones.find((a) => a.residentId === miembros[0].id);
      if (first) first.monto += restante;
      else asignaciones.push({ residentId: miembros[0].id, monto: restante });
    }

    const saldoAnterior = miembros.reduce((a, m) => a + m.saldo, 0);
    const lineas = asignaciones.flatMap((a) => lineasPension(miembros.find((m) => m.id === a.residentId)!, a.monto));
    for (const a of asignaciones) {
      const m = miembros.find((x) => x.id === a.residentId)!;
      await residents.update(m.id, { saldo: m.saldo - a.monto });
    }
    const titular = miembros[0];
    return crearFactura(
      {
        origen: "CUENTA",
        residentIds: asignaciones.map((a) => a.residentId),
        stayId: null,
        cuentaId,
        cliente: cuentaRooms[0].cuentaNombre || titular.nombre,
        documento: titular.documento,
        habitacion: numeros.join(" + "),
        ...base,
        lineas,
        total: monto,
        saldoAnterior,
        saldoNuevo: saldoAnterior - monto,
        asignaciones,
      },
      registradoPor
    );
  }

  const r = await getResident(String(body.residentId ?? ""));
  await residents.update(r.id, { saldo: r.saldo - monto });
  return crearFactura(
    {
      origen: "PENSION",
      residentIds: [r.id],
      stayId: null,
      cuentaId: null,
      cliente: r.nombre,
      documento: r.documento,
      habitacion: r.habitacion,
      ...base,
      lineas: lineasPension(r, monto),
      total: monto,
      saldoAnterior: r.saldo,
      saldoNuevo: r.saldo - monto,
      asignaciones: [{ residentId: r.id, monto }],
    },
    registradoPor
  );
}

export async function listPagos(filter: { residentId?: string; periodo?: string } = {}) {
  let list = await pagos.list(filter.periodo ? { periodo: filter.periodo } : {});
  if (filter.residentId) list = list.filter((p) => p.residentIds.includes(filter.residentId!));
  return list.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function getPago(id: string) {
  const p = await pagos.get(id);
  if (!p) throw new AppError("Factura no encontrada", 404);
  return p;
}

export async function anularPago(id: string) {
  const p = (await getPago(id)) as Pago & { asignaciones?: Asignacion[] };
  if (p.anulado) throw new AppError("La factura ya está anulada");
  await assertAbierto(p.fecha);
  for (const a of p.asignaciones ?? []) {
    const r = await residents.get(a.residentId);
    if (r) await residents.update(a.residentId, { saldo: Number(r.saldo) + a.monto });
  }
  return pagos.update(id, { anulado: true });
}

// ---------------------------------------------------------------- Reportes de pago (desde el portal)
export async function residentByToken(token: string) {
  await ensureData();
  const all = await residents.list({ accessToken: token } as Partial<Resident>);
  const r = all.map(normalizeResident).find((x) => x.activo);
  return r ?? null;
}

export async function crearReporte(token: string, body: Record<string, unknown>) {
  const r = await residentByToken(token);
  if (!r) throw new AppError("Link no válido", 404);
  const pendientes = (await reportes.list({ residentId: r.id, estado: "PENDIENTE" })).length;
  if (pendientes >= 3) throw new AppError("Ya tienes pagos pendientes por verificar. Espera la confirmación de recepción.");
  const comprobante = texto(body.comprobante, "la descripción del comprobante");
  return reportes.create({
    residentId: r.id,
    fecha: nowIso(),
    monto: num(body.monto, "monto", { allowZero: false }),
    metodo: metodo(body.metodo),
    referencia: texto(body.referencia, "referencia", false).slice(0, 80),
    comprobante: comprobante.slice(0, 600),
    estado: "PENDIENTE",
    pagoId: null,
    motivo: "",
  });
}

export async function listReportes(estado?: ReportePago["estado"]) {
  const [list, res] = await Promise.all([reportes.list(estado ? { estado } : {}), residents.list()]);
  return list
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((rep) => {
      const r = res.find((x) => x.id === rep.residentId);
      return { ...rep, nombre: r?.nombre ?? "—", habitacion: r?.habitacion ?? "—", saldo: Number(r?.saldo ?? 0) };
    });
}

export async function resolverReporte(id: string, action: "aprobar" | "rechazar", body: Record<string, unknown> = {}) {
  const rep = await reportes.get(id);
  if (!rep) throw new AppError("Reporte no encontrado", 404);
  if (rep.estado !== "PENDIENTE") throw new AppError("Este reporte ya fue resuelto");
  if (action === "rechazar") {
    return { reporte: await reportes.update(id, { estado: "RECHAZADO", motivo: texto(body.motivo, "motivo", false) }) };
  }
  const pago = await registrarPago({
    residentId: rep.residentId,
    monto: body.monto ?? rep.monto,
    metodo: rep.metodo,
    referencia: rep.referencia,
    comprobante: `Reportado por el pensionado: ${rep.comprobante}`,
  });
  const reporte = await reportes.update(id, { estado: "APROBADO", pagoId: pago.id });
  return { reporte, pago };
}

// ---------------------------------------------------------------- Caja menor y gastos
async function caja() {
  await ensureData();
  const c = (await config.get("caja")) as Config & { saldo: number; base: number };
  return { saldo: Number(c?.saldo ?? 0), base: Number(c?.base ?? 500000) };
}

export async function getCaja(periodo = periodoDe()) {
  const [c, g, inv, movs] = await Promise.all([caja(), gastos.list({ periodo }), listInventario(), movInventario.list()]);
  return {
    ...c,
    periodo,
    gastos: g.sort((a, b) => b.fecha.localeCompare(a.fecha)),
    inventario: inv,
    movimientosInventario: movs.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 40),
  };
}

export async function crearGasto(body: Record<string, unknown>) {
  await assertAbierto();
  const fecha = nowIso();
  const fuente = (["CAJA_MENOR", "BANCO", "EFECTIVO"] as const).includes(body.fuente as Gasto["fuente"])
    ? (body.fuente as Gasto["fuente"])
    : "CAJA_MENOR";
  const monto = num(body.monto, "monto", { allowZero: false });
  if (fuente === "CAJA_MENOR") {
    const c = await caja();
    if (monto > c.saldo) throw new AppError(`Saldo insuficiente en caja menor (${c.saldo.toLocaleString("es-CO")}). Repón la caja o usa otra fuente.`);
    await config.update("caja", { saldo: c.saldo - monto });
  }
  return gastos.create({
    fecha,
    periodo: periodoDe(fecha),
    concepto: texto(body.concepto, "el concepto"),
    rubro: texto(body.rubro ?? "Otros", "rubro", false) || "Otros",
    area: area(body.area),
    fuente,
    monto,
  });
}

export async function eliminarGasto(id: string) {
  const g = await gastos.get(id);
  if (!g) throw new AppError("Gasto no encontrado", 404);
  await assertAbierto(g.fecha);
  if (g.fuente === "CAJA_MENOR") {
    const c = await caja();
    await config.update("caja", { saldo: c.saldo + g.monto });
  }
  await gastos.remove(id);
  return { ok: true };
}

export async function reponerCaja() {
  const c = await caja();
  await config.update("caja", { saldo: c.base });
  return { saldo: c.base, repuesto: c.base - c.saldo };
}

export async function arqueoCaja(saldoReal: unknown) {
  const c = await caja();
  const real = num(saldoReal, "saldo contado");
  await config.update("caja", { saldo: real });
  return { diff: real - c.saldo, saldo: real };
}

export async function setBaseCaja(base: unknown) {
  await caja();
  return config.update("caja", { base: num(base, "base", { allowZero: false }) });
}

// ---------------------------------------------------------------- Inventario
function estadoInventario(i: InventarioItem) {
  if (i.cantidad <= 0) return "Agotado";
  if (i.cantidad <= i.minimo) return "Bajo";
  return "OK";
}

export async function listInventario() {
  await ensureData();
  return (await inventario.list())
    .map((i) => ({ ...i, minimo: Number(i.minimo ?? 0), costoUnitario: Number(i.costoUnitario ?? 0), area: i.area ?? "COMIDA" }))
    .sort((a, b) => a.producto.localeCompare(b.producto, "es"))
    .map((i) => ({ ...i, estado: estadoInventario(i) }));
}

export async function crearItem(body: Record<string, unknown>) {
  return inventario.create({
    producto: texto(body.producto, "el producto"),
    cantidad: Number(body.cantidad) || 0,
    unidad: texto(body.unidad ?? "unidad", "unidad", false) || "unidad",
    minimo: Number(body.minimo) || 0,
    costoUnitario: Number(body.costoUnitario) || 0,
    area: area(body.area, "COMIDA"),
  });
}

export async function editarItem(id: string, body: Record<string, unknown>) {
  const item = await inventario.get(id);
  if (!item) throw new AppError("Producto no encontrado", 404);
  const patch: Partial<InventarioItem> = {};
  if (body.producto !== undefined) patch.producto = texto(body.producto, "el producto");
  if (body.unidad !== undefined) patch.unidad = texto(body.unidad, "unidad");
  if (body.minimo !== undefined) patch.minimo = Number(body.minimo) || 0;
  if (body.costoUnitario !== undefined) patch.costoUnitario = Number(body.costoUnitario) || 0;
  if (body.area !== undefined) patch.area = area(body.area, "COMIDA");
  return inventario.update(id, patch);
}

export async function eliminarItem(id: string) {
  if (!(await inventario.remove(id))) throw new AppError("Producto no encontrado", 404);
  return { ok: true };
}

/** Entrada (compra), salida (consumo) o ajuste por conteo físico. */
export async function movimientoInventario(id: string, body: Record<string, unknown>) {
  const item = await inventario.get(id);
  if (!item) throw new AppError("Producto no encontrado", 404);
  const tipo = (["ENTRADA", "SALIDA", "AJUSTE"] as const).includes(body.tipo as MovInventario["tipo"])
    ? (body.tipo as MovInventario["tipo"])
    : "AJUSTE";
  const cantidad = Number(body.cantidad);
  if (!Number.isFinite(cantidad) || cantidad < 0) throw new AppError("Cantidad no válida");

  let nueva = item.cantidad;
  if (tipo === "ENTRADA") nueva += cantidad;
  if (tipo === "SALIDA") {
    if (cantidad > item.cantidad) throw new AppError(`Solo hay ${item.cantidad} ${item.unidad} de ${item.producto}`);
    nueva -= cantidad;
  }
  if (tipo === "AJUSTE") nueva = cantidad;

  let gastoId: string | null = null;
  const costo = Number(body.costoTotal) || 0;
  if (tipo === "ENTRADA" && costo > 0) {
    const g = await crearGasto({
      concepto: `Compra ${item.producto} (${cantidad} ${item.unidad})`,
      rubro: "Insumos",
      area: item.area ?? "COMIDA",
      fuente: body.fuente ?? "CAJA_MENOR",
      monto: costo,
    });
    gastoId = g.id;
  }

  await inventario.update(id, {
    cantidad: nueva,
    ...(tipo === "ENTRADA" && costo > 0 && cantidad > 0 ? { costoUnitario: Math.round(costo / cantidad) } : {}),
  });
  await movInventario.create({
    itemId: id,
    producto: item.producto,
    fecha: nowIso(),
    tipo,
    cantidad,
    nota: texto(body.nota, "nota", false),
    gastoId,
  });
  return { cantidad: nueva };
}

// ---------------------------------------------------------------- Comedor
export async function listVentas(periodo = periodoDe()) {
  return (await ventas.list({ periodo })).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function crearVenta(body: Record<string, unknown>) {
  await assertAbierto();
  const fecha = nowIso();
  const pago = (["Efectivo", "Transferencia", "Contrato", "Cargo a habitación"] as const).includes(body.pago as Venta["pago"])
    ? (body.pago as Venta["pago"])
    : "Efectivo";
  const tipo = (["Desayuno", "Almuerzo", "Cena", "Otro"] as const).includes(body.tipo as Venta["tipo"]) ? (body.tipo as Venta["tipo"]) : "Otro";
  const total = num(body.total, "total", { allowZero: false });
  const stayId = pago === "Cargo a habitación" ? texto(body.stayId, "la habitación a la que se carga") : null;

  const venta = await ventas.create({
    fecha,
    periodo: periodoDe(fecha),
    hora: horaDe(fecha),
    tipo,
    cliente: texto(body.cliente ?? "Mostrador", "cliente", false) || "Mostrador",
    pago,
    stayId,
    total,
  });
  if (stayId) {
    try {
      await addConsumo(stayId, `${tipo} (${horaDe(fecha)})`, total, venta.id);
    } catch (e) {
      await ventas.remove(venta.id);
      throw e;
    }
  }
  return venta;
}

export async function eliminarVenta(id: string) {
  const v = await ventas.get(id);
  if (!v) throw new AppError("Venta no encontrada", 404);
  await assertAbierto(v.fecha);
  if (v.stayId) {
    const s = await stays.get(v.stayId);
    if (s && s.estado === "ACTIVA") {
      await stays.update(s.id, { consumos: s.consumos.filter((c) => (c as { ventaId?: string }).ventaId !== id) });
    } else if (s) {
      throw new AppError("Esta venta ya se facturó en el check-out del huésped");
    }
  }
  await ventas.remove(id);
  return { ok: true };
}

// ---------------------------------------------------------------- Ganancias por área / cierre
export async function resumenPeriodo(periodo = periodoDe()) {
  await ensureData();
  const [p, v, g, res, cierre] = await Promise.all([
    pagos.list({ periodo }),
    ventas.list({ periodo }),
    gastos.list({ periodo }),
    activeResidents(),
    cierreDe(periodo),
  ]);
  const vigentes = p.filter((x) => !x.anulado);

  const areas: Record<Area, { ingresos: number; gastos: number; neto: number }> = {
    HABITACIONES: { ingresos: 0, gastos: 0, neto: 0 },
    COMIDA: { ingresos: 0, gastos: 0, neto: 0 },
    GENERAL: { ingresos: 0, gastos: 0, neto: 0 },
  };

  const det = {
    pensionHabitacion: 0,
    pensionComida: 0,
    hotelAlojamiento: 0,
    hotelAusentes: 0,
    hotelConsumos: 0,
    comedor: 0,
  };

  for (const pago of vigentes) {
    for (const l of pago.lineas) {
      areas[l.area].ingresos += l.monto;
      if (pago.origen === "HOTEL") {
        if (l.area === "HABITACIONES") {
          det.hotelAlojamiento += l.monto;
          if (l.concepto.includes("pensionado ausente")) det.hotelAusentes += l.monto;
        } else det.hotelConsumos += l.monto;
      } else if (l.area === "COMIDA") det.pensionComida += l.monto;
      else det.pensionHabitacion += l.monto;
    }
  }
  // Ventas cobradas directamente (las de contrato están en la pensión y las cargadas a la habitación se cobran en el check-out).
  for (const venta of v) {
    if (venta.pago === "Efectivo" || venta.pago === "Transferencia") {
      areas.COMIDA.ingresos += venta.total;
      det.comedor += venta.total;
    }
  }

  const porRubro = new Map<string, { area: Area; monto: number }>();
  for (const gasto of g) {
    areas[gasto.area].gastos += gasto.monto;
    const key = `${gasto.area}|${gasto.rubro}`;
    porRubro.set(key, { area: gasto.area, monto: (porRubro.get(key)?.monto ?? 0) + gasto.monto });
  }
  for (const a of Object.values(areas)) a.neto = a.ingresos - a.gastos;

  const ingresos = Object.values(areas).reduce((s, a) => s + a.ingresos, 0);
  const egresos = Object.values(areas).reduce((s, a) => s + a.gastos, 0);
  const porMetodo: Record<string, number> = {};
  for (const pago of vigentes) porMetodo[pago.metodo] = (porMetodo[pago.metodo] ?? 0) + pago.total;
  for (const venta of v) {
    if (venta.pago === "Efectivo" || venta.pago === "Transferencia") porMetodo[venta.pago] = (porMetodo[venta.pago] ?? 0) + venta.total;
  }

  const deudores = res.filter((r) => r.saldo > 0);
  return {
    periodo,
    periodoLabel: periodoLabel(periodo),
    cerrado: Boolean(cierre?.cerrado),
    areas,
    detalle: det,
    gastosPorRubro: [...porRubro.entries()].map(([k, x]) => ({ rubro: k.split("|")[1], area: x.area, monto: x.monto })).sort((a, b) => b.monto - a.monto),
    porMetodo,
    ingresos,
    gastos: egresos,
    utilidadNeta: ingresos - egresos,
    facturas: vigentes.length,
    porCobrar: deudores.reduce((s, r) => s + r.saldo, 0),
    pendientes: deudores.length,
  };
}

export async function cerrarPeriodo(periodo: string, reabrir = false) {
  if (!/^\d{4}-\d{2}$/.test(periodo)) throw new AppError("Periodo no válido");
  if (reabrir) {
    await config.upsert(`cierre-${periodo}`, { cerrado: false, reabiertoEn: nowIso() });
    return { cerrado: false };
  }
  const resumen = await resumenPeriodo(periodo);
  await config.upsert(`cierre-${periodo}`, { cerrado: true, cerradoEn: nowIso(), resumen });
  return { cerrado: true };
}

export async function dashboard() {
  await ensureData();
  const periodo = periodoDe();
  const [resumen, roomList, c, pend, inv, ultPagos, ultGastos, ultVentas, res] = await Promise.all([
    resumenPeriodo(periodo),
    listRooms(),
    caja(),
    reportes.list({ estado: "PENDIENTE" }),
    listInventario(),
    pagos.list({ periodo }),
    gastos.list({ periodo }),
    ventas.list({ periodo }),
    activeResidents(),
  ]);

  const movimientos = [
    ...ultPagos.filter((x) => !x.anulado).map((x) => ({ fecha: x.fecha, concepto: `${x.numero} · ${x.cliente}`, detalle: `Hab. ${x.habitacion}`, origen: x.metodo, monto: x.total, ingreso: true })),
    ...ultGastos.map((x) => ({ fecha: x.fecha, concepto: x.concepto, detalle: `${x.rubro} · ${x.area.toLowerCase()}`, origen: x.fuente === "CAJA_MENOR" ? "Caja menor" : x.fuente === "BANCO" ? "Banco" : "Efectivo", monto: x.monto, ingreso: false })),
    ...ultVentas
      .filter((x) => x.pago === "Efectivo" || x.pago === "Transferencia")
      .map((x) => ({ fecha: x.fecha, concepto: `${x.tipo} · ${x.cliente}`, detalle: "Comedor", origen: x.pago, monto: x.total, ingreso: true })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 10);

  const hoy = local().toISOString().slice(0, 10);
  const ventasHoy = ultVentas.filter((x) => local(x.fecha).toISOString().slice(0, 10) === hoy);

  const alertas = [
    ...(pend.length ? [{ titulo: `${pend.length} pago(s) por verificar`, detalle: "Reportados desde el portal del pensionado", urgent: true }] : []),
    ...inv.filter((i) => i.estado !== "OK").map((i) => ({ titulo: `${i.producto}: ${i.estado.toLowerCase()}`, detalle: `Quedan ${i.cantidad} ${i.unidad} (mínimo ${i.minimo})`, urgent: i.estado === "Agotado" })),
    ...res
      .filter((r) => r.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo)
      .slice(0, 6)
      .map((r) => ({ titulo: r.nombre, detalle: `Debe ${r.saldo.toLocaleString("es-CO")} · Hab. ${r.habitacion}`, urgent: r.saldo >= r.tarifaHabitacion + comidaMensualEquivalente(r) })),
  ];

  return {
    periodo,
    periodoLabel: resumen.periodoLabel,
    kpis: {
      ingresosMes: resumen.ingresos,
      gastosMes: resumen.gastos,
      utilidadMes: resumen.utilidadNeta,
      cajaMenor: c.saldo,
      cajaBase: c.base,
      cuentasPorCobrar: resumen.porCobrar,
      pendientes: resumen.pendientes,
      porVerificar: pend.length,
      libres: roomList.filter((r) => r.estado === "LIBRE").length,
    },
    areas: resumen.areas,
    ocupacion: {
      total: roomList.length,
      pens: roomList.filter((r) => r.estado === "PENS").length,
      hotel: roomList.filter((r) => r.estado === "HOTEL").length,
      libres: roomList.filter((r) => r.estado === "LIBRE").length,
      sucias: roomList.filter((r) => r.estado === "SUCIA" || r.estado === "MANT").length,
      ausentes: roomList.filter((r) => r.pensionAusente && !r.stay).length,
      personas: roomList.reduce((a, r) => a + r.personas, 0),
      camas: roomList.reduce((a, r) => a + r.capacidad, 0),
    },
    comidasHoy: {
      desayunos: ventasHoy.filter((x) => x.tipo === "Desayuno").length,
      almuerzos: ventasHoy.filter((x) => x.tipo === "Almuerzo").length,
      cenas: ventasHoy.filter((x) => x.tipo === "Cena").length,
    },
    alertas,
    movimientos,
  };
}
