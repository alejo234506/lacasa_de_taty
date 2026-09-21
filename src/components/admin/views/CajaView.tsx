"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AdminBtnGroup, AdminToolbar } from "../ui/AdminToolbar";

export function CajaView() {
  const moneda = useAdminStore((s) => s.moneda);
  const flash = useAdminStore((s) => s.flash);
  const caja = useAdminStore((s) => s.caja);
  const panelLoading = useAdminStore((s) => s.panelLoading);
  const refreshResources = useAdminStore((s) => s.refreshResources);
  const m = (n: number) => formatMoney(n, moneda);

  const saldo = caja?.saldo ?? 0;
  const base = caja?.base ?? 500000;
  const gastos = caja?.gastos ?? [];
  const inventario = caja?.inventario ?? [];
  const [concepto, setConcepto] = useState("");
  const [rubro, setRubro] = useState("Insumos comida");
  const [monto, setMonto] = useState("");
  const [editInv, setEditInv] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");

  async function load() {
    await refreshResources(["caja", "dashboard", "cierre"]);
  }

  if (!caja && panelLoading) {
    return <div className="text-muted animate-pulse p-8">Cargando caja...</div>;
  }

  async function addGasto() {
    if (!concepto || !monto) return;
    const res = await fetch("/api/caja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "gasto", concepto, rubro, monto: Number(monto) }),
    });
    if (res.ok) {
      flash("Gasto registrado");
      setConcepto("");
      setMonto("");
      load();
    }
  }

  async function deleteGasto(id: string) {
    const res = await fetch("/api/caja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "eliminar", id }),
    });
    if (res.ok) {
      flash("Gasto eliminado");
      load();
    }
  }

  async function reponer() {
    const res = await fetch("/api/caja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reponer", monto: base - saldo }),
    });
    if (res.ok) {
      flash(`Reposición de ${m(base - saldo)}`);
      load();
    }
  }

  async function arqueo() {
    const res = await fetch("/api/caja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "arqueo", saldoReal: saldo }),
    });
    if (res.ok) {
      const data = await res.json();
      flash(`Arqueo registrado · diferencia ${m(data.diff)}`);
      load();
    }
  }

  async function saveInventory(id: string) {
    const res = await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cantidad: Number(editQty) }),
    });
    if (res.ok) {
      flash("Inventario actualizado");
      setEditInv(null);
      load();
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <section className="space-y-6">
          <div className="rounded-2xl p-8 bg-gradient-to-br from-accent-light to-white border border-accent/20 shadow-lg">
            <div className="text-[10px] tracking-widest uppercase text-accent-dark font-semibold">
              Saldo caja menor
            </div>
            <div className="font-[family-name:var(--font-playfair)] text-5xl font-bold text-accent-dark mt-2">
              {m(saldo)}
            </div>
            <div className="text-sm text-accent-dark/70 mt-2">
              Base autorizada {m(base)}
            </div>
            <AdminBtnGroup className="mt-5">
              <Button size="sm" onClick={reponer}>Reponer a base</Button>
              <Button size="sm" variant="secondary" onClick={arqueo}>Registrar arqueo</Button>
            </AdminBtnGroup>
          </div>

          <div>
            <AdminToolbar title="Nuevo gasto" className="mb-3">
              <input
                className="px-3 py-2 h-9 rounded-xl border border-border text-sm flex-1 min-w-[140px]"
                placeholder="Concepto"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
              />
              <select
                className="px-3 py-2 h-9 rounded-xl border border-border text-sm"
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
              >
                <option>Insumos comida</option>
                <option>Mantenimiento</option>
                <option>Aseo</option>
                <option>Otros</option>
              </select>
              <input
                type="number"
                className="px-3 py-2 h-9 rounded-xl border border-border text-sm w-28"
                placeholder="Monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
              <Button size="sm" onClick={addGasto}>
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </AdminToolbar>

            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="text-left p-3">Concepto</th>
                    <th className="text-left p-3 hidden sm:table-cell">Rubro</th>
                    <th className="text-right p-3">Monto</th>
                    <th className="p-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((g) => (
                    <tr key={g.id} className="border-b border-border last:border-0">
                      <td className="p-3 font-semibold">{g.concepto}</td>
                      <td className="p-3 text-xs uppercase tracking-wide text-muted hidden sm:table-cell">{g.rubro}</td>
                      <td className="p-3 text-right tabular-nums">{m(g.monto)}</td>
                      <td className="p-3">
                        <Button size="sm" variant="secondary" onClick={() => deleteGasto(g.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold tracking-wider uppercase text-muted mb-3">
            Inventario de insumos
          </h3>
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left p-3">Producto</th>
                  <th className="text-right p-3">Cantidad</th>
                  <th className="text-left p-3 hidden sm:table-cell">Unidad</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="p-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {inventario.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-semibold">{i.producto}</td>
                    <td className="p-3 text-right font-bold tabular-nums">
                      {editInv === i.id ? (
                        <input
                          type="number"
                          className="w-20 px-2 py-1 rounded border border-border text-right"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                        />
                      ) : (
                        i.cantidad
                      )}
                    </td>
                    <td className="p-3 hidden sm:table-cell">{i.unidad}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-full",
                          i.estado === "Crítico" && "bg-accent text-white",
                          i.estado === "Bajo" && "bg-accent-light text-accent-dark",
                          i.estado === "OK" && "bg-surface text-muted"
                        )}
                      >
                        {i.estado}
                      </span>
                    </td>
                    <td className="p-3">
                      {editInv === i.id ? (
                        <Button size="sm" onClick={() => saveInventory(i.id)}>OK</Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditInv(i.id);
                            setEditQty(String(i.cantidad));
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
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
