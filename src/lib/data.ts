import type { RoomStatus } from "./domain/types";
export type { RoomStatus };

export const EST: Record<RoomStatus, { label: string; color: string; bg: string; bar: string }> = {
  PENS: { label: "Pensionado", color: "#7a0d20", bg: "#f8eef0", bar: "#7a0d20" },
  HOTEL: { label: "Hotel / noche", color: "#201e1d", bg: "#f2eeec", bar: "#201e1d" },
  LIBRE: { label: "Libre", color: "#7d7979", bg: "#fbf9f8", bar: "#d7d3d3" },
  SUCIA: { label: "Sucia", color: "#605d5d", bg: "#eae7e7", bar: "#9b9797" },
  MANT: { label: "Mantenimiento", color: "#444141", bg: "#d7d3d3", bar: "#444141" },
};

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const MINUTA_BASE: [string, string, string][] = [
  ["Arepa con queso y chocolate", "Sancocho de gallina", "Arroz con pollo"],
  ["Huevos pericos con arepa", "Sudado de res, papa y yuca", "Sopa de verduras y arepa"],
  ["Calentado con café", "Pescado frito con patacón", "Pasta en salsa de tomate"],
  ["Pan con mantequilla y jugo", "Lentejas con carne molida", "Caldo de costilla"],
  ["Changua con pan", "Bandeja de cerdo y ensalada", "Perro caliente y jugo"],
  ["Arepa de huevo y jugo", "Arroz con camarón", "Arepa de huevo y chocolate"],
  ["Cereal, fruta y café", "Ajiaco santafereño", "Tamal y pan"],
];

export type AdminView =
  | "dashboard"
  | "rack"
  | "pensionados"
  | "pagos"
  | "comedor"
  | "minuta"
  | "caja"
  | "cierre"
  | "recibo";

export const PENS_BASE = [
  ["Rosalba Pérez", "1.032.884.117", "204", "REGULAR_13_20", true, 1290000, 0, "Trabajo remoto"],
  ["Hernando Díaz", "19.442.005", "108", "MEDICINA_30_05", true, 1420000, 1420000, "Medicina"],
  ["Gloria Sánchez", "41.778.230", "212", "REGULAR_13_20", false, 980000, 490000, "Enfermería"],
  ["Ana Lucía Rojas", "52.900.441", "301", "MEDICINA_30_05", true, 1420000, 0, "Medicina"],
  ["Miguel Ospina", "79.114.882", "115", "REGULAR_13_20", true, 1290000, 1290000, "Derecho"],
  ["Carmen Villalba", "24.669.310", "309", "MEDICINA_30_05", false, 1050000, 0, "Odontología"],
  ["Jairo Restrepo", "70.552.918", "111", "REGULAR_13_20", true, 1340000, 670000, "Ingeniería civil"],
  ["Luz Marina Cano", "39.887.102", "205", "MEDICINA_30_05", true, 1420000, 1420000, "Medicina"],
  ["Álvaro Beltrán", "17.223.640", "316", "REGULAR_13_20", false, 980000, 0, "Contaduría"],
  ["Nohemí Cuadros", "43.109.775", "208", "MEDICINA_30_05", true, 1490000, 745000, "Medicina"],
] as const;

export const INV_BASE = [
  ["Arroz", 48, "kg", "OK"],
  ["Aceite", 12, "litros", "Bajo"],
  ["Pollo", 26, "kg", "OK"],
  ["Carne de res", 18, "kg", "OK"],
  ["Papa", 60, "kg", "OK"],
  ["Panela", 9, "kg", "Bajo"],
  ["Huevos", 15, "cubetas", "OK"],
  ["Gas propano", 1, "cilindro", "Crítico"],
  ["Café", 6, "kg", "OK"],
] as const;

export const NAV_ITEMS = [
  { key: "dashboard" as AdminView, label: "Resumen", badge: "" },
  { key: "rack" as AdminView, label: "Habitaciones", badge: "libres" },
  { key: "pensionados" as AdminView, label: "Pensionados y cobros", badge: "por_cobrar" },
  { key: "pagos" as AdminView, label: "Pagos y facturas", badge: "por_verificar" },
  { key: "comedor" as AdminView, label: "Comedor y ventas", badge: "" },
  { key: "minuta" as AdminView, label: "Minuta semanal", badge: "" },
  { key: "caja" as AdminView, label: "Gastos e inventario", badge: "" },
  { key: "cierre" as AdminView, label: "Ganancias y cierre", badge: "" },
];

export const TITULOS: Record<AdminView, [string, string]> = {
  dashboard: ["Resumen del mes", "Panorama general"],
  rack: ["Operación", "Habitaciones"],
  pensionados: ["Cartera", "Pensionados y cobros"],
  pagos: ["Tesorería", "Pagos y facturas"],
  comedor: ["Comedor", "Desayunos, almuerzos y cenas"],
  minuta: ["Comedor", "Minuta semanal"],
  caja: ["Tesorería", "Gastos, caja menor e inventario"],
  cierre: ["Contabilidad", "Ganancias netas y cierre"],
  recibo: ["Documento", "Factura"],
};
