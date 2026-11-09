
import { create } from "zustand";
import { apiGet } from "./api-client";
import type { AdminView } from "./data";
import type {
  CajaData,
  CierreData,
  DashboardData,
  Pago,
  PanelResource,
  ReporteRow,
  ResidentView,
  RoomView,
  Sale,
} from "./panel-types";

const STALE_MS = 8_000;
const ALL_RESOURCES: PanelResource[] = ["rooms", "dashboard", "cierre", "residents", "sales", "caja", "pagos", "reportes"];

export type ToastTipo = "ok" | "error" | "info";
export interface Toast {
  id: number;
  tipo: ToastTipo;
  msg: string;
}
export interface Confirmacion {
  titulo: string;
  mensaje?: string;
  confirmar?: string;
  peligro?: boolean;
}

export type Intent =
  | "nuevo-pensionado"
  | "ver-deben"
  | "checkin"
  | "ver-huespedes"
  | "nueva-habitacion"
  | "ver-arreglo"
  | "nuevo-gasto"
  | "nuevo-producto";

interface AdminState {
  view: AdminView;
  moneda: "COP" | "USD";
  sel: string | null;
  toasts: Toast[];
  confirmacion: Confirmacion | null;
  recibo: Pago | null;
  rooms: RoomView[];
  dashboard: DashboardData | null;
  cierreData: CierreData | null;
  residents: ResidentView[];
  sales: Sale[];
  caja: CajaData | null;
  pagos: Pago[];
  reportes: ReporteRow[];
  panelLoading: boolean;
  panelRefreshing: boolean;
  panelError: string | null;
  lastSynced: number | null;
  /** Acción pendiente para la pantalla destino (p. ej. abrir el formulario de nuevo gasto al llegar). */
  intent: Intent | null;

  setView: (view: AdminView) => void;
  /** Lleva a una pantalla y le pide que haga algo apenas abra. */
  irA: (view: AdminView, intent?: Intent) => void;
  /** La pantalla destino toma la acción pendiente (una sola vez). */
  tomarIntent: (validos: Intent[]) => Intent | null;
  setMoneda: (moneda: "COP" | "USD") => void;
  setSel: (id: string | null) => void;
  /** Aviso flotante: verde si salió bien, rojo si falló, azul informativo. */
  flash: (msg: string, tipo?: ToastTipo) => void;
  cerrarToast: (id: number) => void;
  /** Ventana de confirmación propia (reemplaza window.confirm). Resuelve true si acepta. */
  confirmar: (c: Confirmacion) => Promise<boolean>;
  responderConfirmacion: (ok: boolean) => void;
  setRecibo: (recibo: Pago | null) => void;
  refreshPanel: (force?: boolean) => Promise<void>;
  refreshResources: (keys: PanelResource[]) => Promise<void>;
  /** Tras cualquier operación: recarga todo lo que puede haber cambiado. */
  refreshAll: () => Promise<void>;
}

let toastSeq = 0;
let resolverConfirmacion: ((ok: boolean) => void) | null = null;
const inflight = new Map<PanelResource, Promise<void>>();
let panelInflight: Promise<void> | null = null;

export const useAdminStore = create<AdminState>((set, get) => {
  async function loadResource(key: PanelResource) {
    const existing = inflight.get(key);
    if (existing) return existing;

    const task = (async () => {
      switch (key) {
        case "rooms":
          set({ rooms: await apiGet<RoomView[]>("/api/rooms") });
          break;
        case "dashboard":
          set({ dashboard: await apiGet<DashboardData>("/api/dashboard") });
          break;
        case "cierre":
          set({ cierreData: await apiGet<CierreData>("/api/cierre") });
          break;
        case "residents":
          set({ residents: await apiGet<ResidentView[]>("/api/residents") });
          break;
        case "sales":
          set({ sales: await apiGet<Sale[]>("/api/sales") });
          break;
        case "caja":
          set({ caja: await apiGet<CajaData>("/api/caja") });
          break;
        case "pagos":
          set({ pagos: await apiGet<Pago[]>("/api/pagos") });
          break;
        case "reportes":
          set({ reportes: await apiGet<ReporteRow[]>("/api/reportes") });
          break;
      }
    })().finally(() => {
      inflight.delete(key);
    });

    inflight.set(key, task);
    return task;
  }

  async function refreshResources(keys: PanelResource[]) {
    const hasData = Boolean(get().dashboard || get().rooms.length || get().residents.length);
    set({ panelRefreshing: true, panelError: null, panelLoading: !hasData });

    const results = await Promise.allSettled(keys.map((key) => loadResource(key)));
    const failed = results.filter((r) => r.status === "rejected").length;

    set({
      panelLoading: false,
      panelRefreshing: false,
      lastSynced: Date.now(),
      panelError: failed === keys.length ? "No se pudo actualizar la información" : failed > 0 ? "Algunos datos no se actualizaron" : null,
    });
  }

  return {
    view: "dashboard",
    moneda: "COP",
    sel: null,
    toasts: [],
    confirmacion: null,
    intent: null,
    recibo: null,
    rooms: [],
    dashboard: null,
    cierreData: null,
    residents: [],
    sales: [],
    caja: null,
    pagos: [],
    reportes: [],
    panelLoading: true,
    panelRefreshing: false,
    panelError: null,
    lastSynced: null,

    setView: (view) => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("casa_taty_admin_view", view);
      }
      set({ view });
    },
    irA: (view, intent) => {
      get().setView(view);
      set({ intent: intent ?? null });
    },
    tomarIntent: (validos) => {
      const i = get().intent;
      if (!i || !validos.includes(i)) return null;
      set({ intent: null });
      return i;
    },
    setMoneda: (moneda) => set({ moneda }),
    setSel: (id) => set({ sel: id }),
    setRecibo: (recibo) => set({ recibo, view: recibo ? "recibo" : get().view }),

    flash: (msg, tipo = "ok") => {
      const id = ++toastSeq;
      set({ toasts: [...get().toasts.slice(-2), { id, tipo, msg }] });
      setTimeout(() => get().cerrarToast(id), tipo === "error" ? 6000 : 3500);
    },
    cerrarToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

    confirmar: (c) => {
      resolverConfirmacion?.(false);
      set({ confirmacion: c });
      return new Promise<boolean>((resolve) => {
        resolverConfirmacion = resolve;
      });
    },
    responderConfirmacion: (ok) => {
      resolverConfirmacion?.(ok);
      resolverConfirmacion = null;
      set({ confirmacion: null });
    },

    refreshResources,
    refreshAll: () => refreshResources(ALL_RESOURCES),

    refreshPanel: async (force = false) => {
      const s = get();
      if (!force && s.lastSynced && Date.now() - s.lastSynced < STALE_MS && s.dashboard) {
        return;
      }
      if (panelInflight) return panelInflight;
      panelInflight = refreshResources(ALL_RESOURCES).finally(() => {
        panelInflight = null;
      });
      return panelInflight;
    },
  };
});
