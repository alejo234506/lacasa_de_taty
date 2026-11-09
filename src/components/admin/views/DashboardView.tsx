
import {
  Brush,
  DoorOpen,
  HandCoins,
  Package,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  BedDouble,
  CheckCircle2,
  ChevronRight,
  Receipt,
  TrendingUp,
  UtensilsCrossed,
  Users,
  Wallet,
} from "lucide-react";
import { useAdminStore, type Intent } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import { AREA_LABEL } from "@/lib/panel-types";
import type { AdminView } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Empty, Skeleton, fecha } from "../ui/Modal";

export function DashboardView() {
  const moneda = useAdminStore((s) => s.moneda);
  const setView = useAdminStore((s) => s.setView);
  const irA = useAdminStore((s) => s.irA);
  const rooms = useAdminStore((s) => s.rooms);
  const residents = useAdminStore((s) => s.residents);
  const caja = useAdminStore((s) => s.caja);
  const data = useAdminStore((s) => s.dashboard);
  const panelLoading = useAdminStore((s) => s.panelLoading);
  const m = (n: number) => formatMoney(n, moneda);

  if (!data) {
    return panelLoading ? <Skeleton /> : <Empty>Sin datos</Empty>;
  }

  const k = data.kpis;
  const o = data.ocupacion;

  const sinTarifa = rooms.filter((r) => !r.tarifa).length;
  const pasos = [
    { label: "Crea tus habitaciones", detalle: "Ponles nombre, capacidad y cómo se cobran", hecho: rooms.length > 0, ir: () => irA("rack", "nueva-habitacion") },
    { label: "Ponle tarifa a cada habitación", detalle: sinTarifa ? `${sinTarifa} habitación(es) están en $0: tócala y «Editar habitación»` : "", hecho: rooms.length > 0 && sinTarifa === 0, ir: () => irA("rack") },
    { label: "Agrega tus pensionados", detalle: "Las personas que viven por mes", hecho: residents.length > 0, ir: () => irA("pensionados", "nuevo-pensionado") },
  ];

  const sucias = rooms.filter((r) => r.estado === "SUCIA" || r.estado === "MANT").length;
  const huespedes = rooms.filter((r) => r.estado === "HOTEL").length;
  const porAcabarse = caja?.inventario.filter((i) => i.estado !== "OK").length ?? 0;
  const hoy = [
    { label: "Pagos avisados por revisar", detalle: "Confirma si la plata llegó", n: k.porVerificar, icon: BadgeDollarSign, urgente: true, ir: () => irA("pagos") },
    { label: "Pensionados que deben", detalle: `Total ${m(k.cuentasPorCobrar)}`, n: k.pendientes, icon: HandCoins, urgente: false, ir: () => irA("pensionados", "ver-deben") },
    { label: "Habitaciones por arreglar", detalle: "Sucias o en mantenimiento", n: sucias, icon: Brush, urgente: false, ir: () => irA("rack", "ver-arreglo") },
    { label: "Huéspedes alojados", detalle: "Haz el check-out cuando se vayan", n: huespedes, icon: DoorOpen, urgente: false, ir: () => irA("rack", "ver-huespedes") },
    { label: "Productos por acabarse", detalle: "Revisa el inventario", n: porAcabarse, icon: Package, urgente: false, ir: () => irA("caja") },
  ].filter((t) => t.n > 0);

  // Lo que más se hace en el día: un toque y ya está en la pantalla correcta.
  const acciones: { label: string; icon: React.ElementType; view: AdminView; intent?: Intent; n?: number }[] = [
    { label: "Cobrar", icon: Users, view: "pensionados", intent: "ver-deben" },
    { label: "Check-in", icon: BedDouble, view: "rack", intent: "checkin" },
    { label: "Verificar pagos", icon: BadgeDollarSign, view: "pagos", n: k.porVerificar },
    { label: "Vender comida", icon: UtensilsCrossed, view: "comedor" },
    { label: "Gasto", icon: Receipt, view: "caja", intent: "nuevo-gasto" },
  ];

  const ocupacion = [
    { label: "Pensionados", n: o.pens, color: "#7a0d20" },
    { label: "Huéspedes", n: o.hotel, color: "#201e1d" },
    { label: "Ausente (libre)", n: o.ausentes, color: "#c06070" },
    { label: "Sucias / mant.", n: o.sucias, color: "#9b9797" },
    { label: "Libres", n: o.libres, color: "#e4dfdd" },
  ];
  const totalHab = Math.max(1, ocupacion.reduce((a, x) => a + x.n, 0));

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Tarjeta principal: lo que importa de un vistazo */}
      <section className="relative overflow-hidden rounded-[1.5rem] p-5 sm:p-6 text-white bg-gradient-to-br from-accent to-accent-dark shadow-lg shadow-accent/25">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" aria-hidden />
        <div className="absolute right-6 -bottom-12 w-28 h-28 rounded-full bg-white/5" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Wallet className="w-4 h-4" /> Caja menor
          </div>
          <div className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl font-bold mt-1 tabular-nums">{m(k.cajaMenor)}</div>
          <div className="text-white/70 text-xs mt-1">Base {m(k.cajaBase)}</div>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <button onClick={() => setView("pensionados")} className="text-left rounded-2xl bg-white/12 hover:bg-white/20 backdrop-blur px-3 py-2.5">
              <div className="text-[11px] text-white/75">Por cobrar</div>
              <div className="font-bold tabular-nums">{m(k.cuentasPorCobrar)}</div>
              <div className="text-[11px] text-white/75">{k.pendientes} con saldo</div>
            </button>
            <button onClick={() => setView("cierre")} className="text-left rounded-2xl bg-white/12 hover:bg-white/20 backdrop-blur px-3 py-2.5">
              <div className="text-[11px] text-white/75">Ganancia {data.periodoLabel}</div>
              <div className="font-bold tabular-nums">{m(k.utilidadMes)}</div>
              <div className="text-[11px] text-white/75">Ingresos {m(k.ingresosMes)}</div>
            </button>
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="grid grid-cols-5 gap-2">
        {acciones.map((a, i) => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => irA(a.view, a.intent)} className="flex flex-col items-center gap-1.5 text-center active:scale-95 transition-transform">
              <span
                className={cn(
                  "relative w-14 h-14 rounded-2xl flex items-center justify-center",
                  i === 0 ? "bg-accent text-white shadow-md shadow-accent/30" : "card text-accent"
                )}
              >
                <Icon className="w-6 h-6" />
                {!!a.n && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-white text-[11px] font-bold leading-5">{a.n}</span>
                )}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold leading-tight">{a.label}</span>
            </button>
          );
        })}
      </section>

      {/* Primeros pasos: solo mientras falte configurar algo */}
      {pasos.some((p) => !p.hecho) && (
        <section className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="section-title flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Primeros pasos</h3>
            <span className="text-xs font-semibold text-muted">{pasos.filter((p) => p.hecho).length} de {pasos.length}</span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(pasos.filter((p) => p.hecho).length / pasos.length) * 100}%` }} />
          </div>
          <div className="space-y-1">
            {pasos.map((p, i) => (
              <button
                key={p.label}
                disabled={p.hecho}
                onClick={p.ir}
                className={cn("w-full flex items-center gap-3 p-2 rounded-xl text-left", !p.hecho && "hover:bg-surface")}
              >
                {p.hecho ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                ) : (
                  <span className="w-6 h-6 rounded-full border-2 border-accent text-accent text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                )}
                <span className="flex-1 min-w-0">
                  <span className={cn("block text-sm font-semibold", p.hecho && "line-through text-muted")}>{p.label}</span>
                  {!p.hecho && <span className="block text-xs text-muted">{p.detalle}</span>}
                </span>
                {!p.hecho && <ChevronRight className="w-5 h-5 text-muted shrink-0" />}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Para hoy: lo pendiente, y cada fila lleva a la lista ya filtrada */}
      <section className="space-y-2">
        <h3 className="section-title px-1">Para hoy</h3>
        {hoy.length === 0 ? (
          <div className="card p-3.5 flex items-center gap-3 text-sm">
            <span className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></span>
            <span className="font-semibold">Todo al día. ¡Buen trabajo!</span>
          </div>
        ) : (
          <div className="card divide-y divide-border/60">
            {hoy.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.label} onClick={t.ir} className="w-full p-3 flex items-center gap-3 text-left active:bg-surface">
                  <span className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", t.urgente ? "bg-amber-50 text-amber-600" : "bg-accent-light text-accent")}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold">{t.label}</span>
                    <span className="block text-xs text-muted truncate">{t.detalle}</span>
                  </span>
                  <span className={cn("min-w-[28px] h-7 px-2 rounded-full text-xs font-bold leading-7 text-center", t.urgente ? "bg-amber-500 text-white" : "bg-surface")}>{t.n}</span>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-5 [&>*]:min-w-0">
        {/* Movimientos */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="section-title">Movimientos recientes</h3>
            <button onClick={() => setView("pagos")} className="text-xs font-semibold text-accent inline-flex items-center">
              Ver todo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="card divide-y divide-border/60">
            {data.movimientos.map((mov, i) => (
              <div key={i} className="p-3 flex items-center gap-3">
                <span
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                    mov.ingreso ? "bg-green-50 text-green-600" : "bg-accent-light text-accent"
                  )}
                >
                  {mov.ingreso ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{mov.concepto}</div>
                  <div className="text-xs text-muted truncate">{mov.detalle} · {fecha(mov.fecha)}</div>
                </div>
                <div className={cn("font-bold tabular-nums whitespace-nowrap text-sm", mov.ingreso ? "text-green-700" : "text-accent")}>
                  {mov.ingreso ? "+" : "−"} {m(mov.monto)}
                </div>
              </div>
            ))}
            {data.movimientos.length === 0 && <Empty icon={TrendingUp}>Aún no hay movimientos este mes</Empty>}
          </div>
        </section>

        <section className="space-y-5">
          {/* Ocupación como barra */}
          <div className="space-y-2">
            <h3 className="section-title px-1">Ocupación</h3>
            <div className="card p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold">
                  {o.personas}<span className="text-muted text-lg">/{o.camas}</span>
                </span>
                <span className="text-xs text-muted">personas · {o.total} habitaciones</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-surface">
                {ocupacion.map((x) =>
                  x.n > 0 ? <div key={x.label} style={{ width: `${(x.n / totalHab) * 100}%`, background: x.color }} title={`${x.label}: ${x.n}`} /> : null
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {ocupacion.map((x) => (
                  <div key={x.label} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: x.color }} />
                    <span className="flex-1 text-muted">{x.label}</span>
                    <span className="font-bold tabular-nums">{x.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="section-title px-1">Neto por área</h3>
            <div className="card divide-y divide-border/60">
              {(Object.keys(data.areas) as (keyof typeof data.areas)[]).map((key) => (
                <div key={key} className="p-3 flex justify-between items-center text-sm">
                  <span>{AREA_LABEL[key]}</span>
                  <span className={cn("font-bold tabular-nums", data.areas[key].neto < 0 ? "text-accent" : "text-green-700")}>{m(data.areas[key].neto)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
