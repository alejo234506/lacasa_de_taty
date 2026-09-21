"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import { PRECIO_ALMUERZO, PRECIO_CENA, PRECIO_DESAYUNO } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { AdminBtnGroup, AdminToolbar } from "../ui/AdminToolbar";

export function ComedorView() {
  const flash = useAdminStore((s) => s.flash);
  const moneda = useAdminStore((s) => s.moneda);
  const sales = useAdminStore((s) => s.sales);
  const refreshResources = useAdminStore((s) => s.refreshResources);
  const m = (n: number) => formatMoney(n, moneda);

  const [cliente, setCliente] = useState("Mostrador");
  const [pago, setPago] = useState("Efectivo");

  async function load() {
    await refreshResources(["sales", "dashboard", "cierre"]);
  }

  const today = new Date().toDateString();
  const todaySales = sales.filter((s) =>
    s.createdAt ? new Date(s.createdAt).toDateString() === today : true
  );
  const counts = {
    Desayuno: todaySales.filter((s) => s.tipo === "Desayuno").length,
    Almuerzo: todaySales.filter((s) => s.tipo === "Almuerzo").length,
    Cena: todaySales.filter((s) => s.tipo === "Cena").length,
  };

  const precios = { Desayuno: PRECIO_DESAYUNO, Almuerzo: PRECIO_ALMUERZO, Cena: PRECIO_CENA };

  async function addSale(tipo: "Desayuno" | "Almuerzo" | "Cena") {
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, cliente, pago, total: precios[tipo] }),
    });
    if (res.ok) {
      flash(`${tipo} registrado · ${m(precios[tipo])}`);
      load();
    }
  }

  async function deleteSale(id: string) {
    const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
    if (res.ok) {
      flash("Venta eliminada");
      load();
    }
  }

  const pagos = [
    { label: "Efectivo", valor: m(sales.filter((s) => s.pago === "Efectivo").reduce((a, s) => a + s.total, 0)) },
    { label: "Banco / transferencia", valor: m(sales.filter((s) => s.pago === "Banco").reduce((a, s) => a + s.total, 0)) },
    { label: "Contrato / cargo", valor: m(sales.filter((s) => s.pago !== "Efectivo" && s.pago !== "Banco").reduce((a, s) => a + s.total, 0)) },
  ];

  const cards = [
    { label: "Desayunos hoy", n: counts.Desayuno, total: m(counts.Desayuno * PRECIO_DESAYUNO), tipo: "Desayuno" as const },
    { label: "Almuerzos hoy", n: counts.Almuerzo, total: m(counts.Almuerzo * PRECIO_ALMUERZO), tipo: "Almuerzo" as const },
    { label: "Cenas hoy", n: counts.Cena, total: m(counts.Cena * PRECIO_CENA), tipo: "Cena" as const },
  ];

  return (
    <div className="space-y-5">
      <AdminToolbar title="Registrar venta">
        <input
          className="px-3 py-2 h-9 rounded-xl border border-border text-sm"
          placeholder="Cliente"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
        <select
          className="px-3 py-2 h-9 rounded-xl border border-border text-sm"
          value={pago}
          onChange={(e) => setPago(e.target.value)}
        >
          <option value="Efectivo">Efectivo</option>
          <option value="Banco">Banco</option>
          <option value="Contrato">Contrato</option>
          <option value="Cargo a habitación">Cargo a habitación</option>
        </select>
      </AdminToolbar>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl p-6 border border-border shadow-sm">
                <div className="text-[10px] tracking-wider uppercase text-muted">{card.label}</div>
                <div className="font-[family-name:var(--font-playfair)] text-5xl font-bold text-accent leading-none mt-2">
                  {card.n}
                </div>
                <div className="text-sm text-muted mb-4">{card.total} vendidos</div>
                <Button onClick={() => addSale(card.tipo)} className="w-full justify-center" size="sm">
                  <Plus className="w-4 h-4" /> +1 {card.tipo}
                </Button>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-muted mb-3">Cómo se pagó</h3>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {pagos.map((p) => (
                <div key={p.label} className="flex justify-between p-4 border-b border-border last:border-0">
                  <span className="font-medium">{p.label}</span>
                  <span className="font-bold tabular-nums">{p.valor}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold tracking-wider uppercase text-muted mb-3">Registro del servicio</h3>
          <div className="bg-white rounded-2xl border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left p-3">Hora</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Pago</th>
                  <th className="text-right p-3">Total</th>
                  <th className="p-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {sales.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="p-3 tabular-nums text-muted">{v.hora}</td>
                    <td className="p-3 font-semibold">{v.tipo}</td>
                    <td className="p-3">{v.cliente}</td>
                    <td className="p-3 text-xs uppercase tracking-wide">{v.pago}</td>
                    <td className="p-3 text-right font-bold tabular-nums">{m(v.total)}</td>
                    <td className="p-3">
                      <Button size="sm" variant="secondary" onClick={() => deleteSale(v.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
