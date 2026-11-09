
import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  MessageCircle,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Link2,
  CalendarPlus,
  UtensilsCrossed,
  Plane,
  Home,
  ChevronRight,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { apiGet, apiSend } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/lib/store";
import { Buscador, Chips } from "../ui/Filtros";
import type { EstadoCuenta, ResidentView } from "@/lib/panel-types";
import { ResidentModal, type ResidentFormData } from "../ui/ResidentModal";
import { PagoModal } from "../ui/PagoModal";
import { Badge, Empty, Modal, fecha, Skeleton } from "../ui/Modal";

const FILTROS = [
  ["TODOS", "Todos"],
  ["DEBEN", "Deben"],
  ["ALDIA", "Al día"],
  ["AUSENTES", "Ausentes"],
] as const;

const PLAN_LABEL = { MENSUAL: "Comida mensual", SEMANAL: "Comida semanal", NINGUNO: "Sin comida" } as const;

type PagoTarget = { titulo: string; saldo: number; target: { residentId: string } | { cuentaId: string } };

export function PensionadosView() {
  const moneda = useAdminStore((s) => s.moneda);
  const setRecibo = useAdminStore((s) => s.setRecibo);
  const flash = useAdminStore((s) => s.flash);
  const confirmar = useAdminStore((s) => s.confirmar);
  const refreshAll = useAdminStore((s) => s.refreshAll);
  const residents = useAdminStore((s) => s.residents);
  const rooms = useAdminStore((s) => s.rooms);
  const panelLoading = useAdminStore((s) => s.panelLoading);
  const m = (n: number) => formatMoney(n, moneda);

  const [filtro, setFiltro] = useState<string>("TODOS");
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ResidentFormData | null>(null);
  const [pago, setPago] = useState<PagoTarget | null>(null);
  const [fichaId, setFichaId] = useState<string | null>(null);
  const intent = useAdminStore((s) => s.intent);
  const tomarIntent = useAdminStore((s) => s.tomarIntent);

  // Atajos desde "¿Qué quieres hacer?" o desde Inicio
  useEffect(() => {
    const i = tomarIntent(["nuevo-pensionado", "ver-deben"]);
    if (i === "nuevo-pensionado") {
      setEditing(null);
      setModalOpen(true);
    } else if (i === "ver-deben") {
      setFiltro("DEBEN");
    }
  }, [intent, tomarIntent]);

  const ficha = residents.find((r) => r.id === fichaId) ?? null;

  const cuentas = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; habitaciones: string[]; miembros: ResidentView[] }>();
    for (const r of rooms) {
      if (!r.cuentaId) continue;
      const c = map.get(r.cuentaId) ?? { id: r.cuentaId, nombre: r.cuentaNombre, habitaciones: [], miembros: [] };
      c.habitaciones.push(r.numero);
      c.miembros.push(...residents.filter((p) => p.habitacion === r.numero));
      map.set(r.cuentaId, c);
    }
    return [...map.values()].filter((c) => c.miembros.length > 0);
  }, [rooms, residents]);

  async function act<T>(fn: () => Promise<T>, ok: string | ((r: T) => string)) {
    try {
      const out = await fn();
      flash(typeof ok === "string" ? ok : ok(out));
      await refreshAll();
      return out;
    } catch (e) {
      flash((e as Error).message, "error");
      return null;
    }
  }

  async function saveResident(data: ResidentFormData) {
    await apiSend(data.id ? `/api/residents/${data.id}` : "/api/residents", {
      method: data.id ? "PATCH" : "POST",
      body: JSON.stringify(data),
    });
    flash(data.id ? "Pensionado actualizado" : "Pensionado creado");
    setModalOpen(false);
    await refreshAll();
  }

  function editar(p: ResidentView) {
    setFichaId(null); // la ficha tapaba la ventana de edición
    setEditing({
      id: p.id,
      nombre: p.nombre,
      documento: p.documento,
      telefono: p.telefono,
      habitacion: p.habitacion,
      grupo: p.grupo,
      estudios: p.estudios,
      tarifaHabitacion: p.tarifaHabitacion,
      planComida: p.planComida,
      tarifaComida: p.tarifaComida,
      saldo: p.saldo,
    });
    setModalOpen(true);
  }

  const totalDeuda = residents.reduce((a, r) => a + Math.max(r.saldo, 0), 0);
  const deben = residents.filter((r) => r.saldo > 0).length;

  const filtered = residents
    .filter(
      (r) =>
        (filtro === "TODOS" ||
          (filtro === "DEBEN" && r.saldo > 0) ||
          (filtro === "ALDIA" && r.saldo <= 0) ||
          (filtro === "AUSENTES" && r.ausente)) &&
        (!q || `${r.nombre} ${r.documento} ${r.habitacion}`.toLowerCase().includes(q.toLowerCase()))
    )
    .sort((a, b) => Number(b.saldo > 0) - Number(a.saldo > 0) || a.nombre.localeCompare(b.nombre, "es"));

  if (panelLoading && residents.length === 0) {
    return <Skeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Resumen + acciones principales */}
      <section className="relative overflow-hidden rounded-[1.5rem] p-5 text-white bg-gradient-to-br from-accent to-accent-dark shadow-lg shadow-accent/25">
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/10" aria-hidden />
        <div className="relative flex items-end justify-between gap-3">
          <div>
            <div className="text-sm text-white/80">Por cobrar</div>
            <div className="font-[family-name:var(--font-playfair)] text-4xl font-bold tabular-nums">{m(totalDeuda)}</div>
            <div className="text-xs text-white/75 mt-0.5">{deben} de {residents.length} pensionados deben</div>
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white text-accent font-semibold text-sm px-4 min-h-[44px] shadow"
          >
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <BigAction
          icon={CalendarPlus}
          label="Cargar mes a todos"
          onClick={async () =>
            (await confirmar({ titulo: "¿Cargar el mes a todos?", mensaje: "Se suma la mensualidad de este mes a cada pensionado. Los que ya la tienen se omiten.", confirmar: "Cargar mes" })) &&
            act(() => apiSend<{ cargados: number; total: number }>("/api/cargos", { method: "POST", body: JSON.stringify({ tipo: "MES" }) }), (r) => `Mes cargado a ${r.cargados} · ${m(r.total)}`)
          }
        />
        <BigAction
          icon={UtensilsCrossed}
          label="Cargar semana de comida"
          onClick={() => act(() => apiSend<{ cargados: number; total: number }>("/api/cargos", { method: "POST", body: JSON.stringify({ tipo: "SEMANA_COMIDA" }) }), (r) => `Semana cargada a ${r.cargados} · ${m(r.total)}`)}
        />
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Buscador className="flex-1" value={q} onChange={setQ} placeholder="Buscar por nombre, documento o habitación" />
        <Chips
          value={filtro as (typeof FILTROS)[number][0]}
          onChange={setFiltro}
          opciones={FILTROS.map(([k, label]) => ({
            key: k,
            label,
            n:
              k === "TODOS" ? residents.length : k === "DEBEN" ? residents.filter((r) => r.saldo > 0).length : k === "ALDIA" ? residents.filter((r) => r.saldo <= 0).length : residents.filter((r) => r.ausente).length,
          }))}
        />
      </div>

      {cuentas.length > 0 && (
        <div className="card divide-y divide-border">
          {cuentas.map((c) => {
            const saldo = c.miembros.reduce((a, x) => a + x.saldo, 0);
            return (
              <div key={c.id} className="p-3 flex items-center gap-3">
                <Link2 className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{c.nombre}</div>
                  <div className="text-xs text-muted truncate">Hab. {c.habitaciones.join(" + ")} · {c.miembros.length} personas</div>
                </div>
                <span className={cn("font-bold text-sm", saldo > 0 ? "text-accent" : "text-green-700")}>{saldo > 0 ? m(saldo) : "Al día"}</span>
                <Button size="sm" data-tour="cobrar" onClick={() => setPago({ titulo: c.nombre, saldo, target: { cuentaId: c.id } })}>Cobrar</Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista: una tarjeta por persona, un solo botón */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="card flex items-center overflow-hidden">
            <button onClick={() => setFichaId(p.id)} className="flex-1 min-w-0 text-left p-3.5 flex items-center gap-3">
              <span
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0",
                  p.saldo > 0 ? "bg-accent-light text-accent" : "bg-green-50 text-green-700"
                )}
              >
                {iniciales(p.nombre)}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-bold truncate">{p.nombre}</span>
                  {p.ausente && <Badge tone="solid">Ausente</Badge>}
                </span>
                <span className="block text-xs text-muted truncate">Hab. {p.habitacion} · {PLAN_LABEL[p.planComida]}</span>
                <span
                  className={cn(
                    "inline-flex mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full",
                    p.saldo > 0 ? "bg-accent-light text-accent" : "bg-green-50 text-green-700"
                  )}
                >
                  {p.saldo > 0 ? `Debe ${m(p.saldo)}` : p.saldo < 0 ? `A favor ${m(-p.saldo)}` : "Al día"}
                </span>
              </span>
            </button>
            <div className="flex items-center gap-2 pr-3">
              <button
                onClick={() => editar(p)}
                title="Editar pensionado"
                aria-label={`Editar ${p.nombre}`}
                className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:bg-surface"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <Button size="sm" data-tour="cobrar" className="min-h-[44px] !rounded-full" onClick={() => setPago({ titulo: p.nombre, saldo: p.saldo, target: { residentId: p.id } })}>
                Cobrar
              </Button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="card">
          <Empty>No hay pensionados con ese filtro</Empty>
        </div>
      )}

      <ResidentModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSave={saveResident} />

      <PagoModal
        open={Boolean(pago)}
        titulo={pago?.titulo ?? ""}
        saldo={pago?.saldo ?? 0}
        target={pago?.target ?? null}
        onClose={() => setPago(null)}
        onDone={async (factura) => {
          setPago(null);
          setFichaId(null);
          flash(`Pago registrado · factura ${factura.numero}`);
          await refreshAll();
          setRecibo(factura);
        }}
      />

      {ficha && (
        <Ficha
          p={ficha}
          m={m}
          onClose={() => setFichaId(null)}
          onCobrar={() => setPago({ titulo: ficha.nombre, saldo: ficha.saldo, target: { residentId: ficha.id } })}
          onEditar={() => editar(ficha)}
          act={act}
          onFactura={(f) => { setFichaId(null); setRecibo(f); }}
        />
      )}
    </div>
  );
}

function BigAction({ icon: Icon, label, onClick, primary }: { icon: React.ElementType; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[1.25rem] p-3.5 flex items-center gap-3 text-left font-semibold text-sm min-h-[64px] active:scale-[0.98] transition-transform",
        primary ? "bg-accent text-white" : "card"
      )}
    >
      <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", primary ? "bg-white/15" : "bg-accent-light text-accent")}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function Ficha({
  p,
  m,
  onClose,
  onCobrar,
  onEditar,
  act,
  onFactura,
}: {
  p: ResidentView;
  m: (n: number) => string;
  onClose: () => void;
  onCobrar: () => void;
  onEditar: () => void;
  act: <T>(fn: () => Promise<T>, ok: string | ((r: T) => string)) => Promise<T | null>;
  onFactura: (f: EstadoCuenta["pagos"][number]) => void;
}) {
  const flash = useAdminStore((s) => s.flash);
  const confirmar = useAdminStore((s) => s.confirmar);
  const [cuenta, setCuenta] = useState<EstadoCuenta | null>(null);

  useEffect(() => {
    let off = false;
    apiGet<EstadoCuenta>(`/api/residents/${p.id}`).then((c) => !off && setCuenta(c)).catch(() => {});
    return () => { off = true; };
  }, [p.id, p.saldo, p.ausente]);

  const tel = p.telefono.replace(/\D/g, "");
  const wa = `https://wa.me/${tel ? (tel.length === 10 ? `57${tel}` : tel) : ""}?text=${encodeURIComponent(
    `Hola ${p.nombre.split(" ")[0]}, este es tu enlace de Casa Taty para ver tu saldo, tu menú y avisar tus pagos:\n\n${p.link}`
  )}`;
  const cargo = (tipo: "MES" | "SEMANA_COMIDA") =>
    act(() => apiSend<{ cargado: number }>(`/api/residents/${p.id}`, { method: "POST", body: JSON.stringify({ action: "cargo", tipo }) }), (r) => `Cargado ${m(r.cargado)}`);

  return (
    <Modal open wide title={p.nombre} subtitle={`Hab. ${p.habitacion} · ${p.documento}${p.estudios ? ` · ${p.estudios}` : ""}`} onClose={onClose}>
      <div className={cn("rounded-2xl p-4 flex items-center justify-between gap-3", p.saldo > 0 ? "bg-accent-light" : "bg-green-50")}>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">Saldo</div>
          <div className={cn("font-[family-name:var(--font-playfair)] text-3xl font-bold", p.saldo > 0 ? "text-accent" : "text-green-700")}>
            {p.saldo > 0 ? m(p.saldo) : "Al día"}
          </div>
          <div className="text-xs text-muted">
            {m(p.tarifaMensual)}/mes · habitación {m(p.tarifaHabitacion)} · {PLAN_LABEL[p.planComida]}
            {p.planComida !== "NINGUNO" && ` ${m(p.tarifaComida)}/${p.planComida === "SEMANAL" ? "semana" : "mes"}`}
          </div>
        </div>
        <Button size="lg" onClick={onCobrar}>Cobrar</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Tile icon={CalendarPlus} label="Cargar mes" onClick={() => cargo("MES")} />
        {p.planComida === "SEMANAL" && <Tile icon={UtensilsCrossed} label="Cargar semana" onClick={() => cargo("SEMANA_COMIDA")} />}
        <Tile
          icon={p.ausente ? Home : Plane}
          label={p.ausente ? "Ya regresó" : "Se fue (ausente)"}
          onClick={() => act(() => apiSend(`/api/residents/${p.id}`, { method: "PATCH", body: JSON.stringify({ ausente: !p.ausente }) }), p.ausente ? "Marcado como presente" : `Hab. ${p.habitacion} disponible para alquilar`)}
        />
        <Tile icon={MessageCircle} label="Enviar link por WhatsApp" href={wa} />
        <Tile icon={Copy} label="Copiar link" onClick={async () => { await navigator.clipboard.writeText(p.link); flash("Link copiado"); }} />
        <Tile icon={Pencil} label="Editar datos" onClick={onEditar} />
        <Tile icon={RefreshCw} label="Nuevo link" onClick={async () => (await confirmar({ titulo: "¿Crear un link nuevo?", mensaje: "El link anterior dejará de funcionar.", confirmar: "Crear link" })) && act(() => apiSend(`/api/residents/${p.id}`, { method: "POST" }), "Link regenerado")} />
        <Tile
          icon={Trash2}
          label="Dar de baja"
          onClick={async () => (await confirmar({ titulo: `¿Dar de baja a ${p.nombre}?`, mensaje: "Libera su cupo en la habitación.", confirmar: "Dar de baja", peligro: true })) && act(() => apiSend(`/api/residents/${p.id}`, { method: "DELETE" }), "Pensionado dado de baja").then(onClose)}
        />
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-muted font-bold mb-2">Estado de cuenta</div>
        <div className="rounded-xl border border-border divide-y divide-border max-h-[40vh] overflow-y-auto">
          {!cuenta ? (
            <div className="p-4 text-sm text-muted animate-pulse">Cargando...</div>
          ) : cuenta.movimientos.length === 0 ? (
            <Empty>Sin movimientos todavía</Empty>
          ) : (
            cuenta.movimientos.map((x, i) => {
              const factura = x.ref ? cuenta.pagos.find((y) => y.id === x.ref) : null;
              return (
                <button
                  key={i}
                  disabled={!factura}
                  onClick={() => factura && onFactura(factura)}
                  className={cn("w-full text-left p-3 flex items-center gap-3 text-sm", factura && "hover:bg-surface", x.tipo === "ANULADO" && "line-through text-muted")}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{x.concepto}</div>
                    <div className="text-xs text-muted">{fecha(x.fecha)}</div>
                  </div>
                  <span className={cn("font-bold tabular-nums whitespace-nowrap", x.tipo === "CARGO" ? "text-foreground" : "text-green-700")}>
                    {x.tipo === "CARGO" ? "+" : "−"} {m(x.monto)}
                  </span>
                  {factura && <ChevronRight className="w-4 h-4 text-muted" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}

function Tile({ icon: Icon, label, onClick, href }: { icon: React.ElementType; label: string; onClick?: () => void; href?: string }) {
  const cls = "rounded-xl border border-border bg-white hover:bg-surface p-3 min-h-[72px] flex flex-col items-start justify-between gap-1 text-left text-sm font-semibold";
  const body = (
    <>
      <Icon className="w-5 h-5 text-accent" />
      {label}
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
  ) : (
    <button onClick={onClick} className={cls}>{body}</button>
  );
}

function iniciales(nombre: string) {
  const p = nombre.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}
