"use client";

import { create } from "zustand";
import { apiGet } from "./api-client";
import {
  AdminView,
  Recibo,
  Room,
  RoomStatus,
} from "./data";
import type {
  CajaData,
  CierreData,
  DashboardData,
  PanelResource,
  ResidentRow,
  Sale,
} from "./panel-types";

const STALE_MS = 8_000;
const ALL_RESOURCES: PanelResource[] = ["rooms", "dashboard", "cierre", "residents", "sales", "caja"];

interface AdminState {
  view: AdminView;
  moneda: "COP" | "USD";
  sel: number;
  toast: string;
  cerrado: boolean;
  recibo: Recibo | null;
  rooms: Room[];
  stats: { pendientes: number; libres: number };
  dashboard: DashboardData | null;
  cierreData: CierreData | null;
  residents: ResidentRow[];
  sales: Sale[];
  caja: CajaData | null;
  panelLoading: boolean;
  panelRefreshing: boolean;
  panelError: string | null;
  lastSynced: number | null;

  setView: (view: AdminView) => void;
  setMoneda: (moneda: "COP" | "USD") => void;
  setSel: (id: number) => void;
  flash: (msg: string) => void;
  setCerrado: (v: boolean) => void;
  setRecibo: (recibo: Recibo | null) => void;
  setRooms: (rooms: Room[]) => void;
  updateRoom: (room: Room) => void;
  setStats: (stats: { pendientes: number; libres: number }) => void;
  marcarLimpia: (id: number) => void;
  refreshPanel: (force?: boolean) => Promise<void>;
  refreshResources: (keys: PanelResource[]) => Promise<void>;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
const inflight = new Map<PanelResource, Promise<void>>();
let panelInflight: Promise<void> | null = null;

function applyRooms(set: (partial: Partial<AdminState>) => void, get: () => AdminState, rooms: Room[]) {
  set({
    rooms,
    stats: {
      ...get().stats,
      libres: rooms.filter((r) => r.estado === "LIBRE").length,
    },
  });
}

export const useAdminStore = create<AdminState>((set, get) => {
  async function loadResource(key: PanelResource) {
    const existing = inflight.get(key);
    if (existing) return existing;

    const task = (async () => {
      switch (key) {
        case "rooms": {
          const rooms = await apiGet<Room[]>("/api/rooms");
          applyRooms(set, get, rooms);
          break;
        }
        case "dashboard": {
          const dashboard = await apiGet<DashboardData>("/api/dashboard");
          set((s) => ({
            dashboard,
            stats: {
              pendientes: dashboard.kpis.pendientes,
              libres: dashboard.kpis.libres ?? s.stats.libres,
            },
          }));
          break;
        }
        case "cierre": {
          const cierreData = await apiGet<CierreData>("/api/cierre");
          set({ cierreData, cerrado: cierreData.cerrado });
          break;
        }
        case "residents": {
          const residents = await apiGet<ResidentRow[]>("/api/residents");
          set((s) => ({
            residents,
            stats: {
              pendientes: residents.filter((r) => r.saldo > 0).length,
              libres: s.stats.libres,
            },
          }));
          break;
        }
        case "sales": {
          const sales = await apiGet<Sale[]>("/api/sales");
          set({ sales });
          break;
        }
        case "caja": {
          const caja = await apiGet<CajaData>("/api/caja");
          set({ caja });
          break;
        }
      }
    })().finally(() => {
      inflight.delete(key);
    });

    inflight.set(key, task);
    return task;
  }

  async function refreshResources(keys: PanelResource[]) {
    const hasData = Boolean(get().dashboard || get().rooms.length || get().residents.length);
    set({
      panelRefreshing: true,
      panelError: null,
      panelLoading: !hasData,
    });

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
    sel: 3,
    toast: "",
    cerrado: false,
    recibo: null,
    rooms: [],
    stats: { pendientes: 0, libres: 0 },
    dashboard: null,
    cierreData: null,
    residents: [],
    sales: [],
    caja: null,
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
    setMoneda: (moneda) => set({ moneda }),
    setSel: (id) => set({ sel: id }),
    setCerrado: (cerrado) => set({ cerrado }),
    setRecibo: (recibo) => set({ recibo, view: recibo ? "recibo" : get().view }),
    setRooms: (rooms) => applyRooms(set, get, rooms),
    updateRoom: (room) =>
      set((s) => ({
        rooms: s.rooms.map((r) => (r.id === room.id ? room : r)),
        stats: {
          ...s.stats,
          libres: s.rooms.filter((r) => (r.id === room.id ? room : r).estado === "LIBRE").length,
        },
      })),
    setStats: (stats) => set({ stats }),

    flash: (msg) => {
      if (toastTimer) clearTimeout(toastTimer);
      set({ toast: msg });
      toastTimer = setTimeout(() => set({ toast: "" }), 2200);
    },

    marcarLimpia: (id) =>
      set((s) => ({
        rooms: s.rooms.map((r) =>
          r.id === id
            ? { ...r, estado: "LIBRE" as RoomStatus, ocupante: "Disponible" }
            : r
        ),
      })),

    refreshResources,

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
