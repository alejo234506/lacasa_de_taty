export const NOMBRES = [
  "Rosalba Pérez", "Hernando Díaz", "Gloria Sánchez", "Ana Lucía Rojas",
  "Miguel Ospina", "Carmen Villalba", "Jairo Restrepo", "Luz Marina Cano",
  "Álvaro Beltrán", "Nohemí Cuadros", "Ricardo Salcedo", "Teresa Mendoza",
  "Fabio Quintero", "Mariela Ardila", "Óscar Pineda", "Blanca Torres",
  "Emma Whitfield", "Daniel Kramer", "Sofía Guerra", "Julián Mora",
  "Helen Cartwright", "Norberto Ruiz", "Aura Cifuentes", "Pedro Nel Gómez",
];

export const TIPOS = ["Individual", "Doble", "Suite", "Compartida"] as const;
export const PATRON = ["PENS", "PENS", "LIBRE", "HOTEL", "PENS", "SUCIA", "HOTEL", "LIBRE", "PENS", "MANT", "PENS", "HOTEL"] as const;

export type RoomStatus = "PENS" | "HOTEL" | "LIBRE" | "SUCIA" | "MANT";

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

export interface Room {
  id: number;
  numero: string;
  tipo: string;
  estado: RoomStatus;
  ocupante: string;
  tarifa: number;
  desde: string;
  hasta: string;
  consumos: number;
}

export function generateRooms(): Room[] {
  const out: Room[] = [];
  let n = 0;
  for (let piso = 1; piso <= 3; piso++) {
    for (let i = 1; i <= 16; i++, n++) {
      const est = PATRON[n % PATRON.length];
      out.push({
        id: n,
        numero: `${piso}${String(i).padStart(2, "0")}`,
        tipo: TIPOS[n % TIPOS.length],
        estado: est,
        ocupante:
          est === "PENS" || est === "HOTEL"
            ? NOMBRES[n % NOMBRES.length]
            : est === "SUCIA"
              ? "Salida 10:40 a.m."
              : est === "MANT"
                ? "Cambio de sifón"
                : "Disponible",
        tarifa: est === "PENS" ? 1250000 + (n % 4) * 90000 : 95000 + (n % 5) * 15000,
        desde: est === "PENS" ? "01 feb 2026" : "29 ago 2026",
        hasta: est === "PENS" ? "Contrato abierto" : "02 sep 2026",
        consumos: (n % 3) * 18000,
      });
    }
  }
  return out;
}

export type AdminView =
  | "dashboard"
  | "rack"
  | "pensionados"
  | "comedor"
  | "minuta"
  | "caja"
  | "cierre"
  | "recibo";

export interface Recibo {
  numero: string;
  cliente: string;
  documento: string;
  hab: string;
  concepto: string;
  extra: string | null;
  monto: number;
  saldo: number;
  grupo: string;
  ventana: string;
}

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
  { key: "dashboard" as AdminView, label: "Dashboard", badge: "" },
  { key: "rack" as AdminView, label: "Rack de habitaciones", badge: "libres" },
  { key: "pensionados" as AdminView, label: "Pensionados y cobros", badge: "por_cobrar" },
  { key: "comedor" as AdminView, label: "Comedor y ventas", badge: "" },
  { key: "minuta" as AdminView, label: "Minuta mensual", badge: "" },
  { key: "caja" as AdminView, label: "Caja menor e inventario", badge: "" },
  { key: "cierre" as AdminView, label: "Cierre de mes", badge: "" },
  { key: "recibo" as AdminView, label: "Recibo imprimible", badge: "" },
];

export const TITULOS: Record<AdminView, [string, string]> = {
  dashboard: ["Resumen del día", "Panorama financiero"],
  rack: ["Operación", "Rack de habitaciones"],
  pensionados: ["Cartera", "Pensionados mensuales"],
  comedor: ["Comedor", "Desayuno, almuerzos y cenas"],
  minuta: ["Comedor", "Minuta de septiembre"],
  caja: ["Tesorería", "Caja menor e insumos"],
  cierre: ["Contabilidad", "Cierre de agosto 2026"],
  recibo: ["Documento", "Recibo de caja"],
};
