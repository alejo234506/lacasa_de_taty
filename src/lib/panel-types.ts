export interface DashboardData {
  kpis: {
    banco: number;
    cajaMayor: number;
    cajaMenor: number;
    cuentasPorCobrar: number;
    ingresosMes: number;
    pendientes: number;
    libres: number;
  };
  ocupacion: { pens: number; hotel: number; libres: number; sucias: number };
  movimientos: { concepto: string; detalle: string; origen: string; monto: number; ingreso: boolean }[];
  alertas: { titulo: string; detalle: string; urgent: boolean }[];
}

export interface CierreData {
  cerrado: boolean;
  ingresosBanco: number;
  ingresosEfectivo: number;
  lineas: { concepto: string; monto: number; ingreso: boolean }[];
  balanceNeto: number;
  porCobrar?: number;
  pendientes?: number;
}

export interface ResidentRow {
  id: string;
  nombre: string;
  documento: string;
  habitacion: string;
  grupo: string;
  comidaIncluida: boolean;
  tarifaMensual: number;
  saldo: number;
  estudios: string;
  link: string;
}

export interface Sale {
  id: string;
  hora: string;
  tipo: string;
  cliente: string;
  pago: string;
  total: number;
  createdAt?: string;
}

export interface Expense {
  id: string;
  concepto: string;
  rubro: string;
  monto: number;
}

export interface InventoryItem {
  id: string;
  producto: string;
  cantidad: number;
  unidad: string;
  estado: string;
}

export interface CajaData {
  saldo: number;
  base: number;
  gastos: Expense[];
  inventario: InventoryItem[];
}

export type PanelResource = "rooms" | "dashboard" | "cierre" | "residents" | "sales" | "caja";
