"use client";

import { TrendingUp, Plus, ArrowRight } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import { PRECIO_ALMUERZO, PRECIO_CENA, PRECIO_DESAYUNO } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { AdminBtnGroup } from "../ui/AdminToolbar";
import { apiSend } from "@/lib/api-client";

export function DashboardView() {
  const moneda = useAdminStore((s) => s.moneda);
  const flash = useAdminStore((s) => s.flash);
  const setView = useAdminStore((s) => s.setView);
  const data = useAdminStore((s) => s.dashboard);
  const panelLoading = useAdminStore((s) => s.panelLoading);
  const refreshResources = useAdminStore((s) => s.refreshResources);
  const m = (n: number) => formatMoney(n, moneda);

  async function addSale(tipo: "Desayuno" | "Almuerzo" | "Cena", precio: number) {
    try {
      await apiSend("/api/sales", {
        method: "POST",
        body: JSON.stringify({ tipo, cliente: "Mostrador", pago: "Efectivo", total: precio }),
      });
      flash(`${tipo} registrado · ${m(precio)}`);
      await refreshResources(["sales", "dashboard", "cierre", "caja"]);
    } catch {
      flash("No se pudo registrar la venta");
    }
  }

  if (!data) {
    return (
      <div className="text-muted animate-pulse p-8">
        {panelLoading ? "Cargando dashboard..." : "Sin datos del dashboard"}
      </div>
    );
  }

  const kpis = [
    { label: "Banco", valor: m(data.kpis.banco), nota: "Bancolombia ·1204", accent: false },
    { label: "Efectivo caja mayor", valor: m(data.kpis.cajaMayor), nota: "Arqueado hoy 6:00 a.m.", accent: false },
    { label: "Caja menor", valor: m(data.kpis.cajaMenor), nota: "Base 500.000", accent: true },
    { label: "Cuentas por cobrar", valor: m(data.kpis.cuentasPorCobrar), nota: `${data.kpis.pendientes} pensionados`, accent: true },
    { label: "Ingresos del mes", valor: m(data.kpis.ingresosMes), nota: "Actualizado en vivo", accent: false, trend: true },
  ];

  const ocupacion = [
    { label: "Ocupadas por pensionado", n: data.ocupacion.pens, color: "#7a0d20" },
    { label: "Ocupadas por noche", n: data.ocupacion.hotel, color: "#201e1d" },
    { label: "Libres", n: data.ocupacion.libres, color: "#d7d3d3" },
    { label: "Sucias o mantenimiento", n: data.ocupacion.sucias, color: "#9b9797" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[10px] tracking-wider uppercase text-muted mb-1">{k.label}</div>
            <div className={`font-[family-name:var(--font-playfair)] text-2xl font-bold ${k.accent ? "text-accent" : "text-foreground"}`}>
              {k.valor}
            </div>
            <div className="text-xs text-muted mt-1 flex items-center gap-1">
              {k.trend && <TrendingUp className="w-3 h-3 text-green-600" />}
              {k.nota}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6">
        <section className="space-y-6">
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-muted mb-3">
              Acciones de un clic
            </h3>
            <AdminBtnGroup className="w-full [&>button]:flex-1 [&>button]:min-w-[160px] [&>button]:justify-center">
              <Button size="sm" onClick={() => addSale("Desayuno", PRECIO_DESAYUNO)}>
                <Plus className="w-4 h-4" /> +1 Desayuno
              </Button>
              <Button size="sm" onClick={() => addSale("Almuerzo", PRECIO_ALMUERZO)}>
                <Plus className="w-4 h-4" /> +1 Almuerzo
              </Button>
              <Button size="sm" onClick={() => addSale("Cena", PRECIO_CENA)}>
                <Plus className="w-4 h-4" /> +1 Cena
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setView("pensionados")}>
                Cobrar pensión <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setView("rack")}>
                Check-in / out <ArrowRight className="w-4 h-4" />
              </Button>
            </AdminBtnGroup>
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-muted mb-3">
              Movimientos recientes
            </h3>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="text-left p-3 font-semibold">Concepto</th>
                    <th className="text-left p-3 font-semibold hidden sm:table-cell">Origen</th>
                    <th className="text-right p-3 font-semibold">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movimientos.map((mov, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-surface/50">
                      <td className="p-3">
                        <div className="font-medium">{mov.concepto}</div>
                        <div className="text-xs text-muted">{mov.detalle}</div>
                      </td>
                      <td className="p-3 hidden sm:table-cell text-muted">{mov.origen}</td>
                      <td className={`p-3 text-right font-bold tabular-nums ${mov.ingreso ? "text-foreground" : "text-accent"}`}>
                        {mov.ingreso ? "+ " + m(mov.monto) : "− " + m(mov.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-muted mb-3">
              Ocupación 48 habitaciones
            </h3>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {ocupacion.map((o) => (
                <div key={o.label} className="flex items-center gap-3 p-4 border-b border-border last:border-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: o.color }} />
                  <div className="flex-1 text-sm font-medium">{o.label}</div>
                  <div className="font-[family-name:var(--font-playfair)] text-xl font-bold tabular-nums">{o.n}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-muted mb-3">
              Alertas de cobro
            </h3>
            <div className="space-y-2">
              {data.alertas.length === 0 ? (
                <div className="p-4 rounded-xl bg-white border border-border text-sm text-muted">
                  Todos los pensionados están al día
                </div>
              ) : (
                data.alertas.map((a) => (
                  <div
                    key={a.titulo}
                    className={`p-4 rounded-xl border ${a.urgent ? "bg-accent-light border-accent/20" : "bg-white border-border"}`}
                  >
                    <div className="font-bold text-sm">{a.titulo}</div>
                    <div className="text-xs text-muted mt-1">{a.detalle}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
