"use client";

import { useAdminStore } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { AdminBtnGroup } from "../ui/AdminToolbar";

export function CierreView() {
  const moneda = useAdminStore((s) => s.moneda);
  const cerrado = useAdminStore((s) => s.cerrado);
  const setCerrado = useAdminStore((s) => s.setCerrado);
  const flash = useAdminStore((s) => s.flash);
  const data = useAdminStore((s) => s.cierreData);
  const panelLoading = useAdminStore((s) => s.panelLoading);
  const refreshResources = useAdminStore((s) => s.refreshResources);
  const m = (n: number) => formatMoney(n, moneda);

  async function cerrar() {
    const res = await fetch("/api/cierre", { method: "POST" });
    if (res.ok) {
      setCerrado(true);
      flash("Agosto cerrado y bloqueado");
      await refreshResources(["cierre", "dashboard"]);
    }
  }

  if (!data) {
    return (
      <div className="text-muted animate-pulse p-8">
        {panelLoading ? "Cargando cierre..." : "Sin datos de cierre"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: "Ingresos por banco", valor: m(data.ingresosBanco), desc: "Pensiones, transferencias y pagos extranjeros" },
          { label: "Ingresos en efectivo", valor: m(data.ingresosEfectivo), desc: "Caja mayor y comedor" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 border border-border">
            <div className="text-[10px] tracking-widest uppercase text-muted">{card.label}</div>
            <div className="font-[family-name:var(--font-playfair)] text-4xl font-bold mt-2">{card.valor}</div>
            <div className="text-sm text-muted mt-1">{card.desc}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="text-left p-4">Concepto del mes</th>
              <th className="text-right p-4">Bruto</th>
              <th className="text-left p-4 hidden sm:table-cell">Naturaleza</th>
            </tr>
          </thead>
          <tbody>
            {data.lineas.map((c) => (
              <tr key={c.concepto} className="border-b border-border last:border-0">
                <td className="p-4 font-semibold">{c.concepto}</td>
                <td className={`p-4 text-right font-bold tabular-nums ${c.ingreso ? "text-foreground" : "text-accent"}`}>
                  {c.ingreso ? m(c.monto) : "− " + m(c.monto)}
                </td>
                <td className="p-4 text-xs uppercase tracking-wide text-muted hidden sm:table-cell">
                  {c.ingreso ? "Ingreso" : "Egreso"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-gradient-to-r from-accent to-accent-dark text-white shadow-xl">
        <div>
          <div className="text-[10px] tracking-widest uppercase opacity-80">Balance neto agosto</div>
          <div className="font-[family-name:var(--font-playfair)] text-5xl font-bold mt-1">{m(data.balanceNeto)}</div>
        </div>
        <AdminBtnGroup>
          <Button
            variant="secondary"
            size="lg"
            className="bg-white text-accent hover:bg-white/90"
            onClick={cerrar}
            disabled={cerrado}
          >
            {cerrado ? "Periodo cerrado · agosto" : "Cerrar agosto y bloquear"}
          </Button>
        </AdminBtnGroup>
      </div>
    </div>
  );
}
