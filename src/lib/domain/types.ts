// Entidades del negocio. Todo se guarda como documentos con `id` string.

export type RoomBaseStatus = "LIBRE" | "SUCIA" | "MANT";
export type RoomStatus = "PENS" | "HOTEL" | "LIBRE" | "SUCIA" | "MANT";
export type Area = "HABITACIONES" | "COMIDA" | "GENERAL";
export type PlanComida = "NINGUNO" | "SEMANAL" | "MENSUAL";
export type Grupo = "REGULAR_13_20" | "MEDICINA_30_05";
export type MetodoPago = "Efectivo" | "Transferencia" | "Nequi" | "Daviplata" | "Tarjeta" | "Otro";

export const MAX_PERSONAS_HABITACION = 4;

/** Cómo se cobra una habitación: por día, por semana o por mes. */
export type PeriodoTarifa = "DIA" | "SEMANA" | "MES";
export const PERIODOS: Record<PeriodoTarifa, { label: string; unidad: string; unidades: string; dias: number }> = {
  DIA: { label: "Por día", unidad: "día", unidades: "días", dias: 1 },
  SEMANA: { label: "Por semana", unidad: "semana", unidades: "semanas", dias: 7 },
  MES: { label: "Por mes", unidad: "mes", unidades: "meses", dias: 30 },
};

export interface Room {
  id: string;
  numero: string;
  tipo: string;
  capacidad: number; // 1..4
  periodo: PeriodoTarifa;
  tarifa: number; // valor por periodo
  estadoBase: RoomBaseStatus;
  notas: string;
  cuentaId: string | null; // habitaciones unidas en una sola cuenta
  cuentaNombre: string;
}

export interface Resident {
  id: string;
  nombre: string;
  documento: string;
  telefono: string;
  habitacion: string; // número de habitación
  grupo: Grupo;
  estudios: string;
  tarifaHabitacion: number; // mensual
  planComida: PlanComida;
  tarifaComida: number; // valor por semana o por mes según el plan
  saldo: number; // positivo = debe
  ausente: boolean; // no está: su habitación se puede alquilar por noches
  accessToken: string;
  activo: boolean;
  createdAt: string;
}

export interface Stay {
  id: string;
  roomIds: string[];
  huesped: string;
  documento: string;
  telefono: string;
  personas: number;
  periodo: PeriodoTarifa;
  tarifa: number; // total por periodo de todas las habitaciones
  desde: string; // ISO
  hastaPrevisto: string; // ISO
  consumos: { concepto: string; monto: number; fecha: string; ventaId?: string }[];
  estado: "ACTIVA" | "CERRADA";
  cerradaEn: string | null;
  facturaId: string | null;
  deAusente?: boolean; // alquiler de la habitación de un pensionado ausente
}

export interface Cargo {
  id: string;
  residentId: string;
  fecha: string;
  periodo: string; // YYYY-MM
  concepto: string;
  area: Area;
  monto: number;
}

export interface FacturaLinea {
  concepto: string;
  area: Area;
  monto: number;
}

export interface Pago {
  id: string;
  numero: string; // FAC-000001
  fecha: string;
  periodo: string; // YYYY-MM en que entra el dinero
  origen: "PENSION" | "HOTEL" | "CUENTA";
  residentIds: string[];
  stayId: string | null;
  cuentaId: string | null;
  cliente: string;
  documento: string;
  habitacion: string;
  metodo: MetodoPago;
  referencia: string;
  comprobante: string; // descripción en texto de la captura enviada
  lineas: FacturaLinea[];
  total: number;
  saldoAnterior: number;
  saldoNuevo: number;
  registradoPor: string;
  anulado: boolean;
  asignaciones?: { residentId: string; monto: number }[]; // cuánto se abonó a cada pensionado
}

export interface ReportePago {
  id: string;
  residentId: string;
  fecha: string;
  monto: number;
  metodo: MetodoPago;
  referencia: string;
  comprobante: string;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  pagoId: string | null;
  motivo: string;
}

export interface Gasto {
  id: string;
  fecha: string;
  periodo: string;
  concepto: string;
  rubro: string;
  area: Area;
  fuente: "CAJA_MENOR" | "BANCO" | "EFECTIVO";
  monto: number;
}

export interface Venta {
  id: string;
  fecha: string;
  periodo: string;
  hora: string;
  tipo: "Desayuno" | "Almuerzo" | "Cena" | "Otro";
  cliente: string;
  pago: "Efectivo" | "Transferencia" | "Contrato" | "Cargo a habitación";
  stayId: string | null;
  total: number;
}

export interface InventarioItem {
  id: string;
  producto: string;
  cantidad: number;
  unidad: string;
  minimo: number;
  costoUnitario: number;
  area: Area;
}

export interface MovInventario {
  id: string;
  itemId: string;
  producto: string;
  fecha: string;
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
  cantidad: number;
  nota: string;
  gastoId: string | null;
}

export interface Config {
  id: string; // "caja" | "cierre-YYYY-MM" | ...
  [k: string]: unknown;
}
