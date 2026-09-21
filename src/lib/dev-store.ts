import { randomUUID } from "crypto";
import {
  PENS_BASE,
  DIAS,
  MINUTA_BASE,
  INV_BASE,
  generateRooms,
  type Room,
  type RoomStatus,
} from "./data";

export interface DevResident {
  id: string;
  nombre: string;
  documento: string;
  habitacion: string;
  grupo: "REGULAR_13_20" | "MEDICINA_30_05";
  comidaIncluida: boolean;
  tarifaMensual: number;
  saldo: number;
  accessToken: string;
  activo: boolean;
  estudios: string;
}

export interface DevSale {
  id: string;
  hora: string;
  tipo: "Desayuno" | "Almuerzo" | "Cena";
  cliente: string;
  pago: "Efectivo" | "Banco" | "Contrato" | "Cargo a habitación";
  total: number;
  createdAt: string;
}

export interface DevExpense {
  id: string;
  concepto: string;
  rubro: string;
  monto: number;
  createdAt: string;
}

export interface DevInventoryItem {
  id: string;
  producto: string;
  cantidad: number;
  unidad: string;
}

export interface DevMinutaWeek {
  mes: string;
  semana: number;
  dias: { dia: string; desayuno: string; almuerzo: string; cena: string }[];
}

const devResidents: DevResident[] = PENS_BASE.map((p, i) => {
  const [nombre, documento, habitacion, grupo, comida, tarifa, saldo, estudios] = p;
  return {
    id: `dev-${i}`,
    nombre,
    documento,
    habitacion,
    grupo: grupo as "REGULAR_13_20" | "MEDICINA_30_05",
    comidaIncluida: comida,
    tarifaMensual: tarifa,
    saldo,
    estudios,
    accessToken: randomUUID(),
    activo: true,
  };
});

let devRooms: Room[] = generateRooms();

const devSales: DevSale[] = [
  { id: "s1", hora: "07:15", tipo: "Desayuno", cliente: "Mostrador", pago: "Efectivo", total: 8000, createdAt: new Date().toISOString() },
  { id: "s2", hora: "12:05", tipo: "Almuerzo", cliente: "Mostrador", pago: "Efectivo", total: 15000, createdAt: new Date().toISOString() },
  { id: "s3", hora: "18:30", tipo: "Cena", cliente: "Mostrador", pago: "Efectivo", total: 24000, createdAt: new Date().toISOString() },
];

const devExpenses: DevExpense[] = [
  { id: "e1", concepto: "Verduras y plátano", rubro: "Insumos comida", monto: 86000, createdAt: new Date().toISOString() },
  { id: "e2", concepto: "Pollo 12 kg", rubro: "Insumos comida", monto: 148000, createdAt: new Date().toISOString() },
  { id: "e3", concepto: "Bombillos y cinta", rubro: "Mantenimiento", monto: 34000, createdAt: new Date().toISOString() },
  { id: "e4", concepto: "Transporte plaza", rubro: "Otros", monto: 20000, createdAt: new Date().toISOString() },
  { id: "e5", concepto: "Detergente y cloro", rubro: "Aseo", monto: 52000, createdAt: new Date().toISOString() },
  { id: "e6", concepto: "Gas cocina", rubro: "Insumos comida", monto: 115000, createdAt: new Date().toISOString() },
];

const devInventory: DevInventoryItem[] = INV_BASE.map(([producto, cantidad, unidad], i) => ({
  id: `inv-${i}`,
  producto,
  cantidad,
  unidad,
}));

const devMinuta: Record<string, DevMinutaWeek> = {};

let devCajaSaldo = 320000;
const devCajaBase = 500000;
let devCerrado = false;
let devReciboCounter = 4120;

function link(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/mi-casa/${token}`;
}

function minutaKey(mes: string, semana: number) {
  return `${mes}-${semana}`;
}

function ensureMinuta(mes: string, semana: number): DevMinutaWeek {
  const key = minutaKey(mes, semana);
  if (!devMinuta[key]) {
    devMinuta[key] = {
      mes,
      semana,
      dias: DIAS.map((dia, i) => {
        const shift = (i + semana) % 7;
        return {
          dia,
          desayuno: MINUTA_BASE[shift][0],
          almuerzo: MINUTA_BASE[shift][1],
          cena: MINUTA_BASE[shift][2],
        };
      }),
    };
  }
  return devMinuta[key];
}

function inventoryEstado(cantidad: number, producto: string): string {
  if (producto === "Gas propano" && cantidad <= 1) return "Crítico";
  if (cantidad <= 12) return "Bajo";
  return "OK";
}

export const DEV_STAFF_ID = "dev-staff-taty";

// --- Residents ---
export function getDevResidents() {
  return devResidents.filter((r) => r.activo);
}

export function getDevResidentById(id: string) {
  return devResidents.find((r) => r.id === id) ?? null;
}

export function getDevResidentByToken(token: string) {
  return devResidents.find((r) => r.accessToken === token && r.activo) ?? null;
}

export function createDevResident(data: Omit<DevResident, "id" | "accessToken" | "activo">) {
  const resident: DevResident = {
    ...data,
    id: `dev-${randomUUID().slice(0, 8)}`,
    accessToken: randomUUID(),
    activo: true,
  };
  devResidents.push(resident);
  return resident;
}

export function updateDevResident(id: string, data: Partial<DevResident>) {
  const idx = devResidents.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  devResidents[idx] = { ...devResidents[idx], ...data };
  return devResidents[idx];
}

export function deleteDevResident(id: string) {
  return updateDevResident(id, { activo: false });
}

export function regenerateDevResidentLink(id: string) {
  const resident = updateDevResident(id, { accessToken: randomUUID() });
  if (!resident) return null;
  return { link: link(resident.accessToken) };
}

export function devResidentToJson(r: DevResident) {
  return {
    id: r.id,
    nombre: r.nombre,
    documento: r.documento,
    habitacion: r.habitacion,
    grupo: r.grupo,
    comidaIncluida: r.comidaIncluida,
    tarifaMensual: r.tarifaMensual,
    saldo: r.saldo,
    estudios: r.estudios || "",
    link: link(r.accessToken),
  };
}

// --- Minuta ---
export function getDevMinutaWeek(mes: string, semana: number) {
  return ensureMinuta(mes, semana);
}

export function getDevMinuta() {
  const mes = new Date().toISOString().slice(0, 7);
  return ensureMinuta(mes, 1).dias;
}

export function saveDevMinuta(mes: string, semana: number, dias: DevMinutaWeek["dias"]) {
  devMinuta[minutaKey(mes, semana)] = { mes, semana, dias };
  return devMinuta[minutaKey(mes, semana)];
}

// --- Rooms ---
export function getDevRooms() {
  return devRooms;
}

export function updateDevRoom(id: number, data: Partial<Room>) {
  const idx = devRooms.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  devRooms[idx] = { ...devRooms[idx], ...data };
  return devRooms[idx];
}

export function devRoomAction(
  id: number,
  action: "checkin" | "checkout" | "limpiar" | "mantenimiento" | "consumo",
  payload?: { ocupante?: string; tarifa?: number; consumo?: number }
) {
  const room = devRooms.find((r) => r.id === id);
  if (!room) return null;

  switch (action) {
    case "checkin":
      return updateDevRoom(id, {
        estado: payload?.tarifa && payload.tarifa > 200000 ? ("PENS" as RoomStatus) : ("HOTEL" as RoomStatus),
        ocupante: payload?.ocupante || "Huésped nuevo",
        tarifa: payload?.tarifa || room.tarifa,
        desde: new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }),
        hasta: payload?.tarifa && payload.tarifa > 200000 ? "Contrato abierto" : "Por definir",
        consumos: 0,
      });
    case "checkout":
      return updateDevRoom(id, {
        estado: "SUCIA" as RoomStatus,
        ocupante: "Salida " + new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
        hasta: new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }),
      });
    case "limpiar":
      return updateDevRoom(id, {
        estado: "LIBRE" as RoomStatus,
        ocupante: "Disponible",
        consumos: 0,
      });
    case "mantenimiento":
      return updateDevRoom(id, {
        estado: "MANT" as RoomStatus,
        ocupante: payload?.ocupante || "En mantenimiento",
      });
    case "consumo":
      return updateDevRoom(id, {
        consumos: room.consumos + (payload?.consumo || 18000),
      });
    default:
      return room;
  }
}

// --- Sales ---
export function getDevSales() {
  return [...devSales].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createDevSale(data: Omit<DevSale, "id" | "createdAt" | "hora"> & { hora?: string }) {
  const sale: DevSale = {
    ...data,
    id: `s-${randomUUID().slice(0, 8)}`,
    hora: data.hora || new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    createdAt: new Date().toISOString(),
  };
  devSales.unshift(sale);
  return sale;
}

export function deleteDevSale(id: string) {
  const idx = devSales.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  devSales.splice(idx, 1);
  return true;
}

export function getDevMealCounts() {
  const today = new Date().toDateString();
  const todaySales = devSales.filter((s) => new Date(s.createdAt).toDateString() === today);
  return {
    desayunos: todaySales.filter((s) => s.tipo === "Desayuno").length,
    almuerzos: todaySales.filter((s) => s.tipo === "Almuerzo").length,
    cenas: todaySales.filter((s) => s.tipo === "Cena").length,
  };
}

// --- Caja ---
export function getDevCaja() {
  return { saldo: devCajaSaldo, base: devCajaBase, gastos: getDevExpenses(), inventario: getDevInventory() };
}

export function getDevExpenses() {
  return [...devExpenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createDevExpense(data: Omit<DevExpense, "id" | "createdAt">) {
  const expense: DevExpense = {
    ...data,
    id: `e-${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };
  devExpenses.unshift(expense);
  devCajaSaldo = Math.max(0, devCajaSaldo - expense.monto);
  return expense;
}

export function deleteDevExpense(id: string) {
  const idx = devExpenses.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  devCajaSaldo += devExpenses[idx].monto;
  devExpenses.splice(idx, 1);
  return true;
}

export function reponerDevCaja(monto: number) {
  devCajaSaldo = Math.min(devCajaBase, devCajaSaldo + monto);
  return devCajaSaldo;
}

export function arqueoDevCaja(saldoReal: number) {
  const diff = saldoReal - devCajaSaldo;
  devCajaSaldo = saldoReal;
  return diff;
}

// --- Inventory ---
export function getDevInventory() {
  return devInventory.map((i) => ({
    ...i,
    estado: inventoryEstado(i.cantidad, i.producto),
  }));
}

export function updateDevInventory(id: string, cantidad: number) {
  const idx = devInventory.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  devInventory[idx].cantidad = cantidad;
  return { ...devInventory[idx], estado: inventoryEstado(cantidad, devInventory[idx].producto) };
}

// --- Cierre / Dashboard ---
export type ResidentFinance = {
  nombre: string;
  habitacion: string;
  saldo: number;
  tarifaMensual: number;
};

export function currentMinutaWeek(date = new Date()) {
  return Math.min(4, Math.max(1, Math.ceil(date.getDate() / 7)));
}

export function getDevCierre(residents: ResidentFinance[] = getDevResidents()) {
  const porCobrar = residents.filter((r) => r.saldo > 0);
  const totalCxC = porCobrar.reduce((s, r) => s + r.saldo, 0);
  const ventasComedor = devSales.reduce((s, v) => s + v.total, 0);
  const gastosTotal = devExpenses.reduce((s, e) => s + e.monto, 0);
  const pensiones = residents.reduce((s, r) => s + r.tarifaMensual, 0);
  const hotel = devRooms.filter((r) => r.estado === "HOTEL").length * 95000 * 4;

  return {
    cerrado: devCerrado,
    ingresosBanco: Math.round(pensiones * 0.65 + hotel * 0.8),
    ingresosEfectivo: Math.round(ventasComedor * 0.55 + devCajaSaldo),
    lineas: [
      { concepto: "Pensiones mensuales", monto: pensiones, ingreso: true },
      { concepto: "Hotel por noche", monto: hotel, ingreso: true },
      { concepto: "Ventas de comedor", monto: ventasComedor, ingreso: true },
      { concepto: "Gastos caja menor", monto: gastosTotal, ingreso: false },
      { concepto: "Servicios y operación", monto: 12680000, ingreso: false },
    ],
    balanceNeto: pensiones + hotel + ventasComedor - gastosTotal - 12680000,
    porCobrar: totalCxC,
    pendientes: porCobrar.length,
  };
}

export function cerrarDevPeriodo() {
  devCerrado = true;
  return devCerrado;
}

export function nextDevReciboNumber() {
  devReciboCounter += 1;
  return `RC-${devReciboCounter}`;
}

export function getDevDashboard(residents: ResidentFinance[] = getDevResidents()) {
  const rooms = getDevRooms();
  const cierre = getDevCierre(residents);
  const meals = getDevMealCounts();

  return {
    kpis: {
      banco: cierre.ingresosBanco,
      cajaMayor: 2350000,
      cajaMenor: devCajaSaldo,
      cuentasPorCobrar: cierre.porCobrar,
      ingresosMes: cierre.lineas.filter((l) => l.ingreso).reduce((s, l) => s + l.monto, 0),
      pendientes: cierre.pendientes,
      libres: rooms.filter((r) => r.estado === "LIBRE").length,
    },
    ocupacion: {
      pens: rooms.filter((r) => r.estado === "PENS").length,
      hotel: rooms.filter((r) => r.estado === "HOTEL").length,
      libres: rooms.filter((r) => r.estado === "LIBRE").length,
      sucias: rooms.filter((r) => r.estado === "SUCIA").length + rooms.filter((r) => r.estado === "MANT").length,
    },
    meals,
    alertas: residents
      .filter((r) => r.saldo > 0)
      .slice(0, 5)
      .map((r) => ({
        titulo: r.nombre,
        detalle: `Saldo pendiente · Hab. ${r.habitacion}`,
        urgent: r.saldo >= r.tarifaMensual,
      })),
    movimientos: [
      ...getDevSales().slice(0, 3).map((s) => ({
        concepto: `${s.tipo} · ${s.cliente}`,
        detalle: s.pago,
        origen: s.pago,
        monto: s.total,
        ingreso: true,
      })),
      ...getDevExpenses().slice(0, 3).map((e) => ({
        concepto: e.concepto,
        detalle: e.rubro,
        origen: "Caja menor",
        monto: e.monto,
        ingreso: false,
      })),
    ],
  };
}
