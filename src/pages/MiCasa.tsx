
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Image from "@/components/ui/Image";
import {
  UtensilsCrossed,
  Wallet,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  GraduationCap,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { LOGO_SRC } from "@/lib/constants";

interface PortalData {
  nombre: string;
  habitacion: string;
  grupo: string;
  ventana: string;
  comidaIncluida: boolean;
  tarifaMensual: number;
  saldo: number;
  estudios: string;
  alDia: boolean;
  mesLabel: string;
  minuta: { dia: string; desayuno: string; almuerzo: string; cena: string }[];
  planComida: "NINGUNO" | "SEMANAL" | "MENSUAL";
  tarifaHabitacion: number;
  tarifaComida: number;
  pagos: { numero: string; fecha: string; metodo: string; monto: number }[];
  reportes: { fecha: string; monto: number; metodo: string; estado: string; motivo: string }[];
}

export default function MiCasaPage() {
  const token = useParams().token ?? null;
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reload = useRef<() => void>(() => {});

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load(silent = false) {
      try {
        const res = await fetch(`/api/portal/${token}`, { cache: "no-store" });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(e.error || "Link no válido");
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError("");
        }
      } catch (e) {
        if (!cancelled && !silent) setError((e as Error).message);
      } finally {
        if (!cancelled && !silent) setLoading(false);
      }
    }

    reload.current = () => load(true);
    load();
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load(true);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="animate-pulse text-muted text-center">Cargando tu información...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-6 sm:p-8 text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-2">
            Link no válido
          </h1>
          <p className="text-muted text-sm">
            {error || "Este enlace ya no funciona. Pide uno nuevo en recepción."}
          </p>
        </div>
      </div>
    );
  }

  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;
  const hoy = data.minuta[dayIndex];

  return (
    <div className="min-h-screen bg-background pb-safe">
      <header className="gradient-hero text-white py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="relative w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 ring-2 ring-white/30">
            <Image src={LOGO_SRC} alt="Casa Taty" fill className="object-cover" sizes="64px" />
          </div>
          <p className="text-white/60 text-xs tracking-[0.2em] uppercase mb-1">Mi Casa Taty</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold">
            Hola, {data.nombre.split(" ")[0]}
          </h1>
          <p className="text-white/70 text-sm mt-2">
            Habitación {data.habitacion} · {data.grupo}
          </p>
          {data.estudios && (
            <p className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-white/10 text-sm">
              <GraduationCap className="w-4 h-4 shrink-0" />
              {data.estudios}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 -mt-4 sm:-mt-6">
        <div
          className={`rounded-2xl p-5 sm:p-6 shadow-lg border ${
            data.alDia ? "bg-white border-green-200" : "bg-accent-light border-accent/30"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <Wallet className={`w-5 h-5 ${data.alDia ? "text-green-600" : "text-accent"}`} />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted">Tu balance</span>
          </div>
          {data.alDia ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <span className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-green-700">
                Al día
              </span>
            </div>
          ) : (
            <div className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-accent">
              {formatMoney(data.saldo)}
              <span className="text-sm font-normal text-muted block mt-1">Saldo pendiente</span>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border text-sm space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-muted">Tarifa mensual</span>
              <span className="font-semibold text-right">{formatMoney(data.tarifaMensual)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Ventana de cobro</span>
              <span className="font-semibold text-right">{data.ventana}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Alimentación</span>
              <span className="font-semibold text-right">
                {data.planComida === "SEMANAL"
                  ? `Plan semanal · ${formatMoney(data.tarifaComida)}/semana`
                  : data.planComida === "MENSUAL"
                    ? `Plan mensual · ${formatMoney(data.tarifaComida)}/mes`
                    : "No incluida"}
              </span>
            </div>
            {data.estudios && (
              <div className="flex justify-between gap-4">
                <span className="text-muted">Estudios</span>
                <span className="font-semibold text-right">{data.estudios}</span>
              </div>
            )}
          </div>
        </div>

        {data.comidaIncluida && hoy && (
          <div className="rounded-2xl bg-accent text-white p-5 sm:p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="w-5 h-5 shrink-0" />
              <span className="text-sm font-semibold uppercase tracking-wider opacity-80">
                Menú de hoy · {hoy.dia}
              </span>
            </div>
            <div className="space-y-3">
              {(["Desayuno", "Almuerzo", "Cena"] as const).map((meal, i) => {
                const val = [hoy.desayuno, hoy.almuerzo, hoy.cena][i];
                return (
                  <div key={meal}>
                    <div className="text-xs uppercase tracking-wider opacity-60">{meal}</div>
                    <div className="font-[family-name:var(--font-playfair)] text-base sm:text-lg font-semibold">
                      {val}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.comidaIncluida && (
          <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2 bg-surface">
              <CalendarDays className="w-4 h-4 text-accent shrink-0" />
              <span className="font-semibold text-sm">Plan alimentación · {data.mesLabel}</span>
            </div>
            <div className="divide-y divide-border">
              {data.minuta.map((d) => (
                <div key={d.dia} className={`p-4 ${d.dia === hoy?.dia ? "bg-accent-light/50" : ""}`}>
                  <div className="font-[family-name:var(--font-playfair)] font-bold text-sm uppercase tracking-wide mb-2 flex flex-wrap items-center gap-2">
                    {d.dia}
                    {d.dia === hoy?.dia && (
                      <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-full font-sans font-semibold normal-case">
                        Hoy
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <div className="text-[10px] uppercase text-muted tracking-wider">Desayuno</div>
                      <div>{d.desayuno}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted tracking-wider">Almuerzo</div>
                      <div>{d.almuerzo}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted tracking-wider">Cena</div>
                      <div>{d.cena}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {token && <AvisarPago token={token} saldo={data.saldo} onSent={() => reload.current()} />}

        {(data.pagos.length > 0 || data.reportes.length > 0) && (
          <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-surface font-semibold text-sm">Mis pagos</div>
            {data.reportes
              .filter((r) => r.estado !== "APROBADO")
              .map((r, i) => (
                <div key={i} className="p-4 border-b border-border text-sm flex justify-between gap-3">
                  <span>
                    {new Date(r.fecha).toLocaleDateString("es-CO")} · {r.metodo}
                    <span className={`block text-xs ${r.estado === "PENDIENTE" ? "text-muted" : "text-accent"}`}>
                      {r.estado === "PENDIENTE" ? "En verificación" : `Rechazado: ${r.motivo || "consulta en recepción"}`}
                    </span>
                  </span>
                  <span className="font-semibold">{formatMoney(r.monto)}</span>
                </div>
              ))}
            {data.pagos.map((p) => (
              <div key={p.numero} className="p-4 border-b border-border last:border-0 text-sm flex justify-between gap-3">
                <span>
                  {new Date(p.fecha).toLocaleDateString("es-CO")} · {p.metodo}
                  <span className="block text-xs text-green-700">Factura {p.numero}</span>
                </span>
                <span className="font-semibold">{formatMoney(p.monto)}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted tracking-[0.2em] uppercase pb-6">
          Vive · Descubre · Disfruta
        </p>
      </main>
    </div>
  );
}

function AvisarPago({ token, saldo, onSent }: { token: string; saldo: number; onSent: () => void }) {
  const [open, setOpen] = useState(false);
  const [monto, setMonto] = useState(saldo > 0 ? String(saldo) : "");
  const [metodo, setMetodo] = useState("Transferencia");
  const [referencia, setReferencia] = useState("");
  const [comprobante, setComprobante] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const input = "mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-base focus:border-accent focus:outline-none";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMsg("");
    try {
      const res = await fetch(`/api/portal/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto: Number(monto), metodo, referencia, comprobante }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo enviar");
      setMsg(json.message);
      setOpen(false);
      setReferencia("");
      setComprobante("");
      onSent();
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-border shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">¿Ya pagaste?</div>
          <div className="text-xs text-muted">Avísanos y describe tu comprobante. Recepción lo verifica y te genera la factura.</div>
        </div>
        {!open && (
          <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold shrink-0">
            Avisar pago
          </button>
        )}
      </div>
      {msg && <div className="text-sm p-3 rounded-xl bg-surface">{msg}</div>}
      {open && (
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-xs font-semibold text-muted uppercase">Monto pagado
            <input type="number" min={1} required className={input} value={monto} onChange={(e) => setMonto(e.target.value)} />
          </label>
          <label className="block text-xs font-semibold text-muted uppercase">Medio de pago
            <select className={input} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {["Transferencia", "Nequi", "Daviplata", "Efectivo", "Otro"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-muted uppercase">N.º de referencia
            <input className={input} value={referencia} onChange={(e) => setReferencia(e.target.value)} />
          </label>
          <label className="block text-xs font-semibold text-muted uppercase">Detalle del comprobante
            <textarea required rows={3} className={input} value={comprobante} onChange={(e) => setComprobante(e.target.value)}
              placeholder="Ej: Nequi enviado hoy 10:32 a.m. desde el 300 123 4567. También envié la captura por WhatsApp." />
          </label>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm">Cancelar</button>
            <button disabled={sending} className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50">
              {sending ? "Enviando..." : "Enviar aviso"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
