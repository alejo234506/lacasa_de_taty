
import { useEffect, useState } from "react";
import { useAdminStore } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import { apiGet, apiSend } from "@/lib/api-client";
import { AREA_LABEL, type CierreData } from "@/lib/panel-types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/Modal";

function periodoActual() {
  return new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 7);
}

export function CierreView() {
  const moneda = useAdminStore((s) => s.moneda);
  const flash = useAdminStore((s) => s.flash);
  const confirmar = useAdminStore((s) => s.confirmar);
  const actual = useAdminStore((s) => s.cierreData);
  const refreshAll = useAdminStore((s) => s.refreshAll);
  const m = (n: number) => formatMoney(n, moneda);

  const [periodo, setPeriodo] = useState(periodoActual());
  const [data, setData] = useState<CierreData | null>(null);

  useEffect(() => {
    if (periodo === actual?.periodo) {
      setData(actual);
      return;
    }
    apiGet<CierreData>(`/api/cierre?periodo=${periodo}`).then(setData).catch(() => flash("No se pudo cargar el periodo", "error"));
  }, [periodo, actual, flash]);

  async function toggle() {
    if (!data) return;
    const ok = await confirmar(
      data.cerrado
        ? { titulo: `¿Reabrir ${data.periodoLabel}?`, mensaje: "Se podrán volver a registrar movimientos.", confirmar: "Reabrir" }
        : { titulo: `¿Cerrar ${data.periodoLabel}?`, mensaje: "No se podrán registrar ni borrar pagos, gastos ni ventas de este mes.", confirmar: "Cerrar mes", peligro: true }
    );
    if (!ok) return;
    try {
      await apiSend("/api/cierre", { method: "POST", body: JSON.stringify({ periodo, action: data.cerrado ? "reabrir" : "cerrar" }) });
      flash(data.cerrado ? "Periodo reabierto" : "Periodo cerrado");
      await refreshAll();
      setData(await apiGet<CierreData>(`/api/cierre?periodo=${periodo}`));
    } catch (e) {
      flash((e as Error).message, "error");
    }
  }

  if (!data) return <Skeleton />;

  const d = data.detalle;
  const ingresos = [
    { c: "Pensiones · habitación", v: d.pensionHabitacion, a: "HABITACIONES" },
    { c: "Hotel por noches · alojamiento", v: d.hotelAlojamiento - d.hotelAusentes, a: "HABITACIONES" },
    { c: "Hotel en habitaciones de pensionados ausentes", v: d.hotelAusentes, a: "HABITACIONES" },
    { c: "Pensiones · alimentación (semanal/mensual)", v: d.pensionComida, a: "COMIDA" },
    { c: "Consumos de huéspedes", v: d.hotelConsumos, a: "COMIDA" },
    { c: "Ventas de comedor (efectivo/transferencia)", v: d.comedor, a: "COMIDA" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold">Periodo</label>
        <input type="month" className="px-3 h-10 rounded-xl border border-border" value={periodo} onChange={(e) => e.target.value && setPeriodo(e.target.value)} />
        <span className={cn("text-xs font-bold uppercase px-2 py-1 rounded-full", data.cerrado ? "bg-foreground text-white" : "bg-surface text-muted border border-border")}>
          {data.cerrado ? "Cerrado" : "Abierto"}
        </span>
        <span className="text-sm text-muted">{data.facturas} facturas · por cobrar {m(data.porCobrar)} ({data.pendientes} pensionados)</span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {(Object.keys(data.areas) as (keyof typeof data.areas)[]).map((k) => {
          const a = data.areas[k];
          return (
            <div key={k} className="bg-white rounded-2xl p-5 border border-border">
              <div className="text-[10px] tracking-widest uppercase text-muted">Ganancia neta · {AREA_LABEL[k]}</div>
              <div className={cn("font-[family-name:var(--font-playfair)] text-3xl font-bold mt-2", a.neto < 0 && "text-accent")}>{m(a.neto)}</div>
              <div className="text-sm text-muted mt-2 flex justify-between"><span>Ingresos</span><span>{m(a.ingresos)}</span></div>
              <div className="text-sm text-muted flex justify-between"><span>Gastos</span><span>− {m(a.gastos)}</span></div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border bg-surface font-semibold">Ingresos de {data.periodoLabel}</div>
          {ingresos.map((x) => (
            <div key={x.c} className="flex justify-between gap-3 p-4 border-b border-border last:border-0 text-sm">
              <span>{x.c} <span className="text-[10px] uppercase text-muted">· {AREA_LABEL[x.a]}</span></span>
              <span className="font-bold tabular-nums">{m(x.v)}</span>
            </div>
          ))}
          <div className="p-4 text-sm text-muted">
            Por método: {Object.entries(data.porMetodo).map(([k, v]) => `${k} ${m(v)}`).join(" · ") || "—"}
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border bg-surface font-semibold">Gastos por rubro</div>
          {data.gastosPorRubro.length === 0 ? (
            <div className="p-4 text-sm text-muted">Sin gastos registrados</div>
          ) : (
            data.gastosPorRubro.map((x) => (
              <div key={`${x.area}${x.rubro}`} className="flex justify-between gap-3 p-4 border-b border-border last:border-0 text-sm">
                <span>{x.rubro} <span className="text-[10px] uppercase text-muted">· {AREA_LABEL[x.area]}</span></span>
                <span className="font-bold tabular-nums text-accent">− {m(x.monto)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-gradient-to-r from-accent to-accent-dark text-white shadow-xl">
        <div>
          <div className="text-[10px] tracking-widest uppercase opacity-80">Ganancia neta total · {data.periodoLabel}</div>
          <div className="font-[family-name:var(--font-playfair)] text-5xl font-bold mt-1">{m(data.utilidadNeta)}</div>
          <div className="text-sm opacity-80 mt-1">Ingresos {m(data.ingresos)} − gastos {m(data.gastos)}</div>
        </div>
        <Button variant="secondary" size="lg" className="bg-white text-accent hover:bg-white/90" onClick={toggle}>
          {data.cerrado ? "Reabrir periodo" : `Cerrar ${data.periodoLabel}`}
        </Button>
      </div>
    </div>
  );
}
