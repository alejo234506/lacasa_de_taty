
import { useState } from "react";
import { Coffee, Moon, Plus, Soup, Trash2, UtensilsCrossed } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { Buscador, Chips } from "../ui/Filtros";
import { formatMoney } from "@/lib/money";
import { apiSend } from "@/lib/api-client";
import { PRECIO_ALMUERZO, PRECIO_CENA, PRECIO_DESAYUNO } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Empty, MoneyInput } from "../ui/Modal";

const PRECIOS = { Desayuno: PRECIO_DESAYUNO, Almuerzo: PRECIO_ALMUERZO, Cena: PRECIO_CENA };
const ICONO_COMIDA: Record<keyof typeof PRECIOS, React.ElementType> = { Desayuno: Coffee, Almuerzo: Soup, Cena: Moon };

export function ComedorView() {
  const flash = useAdminStore((s) => s.flash);
  const confirmar = useAdminStore((s) => s.confirmar);
  const moneda = useAdminStore((s) => s.moneda);
  const sales = useAdminStore((s) => s.sales);
  const rooms = useAdminStore((s) => s.rooms);
  const refreshAll = useAdminStore((s) => s.refreshAll);
  const m = (n: number) => formatMoney(n, moneda);

  const [cliente, setCliente] = useState("Mostrador");
  const [pago, setPago] = useState("Efectivo");
  const [stayId, setStayId] = useState("");
  const [precios, setPrecios] = useState(PRECIOS);
  const [tipoVenta, setTipoVenta] = useState<"TODOS" | keyof typeof PRECIOS>("TODOS");
  const ventasVis = sales.filter((v) => tipoVenta === "TODOS" || v.tipo === tipoVenta);

  const huespedes = rooms.filter((r) => r.stay).map((r) => r.stay!).filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i);

  const today = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.fecha).toDateString() === today);
  const count = (t: string) => todaySales.filter((s) => s.tipo === t).length;

  async function addSale(tipo: keyof typeof PRECIOS) {
    try {
      await apiSend("/api/sales", {
        method: "POST",
        body: JSON.stringify({ tipo, cliente, pago, total: precios[tipo], stayId: pago === "Cargo a habitación" ? stayId : undefined }),
      });
      flash(`${tipo} registrado · ${m(precios[tipo])}`);
      await refreshAll();
    } catch (e) {
      flash((e as Error).message, "error");
    }
  }

  async function deleteSale(id: string) {
    if (!(await confirmar({ titulo: "¿Eliminar esta venta?", confirmar: "Eliminar", peligro: true }))) return;
    try {
      await apiSend(`/api/sales/${id}`, { method: "DELETE" });
      flash("Venta eliminada");
      await refreshAll();
    } catch (e) {
      flash((e as Error).message, "error");
    }
  }

  const sum = (f: (p: string) => boolean) => sales.filter((s) => f(s.pago)).reduce((a, s) => a + s.total, 0);
  const pagos = [
    { label: "Efectivo", valor: sum((p) => p === "Efectivo") },
    { label: "Transferencia", valor: sum((p) => p === "Transferencia") },
    { label: "Cargado a habitación (se cobra en el check-out)", valor: sum((p) => p === "Cargo a habitación") },
    { label: "Contrato (incluido en la pensión)", valor: sum((p) => p === "Contrato") },
  ];

  return (
    <div className="space-y-5">
      <section className="card p-4 space-y-3">
        <h3 className="section-title">Registrar venta</h3>
        <div className="grid grid-cols-2 gap-2">
          <input className="h-12 sm:h-10 w-full min-w-0 px-3 rounded-xl border border-border bg-white text-base sm:text-sm" data-tour="comedor-cliente" placeholder="Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} aria-label="Cliente" />
          <select className="h-12 sm:h-10 w-full min-w-0 px-3 rounded-xl border border-border bg-white text-base sm:text-sm" data-tour="comedor-pago" value={pago} onChange={(e) => setPago(e.target.value)} aria-label="Forma de pago">
            <option>Efectivo</option>
            <option>Transferencia</option>
            <option>Contrato</option>
            <option>Cargo a habitación</option>
          </select>
          {pago === "Cargo a habitación" && (
            <select className="h-12 sm:h-10 w-full min-w-0 px-3 rounded-xl border border-border bg-white text-base sm:text-sm col-span-2" value={stayId} onChange={(e) => setStayId(e.target.value)} aria-label="Huésped">
              <option value="">Huésped...</option>
              {huespedes.map((s) => (
                <option key={s.id} value={s.id}>Hab. {s.habitaciones.join("+")} · {s.huesped}</option>
              ))}
            </select>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6 [&>*]:min-w-0">
        <section className="space-y-6">
          {/* Las 3 comidas lado a lado: ícono, cuántas van hoy, precio y botón de vender */}
          <div data-tour="comedor-comidas" className="grid grid-cols-3 gap-2 sm:gap-3">
            {(Object.keys(PRECIOS) as (keyof typeof PRECIOS)[]).map((tipo) => {
              const Icon = ICONO_COMIDA[tipo];
              return (
                <div key={tipo} className="card p-3 flex flex-col items-center text-center gap-2">
                  <span className="w-11 h-11 rounded-2xl bg-accent-light text-accent flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </span>
                  <div className="text-xs font-semibold">{tipo}</div>
                  <div className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-accent leading-none">{count(tipo)}</div>
                  <div className="text-[10px] text-muted -mt-1">hoy</div>
                  <MoneyInput
                    className="w-full h-9 px-2 rounded-xl border border-border bg-surface text-sm text-center"
                    value={precios[tipo]}
                    onValueChange={(d) => setPrecios({ ...precios, [tipo]: Number(d) })}
                    aria-label={`Precio ${tipo}`}
                  />
                  <button
                    onClick={() => addSale(tipo)}
                    aria-label={`Vender ${tipo}`}
                    className="w-full min-h-[44px] rounded-xl bg-accent text-white font-semibold text-sm flex items-center justify-center gap-1 shadow-md shadow-accent/20 active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" /> Vender
                  </button>
                </div>
              );
            })}
          </div>

          <div>
            <h3 className="section-title mb-3">Cómo se pagó (este mes)</h3>
            <div className="card overflow-hidden">
              {pagos.map((p) => (
                <div key={p.label} className="flex justify-between p-4 border-b border-border last:border-0">
                  <span className="font-medium">{p.label}</span>
                  <span className="font-bold tabular-nums whitespace-nowrap">{m(p.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h3 className="section-title mb-2 px-1">Registro del mes</h3>
          <Chips
            className="mb-3"
            value={tipoVenta}
            onChange={setTipoVenta}
            opciones={[
              { key: "TODOS", label: "Todas", n: sales.length },
              { key: "Desayuno", label: "Desayunos", n: sales.filter((v) => v.tipo === "Desayuno").length },
              { key: "Almuerzo", label: "Almuerzos", n: sales.filter((v) => v.tipo === "Almuerzo").length },
              { key: "Cena", label: "Cenas", n: sales.filter((v) => v.tipo === "Cena").length },
            ]}
          />
          <div className="sm:hidden card divide-y divide-border">
            {ventasVis.map((v) => (
              <div key={v.id} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-xl bg-accent-light text-accent flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold truncate">{v.tipo} · {v.cliente}</span>
                    <span className="font-bold tabular-nums whitespace-nowrap">{m(v.total)}</span>
                  </div>
                  <div className="text-xs text-muted truncate">
                    {new Date(v.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })} {v.hora} · {v.pago}
                  </div>
                </div>
                <button aria-label="Eliminar venta" onClick={() => deleteSale(v.id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-red-600 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {ventasVis.length === 0 && <Empty icon={UtensilsCrossed}>Sin ventas con ese filtro</Empty>}
          </div>
          <div className="hidden sm:block card overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Pago</th>
                  <th className="text-right p-3">Total</th>
                  <th className="p-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {ventasVis.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="p-3 tabular-nums text-muted text-xs">{new Date(v.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })} {v.hora}</td>
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
            {sales.length === 0 && <Empty>Sin ventas este mes</Empty>}
          </div>
        </section>
      </div>
    </div>
  );
}
