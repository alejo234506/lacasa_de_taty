// Tipos de las respuestas del API para el panel (solo tipos: no se envía código del servidor al cliente).
import type {
  dashboard,
  getCaja,
  listReportes,
  listVentas,
  resumenPeriodo,
  estadoCuenta,
} from "./domain/service";

export type { RoomView, ResidentView, StayView } from "./domain/service";
export type { Pago, Area, MetodoPago, PlanComida, PeriodoTarifa } from "./domain/types";
export { PERIODOS } from "./domain/types";

export type DashboardData = Awaited<ReturnType<typeof dashboard>>;
export type CierreData = Awaited<ReturnType<typeof resumenPeriodo>>;
export type CajaData = Awaited<ReturnType<typeof getCaja>>;
export type Sale = Awaited<ReturnType<typeof listVentas>>[number];
export type ReporteRow = Awaited<ReturnType<typeof listReportes>>[number];
export type EstadoCuenta = Awaited<ReturnType<typeof estadoCuenta>>;

export type PanelResource = "rooms" | "dashboard" | "cierre" | "residents" | "sales" | "caja" | "pagos" | "reportes";

export const AREA_LABEL = {
  HABITACIONES: "Habitaciones",
  COMIDA: "Comida",
  GENERAL: "General",
} as const;

export const METODOS_PAGO = ["Transferencia", "Nequi", "Daviplata", "Efectivo", "Tarjeta", "Otro"] as const;
