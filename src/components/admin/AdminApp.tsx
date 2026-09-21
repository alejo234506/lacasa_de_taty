"use client";

import { useEffect, useRef, Suspense, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  BedDouble,
  Users,
  UtensilsCrossed,
  CalendarDays,
  Wallet,
  FileText,
  Receipt,
  Home,
  ChevronRight,
  LogOut,
  Menu,
  X,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/store";
import { NAV_ITEMS, TITULOS, AdminView } from "@/lib/data";
import { LOGO_SRC } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DashboardView = dynamic(() => import("./views/DashboardView").then((m) => m.DashboardView));
const RackView = dynamic(() => import("./views/RackView").then((m) => m.RackView));
const PensionadosView = dynamic(() => import("./views/PensionadosView").then((m) => m.PensionadosView));
const ComedorView = dynamic(() => import("./views/ComedorView").then((m) => m.ComedorView));
const MinutaView = dynamic(() => import("./views/MinutaView").then((m) => m.MinutaView));
const CajaView = dynamic(() => import("./views/CajaView").then((m) => m.CajaView));
const CierreView = dynamic(() => import("./views/CierreView").then((m) => m.CierreView));
const ReciboView = dynamic(() => import("./views/ReciboView").then((m) => m.ReciboView));

const ICONS: Record<AdminView, React.ElementType> = {
  dashboard: LayoutDashboard,
  rack: BedDouble,
  pensionados: Users,
  comedor: UtensilsCrossed,
  minuta: CalendarDays,
  caja: Wallet,
  cierre: FileText,
  recibo: Receipt,
};

const ADMIN_VIEW_KEY = "casa_taty_admin_view";
const ADMIN_SCROLL_KEY = "casa_taty_admin_scroll";

function ViewFallback() {
  return <div className="text-muted animate-pulse p-8">Cargando módulo...</div>;
}

export function AdminApp() {
  const router = useRouter();
  const view = useAdminStore((s) => s.view);
  const setView = useAdminStore((s) => s.setView);
  const moneda = useAdminStore((s) => s.moneda);
  const setMoneda = useAdminStore((s) => s.setMoneda);
  const toast = useAdminStore((s) => s.toast);
  const cerrado = useAdminStore((s) => s.cerrado);
  const rooms = useAdminStore((s) => s.rooms);
  const stats = useAdminStore((s) => s.stats);
  const refreshPanel = useAdminStore((s) => s.refreshPanel);
  const panelRefreshing = useAdminStore((s) => s.panelRefreshing);
  const lastSynced = useAdminStore((s) => s.lastSynced);
  const panelError = useAdminStore((s) => s.panelError);
  const mainRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_VIEW_KEY) as AdminView | null;
    if (saved && NAV_ITEMS.some((n) => n.key === saved)) {
      setView(saved);
    }
    refreshPanel(true);
  }, [refreshPanel, setView]);

  useEffect(() => {
    let poll: ReturnType<typeof setInterval> | null = null;

    const startPoll = () => {
      if (poll) return;
      poll = setInterval(() => {
        if (document.visibilityState === "visible") {
          refreshPanel();
        }
      }, 12000);
    };

    const stopPoll = () => {
      if (poll) {
        clearInterval(poll);
        poll = null;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshPanel();
        startPoll();
      } else {
        stopPoll();
      }
    };

    startPoll();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const clock = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      stopPoll();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      clearInterval(clock);
    };
  }, [refreshPanel]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const saved = sessionStorage.getItem(`${ADMIN_SCROLL_KEY}:${view}`);
    if (saved) {
      el.scrollTop = Number.parseInt(saved, 10) || 0;
    }

    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.setItem(`${ADMIN_SCROLL_KEY}:${view}`, String(el.scrollTop));
      }, 80);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
    };
  }, [view]);

  function navigate(key: AdminView) {
    sessionStorage.setItem(ADMIN_VIEW_KEY, key);
    setView(key);
    setMenuOpen(false);
  }

  const libres = rooms.filter((r) => r.estado === "LIBRE").length;
  const [kicker, titulo] = TITULOS[view];

  const views: Record<AdminView, React.ReactNode> = {
    dashboard: <DashboardView />,
    rack: <RackView />,
    pensionados: <PensionadosView />,
    comedor: <ComedorView />,
    minuta: <MinutaView />,
    caja: <CajaView />,
    cierre: <CierreView />,
    recibo: <ReciboView />,
  };

  const sidebarNav = (
    <>
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.key];
          const active = view === item.key;
          const badge =
            item.badge === "libres"
              ? `${libres} libres`
              : item.badge === "por_cobrar" && stats.pendientes > 0
                ? `${stats.pendientes} por cobrar`
                : item.badge === "por_cobrar"
                  ? ""
                  : item.badge;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-5 py-3 min-h-[48px] text-left transition-all duration-200 border-l-4",
                active
                  ? "border-accent bg-accent-light text-accent-dark font-semibold"
                  : "border-transparent hover:bg-surface text-foreground"
              )}
            >
              <span className="flex items-center gap-3 text-sm">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="line-clamp-2">{item.label}</span>
              </span>
              {badge && (
                <span className="text-[10px] font-semibold text-accent bg-accent-light px-2 py-0.5 rounded-full shrink-0">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-5 border-t border-border text-xs text-muted space-y-1">
        <div className="font-bold text-foreground uppercase tracking-wider text-[11px]">
          Turno recepción
        </div>
        <div>Taty M. · desde 6:00 a.m.</div>
        <div>Periodo: {cerrado ? "Septiembre 2026" : "Agosto 2026"}</div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-accent hover:underline mt-3 text-sm font-medium min-h-[44px]"
        >
          <Home className="w-3.5 h-3.5" />
          Volver al sitio
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/acceso");
          }}
          className="inline-flex items-center gap-1 text-muted hover:text-accent mt-2 text-sm cursor-pointer min-h-[44px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {menuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "no-print w-64 shrink-0 bg-white border-r border-border flex flex-col shadow-sm",
          "fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300",
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-5 border-b border-border flex items-start justify-between gap-2">
          <div>
            <Image
              src={LOGO_SRC}
              alt="Casa Taty"
              width={200}
              height={80}
              className="w-full max-w-[180px] h-auto mix-blend-multiply"
              sizes="180px"
            />
            <p className="text-[10px] tracking-[0.14em] uppercase text-muted mt-2">
              Administración operativa
            </p>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 -mr-2 text-muted"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarNav}
      </aside>

      <main className="flex-1 min-w-0 flex flex-col lg:ml-0 w-full">
        <header className="no-print flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-4 sm:px-8 py-4 sm:py-6 border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 rounded-lg border border-border shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-[10px] tracking-[0.16em] uppercase text-muted mb-1">
                {kicker}
              </div>
              <h1 className="font-[family-name:var(--font-playfair)] text-xl sm:text-3xl font-bold truncate">
                {titulo}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="flex rounded-xl overflow-hidden border border-border shadow-sm">
              <button
                onClick={() => setMoneda("COP")}
                className={cn(
                  "px-3 sm:px-4 py-2.5 text-xs font-bold tracking-wider transition-colors min-h-[44px]",
                  moneda === "COP" ? "bg-accent text-white" : "bg-white hover:bg-surface"
                )}
              >
                COP $
              </button>
              <button
                onClick={() => setMoneda("USD")}
                className={cn(
                  "px-3 sm:px-4 py-2.5 text-xs font-bold tracking-wider border-l border-border transition-colors min-h-[44px]",
                  moneda === "USD" ? "bg-accent text-white" : "bg-white hover:bg-surface"
                )}
              >
                USD $
              </button>
            </div>
            <button
              type="button"
              onClick={() => refreshPanel(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold min-h-[44px] hover:bg-surface"
              title="Actualizar información"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", panelRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">
                {panelRefreshing
                  ? "Actualizando..."
                  : panelError
                    ? "Reintentar"
                    : lastSynced
                      ? `Hace ${Math.max(0, Math.round((now - lastSynced) / 1000))}s`
                      : "En vivo"}
              </span>
            </button>
            <div className="hidden md:block text-right text-xs text-muted">
              <div className="font-bold text-foreground text-sm">Lunes 31 de agosto</div>
              <div>TRM 3.950 · {moneda === "USD" ? "vista extranjeros" : "pesos colombianos"}</div>
            </div>
          </div>
        </header>

        <div ref={mainRef} className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto pb-safe">
          <Suspense fallback={<ViewFallback />}>
            {views[view]}
          </Suspense>
        </div>
      </main>

      {toast && (
        <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-white px-6 py-3 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-accent" />
          {toast}
        </div>
      )}
    </div>
  );
}
