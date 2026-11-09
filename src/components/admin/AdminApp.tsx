
import { useEffect, useRef, Suspense, useState, lazy } from "react";
import Image from "@/components/ui/Image";
import Link from "@/components/ui/Link";
import { BedDouble, Users, UtensilsCrossed, Wallet, Home, LogOut, RefreshCw, Globe } from "lucide-react";
import { ConfirmDialog, Toasts } from "./ui/Avisos";
import { Tour } from "./ui/Tour";
import { BotonQueHacer, Guia, QueHacer } from "./ui/Ayuda";
import { Skeleton } from "./ui/Modal";
import { useNavigate } from "react-router-dom";
import { useAdminStore } from "@/lib/store";
import type { AdminView } from "@/lib/data";
import { LOGO_SRC } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DashboardView = lazy(() => import("./views/DashboardView").then((m) => ({ default: m.DashboardView })));
const RackView = lazy(() => import("./views/RackView").then((m) => ({ default: m.RackView })));
const PensionadosView = lazy(() => import("./views/PensionadosView").then((m) => ({ default: m.PensionadosView })));
const PagosView = lazy(() => import("./views/PagosView").then((m) => ({ default: m.PagosView })));
const ComedorView = lazy(() => import("./views/ComedorView").then((m) => ({ default: m.ComedorView })));
const MinutaView = lazy(() => import("./views/MinutaView").then((m) => ({ default: m.MinutaView })));
const CajaView = lazy(() => import("./views/CajaView").then((m) => ({ default: m.CajaView })));
const CierreView = lazy(() => import("./views/CierreView").then((m) => ({ default: m.CierreView })));
const ReciboView = lazy(() => import("./views/ReciboView").then((m) => ({ default: m.ReciboView })));

const ADMIN_VIEW_KEY = "casa_taty_admin_view";

// Cinco secciones en la barra inferior; las pantallas relacionadas van como pestañas dentro de cada una.
const SECCIONES: { label: string; icon: React.ElementType; views: [AdminView, string][] }[] = [
  { label: "Inicio", icon: Home, views: [["dashboard", "Resumen"]] },
  { label: "Cuartos", icon: BedDouble, views: [["rack", "Habitaciones"]] },
  { label: "Pensión", icon: Users, views: [["pensionados", "Pensionados"]] },
  { label: "Comida", icon: UtensilsCrossed, views: [["comedor", "Ventas"], ["minuta", "Menú semanal"]] },
  { label: "Plata", icon: Wallet, views: [["pagos", "Pagos"], ["caja", "Gastos"], ["cierre", "Cierre"], ["recibo", "Factura"]] },
];
const ALL_VIEWS = SECCIONES.flatMap((s) => s.views.map(([v]) => v));
const seccionDe = (v: AdminView) => SECCIONES.find((s) => s.views.some(([x]) => x === v)) ?? SECCIONES[0];
const ADMIN_SCROLL_KEY = "casa_taty_admin_scroll";

function ViewFallback() {
  return <Skeleton />;
}

export function AdminApp() {
  const navigateTo = useNavigate();
  const view = useAdminStore((s) => s.view);
  const setView = useAdminStore((s) => s.setView);
  const moneda = useAdminStore((s) => s.moneda);
  const setMoneda = useAdminStore((s) => s.setMoneda);
  const residents = useAdminStore((s) => s.residents);
  const reportes = useAdminStore((s) => s.reportes);
  const refreshPanel = useAdminStore((s) => s.refreshPanel);
  const panelRefreshing = useAdminStore((s) => s.panelRefreshing);
  const lastSynced = useAdminStore((s) => s.lastSynced);
  const panelError = useAdminStore((s) => s.panelError);
  const mainRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Date.now());
  const [montado, setMontado] = useState(false);
  const [queHacer, setQueHacer] = useState(false);
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_VIEW_KEY) as AdminView | null;
    if (saved && ALL_VIEWS.includes(saved)) {
      setView(saved);
    }
    refreshPanel(true);
    // Precarga todas las pantallas para que cambiar de sección sea instantáneo.
    const t = setTimeout(() => {
      void import("./views/DashboardView");
      void import("./views/RackView");
      void import("./views/PensionadosView");
      void import("./views/PagosView");
      void import("./views/ComedorView");
      void import("./views/MinutaView");
      void import("./views/CajaView");
      void import("./views/CierreView");
      void import("./views/ReciboView");
    }, 500);
    return () => clearTimeout(t);
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
  }

  const pendientes = residents.filter((r) => r.saldo > 0).length;
  const porVerificar = reportes.filter((r) => r.estado === "PENDIENTE").length;
  const seccion = seccionDe(view);
  const pestanas = seccion.views.filter(([v]) => v !== "recibo" || view === "recibo");
  const contador = (label: string) => (label === "Plata" ? porVerificar : label === "Pensión" ? pendientes : 0);
  const salir = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    navigateTo("/acceso");
  };

  const views: Record<AdminView, React.ReactNode> = {
    dashboard: <DashboardView />,
    rack: <RackView />,
    pensionados: <PensionadosView />,
    pagos: <PagosView />,
    comedor: <ComedorView />,
    minuta: <MinutaView />,
    caja: <CajaView />,
    cierre: <CierreView />,
    recibo: <ReciboView />,
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Computador: barra lateral con las mismas 5 secciones */}
      <aside className="no-print hidden lg:flex w-60 shrink-0 bg-white border-r border-border flex-col shadow-sm">
        <div className="p-5 border-b border-border">
          <Image src={LOGO_SRC} alt="Casa Taty" width={200} height={80} className="w-full max-w-[160px] h-auto mix-blend-multiply" sizes="160px" />
        </div>
        <div className="px-4 pt-4">
          <BotonQueHacer onClick={() => setQueHacer(true)} className="w-full justify-center" />
        </div>
        <nav className="flex-1 py-3">
          {SECCIONES.map((sec) => {
            const Icon = sec.icon;
            const active = sec === seccion;
            const n = contador(sec.label);
            return (
              <button
                key={sec.label}
                onClick={() => navigate(sec.views[0][0])}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-5 min-h-[52px] text-left border-l-4",
                  active ? "border-accent bg-accent-light text-accent-dark font-semibold" : "border-transparent hover:bg-surface"
                )}
              >
                <span className="flex items-center gap-3"><Icon className="w-5 h-5" />{sec.label}</span>
                {n > 0 && <span className="text-[11px] font-bold text-white bg-accent px-2 rounded-full">{n}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-5 border-t border-border text-sm space-y-1">
          <Link href="/" className="flex items-center gap-2 text-accent min-h-[44px]"><Globe className="w-4 h-4" /> Ver el sitio</Link>
          <button onClick={salir} className="flex items-center gap-2 text-muted hover:text-accent min-h-[44px]"><LogOut className="w-4 h-4" /> Cerrar sesión</button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col w-full">
        <header className="no-print sticky top-0 z-30 bg-background/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-8 h-16 sm:h-20">
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src={LOGO_SRC}
                alt="Casa Taty"
                width={44}
                height={44}
                className="lg:hidden w-11 h-11 rounded-full object-cover bg-white border border-border shrink-0"
                sizes="44px"
              />
              <div className="min-w-0">
                <h1 className="font-[family-name:var(--font-playfair)] text-xl sm:text-3xl font-bold truncate leading-tight">{seccion.label}</h1>
                {/* La fecha solo se pinta en el navegador: si viniera del servidor no coincidiría al hidratar */}
                <div className="text-xs text-muted first-letter:uppercase truncate min-h-[1rem]">
                  {montado && new Date(now).toLocaleDateString("es-CO", { timeZone: "America/Bogota", weekday: "long", day: "numeric", month: "long" })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex rounded-xl overflow-hidden border border-border">
                {(["COP", "USD"] as const).map((x) => (
                  <button
                    key={x}
                    onClick={() => setMoneda(x)}
                    className={cn("px-3 min-h-[40px] text-xs font-bold", moneda === x ? "bg-accent text-white" : "bg-white hover:bg-surface")}
                  >
                    {x} $
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => refreshPanel(true)}
                className="card inline-flex items-center justify-center !rounded-full min-h-[44px] min-w-[44px]"
                title={panelError ? "Reintentar" : lastSynced ? `Actualizado hace ${Math.max(0, Math.round((now - lastSynced) / 1000))}s` : "Actualizar"}
                aria-label="Actualizar"
              >
                <RefreshCw className={cn("w-4 h-4", panelRefreshing && "animate-spin", panelError && "text-accent")} />
              </button>
              <button
                type="button"
                onClick={salir}
                className="card lg:hidden inline-flex items-center justify-center !rounded-full min-h-[44px] min-w-[44px] text-muted"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          {pestanas.length > 1 && (
            <div className="px-4 sm:px-8 pb-3">
              {/* Pestañas como control segmentado */}
              <div className="card !rounded-full p-1 flex gap-1 overflow-x-auto no-scrollbar sm:inline-flex">
                {pestanas.map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => navigate(v)}
                    className={cn(
                      "flex-1 sm:flex-none shrink-0 px-4 min-h-[40px] rounded-full text-sm font-semibold transition-colors whitespace-nowrap",
                      view === v ? "bg-accent text-white shadow-sm" : "text-muted hover:text-foreground"
                    )}
                  >
                    {label}
                    {v === "pagos" && porVerificar > 0 && view !== v && (
                      <span className="ml-1.5 inline-block min-w-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] leading-[18px]">{porVerificar}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        <div ref={mainRef} className="flex-1 p-3 sm:p-6 lg:p-8 overflow-auto pb-44 lg:pb-8">
          <Suspense fallback={<ViewFallback />}>
            <Guia key={view} view={view} />
            {views[view]}
          </Suspense>
        </div>
      </main>

      {/* Celular: las 5 secciones siempre a un toque */}
      <nav className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-md grid grid-cols-5 rounded-[1.75rem] bg-white/95 backdrop-blur-md border border-border shadow-[0_8px_30px_-6px_rgb(32_30_29/0.25)] p-1.5">
          {SECCIONES.map((sec) => {
            const Icon = sec.icon;
            const active = sec === seccion;
            const n = contador(sec.label);
            return (
              <button
                key={sec.label}
                onClick={() => navigate(sec.views[0][0])}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 min-h-[56px] rounded-[1.25rem] text-[11px] font-semibold transition-colors",
                  active ? "bg-accent-light text-accent" : "text-muted"
                )}
              >
                <Icon className={cn("w-[22px] h-[22px]", active && "stroke-[2.5]")} />
                {sec.label}
                {n > 0 && (
                  <span className="absolute top-1 right-[calc(50%-20px)] min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] leading-[18px] font-bold">{n}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Celular: botón flotante encima de la barra; computador: queda en la barra lateral */}
      <BotonQueHacer onClick={() => setQueHacer(true)} className="no-print lg:hidden fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40" />
      <QueHacer open={queHacer} onClose={() => setQueHacer(false)} />

      <Toasts />
      <Tour />
      <ConfirmDialog />
    </div>
  );
}
