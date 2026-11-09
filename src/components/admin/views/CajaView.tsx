
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, Package, Receipt } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { Buscador, Chips } from "../ui/Filtros";
import { formatMoney } from "@/lib/money";
import { apiSend } from "@/lib/api-client";
import { AREA_LABEL, type CajaData } from "@/lib/panel-types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AdminBtnGroup } from "../ui/AdminToolbar";
import { Empty, Field, Modal, ModalForm, MoneyInput, fecha, inputClass, Skeleton } from "../ui/Modal";

type Item = CajaData["inventario"][number];
const RUBROS = ["Insumos comida", "Servicios públicos", "Arriendo", "Nómina", "Mantenimiento", "Aseo", "Lavandería", "Impuestos", "Otros"];
const sel = "px-3 h-12 sm:h-10 w-full min-w-0 rounded-xl border border-border bg-white text-base sm:text-sm";

export function CajaView() {
  const moneda = useAdminStore((s) => s.moneda);
  const flash = useAdminStore((s) => s.flash);
  const confirmar = useAdminStore((s) => s.confirmar);
  const caja = useAdminStore((s) => s.caja);
  const panelLoading = useAdminStore((s) => s.panelLoading);
  const refreshAll = useAdminStore((s) => s.refreshAll);
  const m = (n: number) => formatMoney(n, moneda);

  const [g, setG] = useState({ concepto: "", rubro: "Insumos comida", area: "COMIDA", fuente: "CAJA_MENOR", monto: "" });
  const [mov, setMov] = useState<{ item: Item; tipo: "ENTRADA" | "SALIDA" | "AJUSTE" } | null>(null);
  const [nuevoItem, setNuevoItem] = useState(false);
  const [ajuste, setAjuste] = useState<"arqueo" | "base" | null>(null);
  const [qGasto, setQGasto] = useState("");
  const [areaGasto, setAreaGasto] = useState<"TODAS" | "COMIDA" | "HABITACIONES" | "GENERAL">("TODAS");
  const [estadoInv, setEstadoInv] = useState<"TODOS" | "Bajo" | "Agotado">("TODOS");
  const conceptoRef = useRef<HTMLInputElement>(null);
  const intent = useAdminStore((s) => s.intent);
  const tomarIntent = useAdminStore((s) => s.tomarIntent);

  // "Anotar un gasto": lleva directo al campo para escribir
  useEffect(() => {
    if (!caja) return;
    const i = tomarIntent(["nuevo-gasto", "nuevo-producto"]);
    if (i === "nuevo-gasto") {
      setTimeout(() => {
        conceptoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        conceptoRef.current?.focus();
      }, 450);
    } else if (i === "nuevo-producto") {
      setNuevoItem(true);
    }
  }, [intent, tomarIntent, caja]);

  if (!caja) {
    return panelLoading ? <Skeleton /> : <Empty>Sin datos</Empty>;
  }

  async function post(url: string, init: RequestInit, ok: string | ((r: Record<string, number>) => string)) {
    try {
      const r = await apiSend<Record<string, number>>(url, init);
      flash(typeof ok === "string" ? ok : ok(r));
      await refreshAll();
      return true;
    } catch (e) {
      flash((e as Error).message, "error");
      return false;
    }
  }

  async function addGasto(e: React.FormEvent) {
    e.preventDefault();
    const ok = await post("/api/caja", { method: "POST", body: JSON.stringify({ action: "gasto", ...g, monto: Number(g.monto) }) }, "Gasto registrado");
    if (ok) setG({ ...g, concepto: "", monto: "" });
  }

  const totalMes = caja.gastos.reduce((a, x) => a + x.monto, 0);
  const gastosVis = caja.gastos.filter(
    (x) => (areaGasto === "TODAS" || x.area === areaGasto) && (!qGasto || `${x.concepto} ${x.rubro}`.toLowerCase().includes(qGasto.toLowerCase()))
  );
  const invVis = caja.inventario.filter((i) => estadoInv === "TODOS" || i.estado === estadoInv);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6 [&>*]:min-w-0">
        <section className="space-y-6">
          <div className="relative overflow-hidden rounded-[1.5rem] p-5 sm:p-6 text-white bg-gradient-to-br from-accent to-accent-dark shadow-lg shadow-accent/25">
            <div className="text-sm text-white/80">Saldo caja menor</div>
            <div className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl font-bold mt-1 break-words tabular-nums">{m(caja.saldo)}</div>
            <div className="text-xs text-white/75 mt-1">Base autorizada {m(caja.base)}</div>
            <div className="grid grid-cols-3 gap-2 mt-5">
              <Button size="sm" className="min-h-[48px] px-2 !bg-white !text-accent !shadow-none" onClick={() => post("/api/caja", { method: "POST", body: JSON.stringify({ action: "reponer" }) }, (r) => `Caja repuesta (+${m(r.repuesto)})`)}>
                Reponer
              </Button>
              <Button size="sm" variant="secondary" className="min-h-[48px] px-2 !bg-white/15 !border-white/20 !text-white" onClick={() => setAjuste("arqueo")}>
                Arqueo
              </Button>
              <Button size="sm" variant="secondary" className="min-h-[48px] px-2 !bg-white/15 !border-white/20 !text-white" onClick={() => setAjuste("base")}>
                Cambiar base
              </Button>
            </div>
          </div>

          <form data-tour="gasto-form" onSubmit={addGasto} className="card p-4 space-y-3">
            <h3 className="section-title">Registrar gasto</h3>
            <input ref={conceptoRef} required className={cn(sel, "w-full")} placeholder="Concepto (ej: Recibo de luz octubre)" value={g.concepto} onChange={(e) => setG({ ...g, concepto: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <select className={sel} value={g.rubro} onChange={(e) => setG({ ...g, rubro: e.target.value, area: e.target.value === "Insumos comida" ? "COMIDA" : g.area })}>
                {RUBROS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <select className={sel} value={g.area} onChange={(e) => setG({ ...g, area: e.target.value })} title="A qué área se carga el gasto">
                <option value="COMIDA">Área: Comida</option>
                <option value="HABITACIONES">Área: Habitaciones</option>
                <option value="GENERAL">Área: General</option>
              </select>
              <select className={sel} value={g.fuente} onChange={(e) => setG({ ...g, fuente: e.target.value })}>
                <option value="CAJA_MENOR">Pagado con caja menor</option>
                <option value="EFECTIVO">Efectivo caja mayor</option>
                <option value="BANCO">Banco / transferencia</option>
              </select>
              <MoneyInput required className={sel} placeholder="Monto" value={g.monto} onValueChange={(d) => setG({ ...g, monto: d })} />
            </div>
            <Button type="submit" data-tour="gasto-guardar" className="w-full sm:w-auto min-h-[48px]"><Plus className="w-4 h-4" /> Agregar gasto</Button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h3 className="section-title">Gastos del mes</h3>
            <span className="font-bold tabular-nums text-accent">{m(totalMes)}</span>
          </div>
          <Buscador value={qGasto} onChange={setQGasto} placeholder="Buscar gasto" />
          <Chips
            value={areaGasto}
            onChange={setAreaGasto}
            opciones={[
              { key: "TODAS", label: "Todos", n: caja.gastos.length },
              { key: "COMIDA", label: "Comida", n: caja.gastos.filter((x) => x.area === "COMIDA").length },
              { key: "HABITACIONES", label: "Habitaciones", n: caja.gastos.filter((x) => x.area === "HABITACIONES").length },
              { key: "GENERAL", label: "General", n: caja.gastos.filter((x) => x.area === "GENERAL").length },
            ]}
          />
          {/* Celular: tarjetas */}
          <div className="sm:hidden card divide-y divide-border">
            {gastosVis.map((x) => (
              <div key={x.id} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-xl bg-accent-light text-accent flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold truncate">{x.concepto}</span>
                    <span className="font-bold tabular-nums whitespace-nowrap">{m(x.monto)}</span>
                  </div>
                  <div className="text-xs text-muted truncate">
                    {AREA_LABEL[x.area]} · {x.fuente === "CAJA_MENOR" ? "Caja menor" : x.fuente === "BANCO" ? "Banco" : "Efectivo"} · {fecha(x.fecha)}
                  </div>
                </div>
                <button aria-label="Eliminar gasto" onClick={async () => (await confirmar({ titulo: "¿Eliminar este gasto?", mensaje: "El dinero vuelve a la caja.", confirmar: "Eliminar", peligro: true })) && post("/api/caja", { method: "POST", body: JSON.stringify({ action: "eliminar", id: x.id }) }, "Gasto eliminado")} className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-red-600 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {gastosVis.length === 0 && <Empty icon={Receipt}>{caja.gastos.length ? "Ningún gasto con ese filtro" : "Sin gastos este mes"}</Empty>}
          </div>
          <div className="hidden sm:block card overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left p-3">Concepto</th>
                  <th className="text-left p-3">Área</th>
                  <th className="text-left p-3">Fuente</th>
                  <th className="text-right p-3">Monto</th>
                  <th className="p-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {gastosVis.map((x) => (
                  <tr key={x.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <div className="font-semibold">{x.concepto}</div>
                      <div className="text-xs text-muted">{x.rubro} · {fecha(x.fecha)}</div>
                    </td>
                    <td className="p-3 text-xs uppercase text-muted">{AREA_LABEL[x.area]}</td>
                    <td className="p-3 text-xs">{x.fuente === "CAJA_MENOR" ? "Caja menor" : x.fuente === "BANCO" ? "Banco" : "Efectivo"}</td>
                    <td className="p-3 text-right tabular-nums">{m(x.monto)}</td>
                    <td className="p-3">
                      <Button size="sm" variant="secondary" onClick={async () => (await confirmar({ titulo: "¿Eliminar este gasto?", mensaje: "El dinero vuelve a la caja.", confirmar: "Eliminar", peligro: true })) && post("/api/caja", { method: "POST", body: JSON.stringify({ action: "eliminar", id: x.id }) }, "Gasto eliminado")}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {gastosVis.length === 0 && <Empty>Sin gastos con ese filtro</Empty>}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <h3 className="section-title">Inventario</h3>
          <Button size="sm" className="!rounded-full" onClick={() => setNuevoItem(true)}><Plus className="w-4 h-4" /> Producto</Button>
        </div>
        <Chips
          value={estadoInv}
          onChange={setEstadoInv}
          opciones={[
            { key: "TODOS", label: "Todos", n: caja.inventario.length },
            { key: "Bajo", label: "Por acabarse", n: caja.inventario.filter((i) => i.estado === "Bajo").length },
            { key: "Agotado", label: "Agotados", n: caja.inventario.filter((i) => i.estado === "Agotado").length },
          ]}
        />
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          {/* Celular: una tarjeta por producto con sus movimientos a un toque */}
          <div className="sm:hidden space-y-2">
            {invVis.map((i) => (
              <div key={i.id} className="card p-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold truncate">{i.producto}</span>
                      <span className={cn("text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-full shrink-0", i.estado === "Agotado" && "bg-accent text-white", i.estado === "Bajo" && "bg-accent-light text-accent-dark", i.estado === "OK" && "bg-green-50 text-green-700")}>
                        {i.estado}
                      </span>
                    </div>
                    <div className="text-sm"><strong className="tabular-nums">{i.cantidad}</strong> {i.unidad} <span className="text-xs text-muted">· mín. {i.minimo}</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <button onClick={() => setMov({ item: i, tipo: "ENTRADA" })} className="min-h-[48px] rounded-xl border border-border text-xs font-semibold flex flex-col items-center justify-center gap-0.5"><ArrowDownToLine className="w-4 h-4 text-green-700" />Entra</button>
                  <button onClick={() => setMov({ item: i, tipo: "SALIDA" })} className="min-h-[48px] rounded-xl border border-border text-xs font-semibold flex flex-col items-center justify-center gap-0.5"><ArrowUpFromLine className="w-4 h-4 text-accent" />Sale</button>
                  <button onClick={() => setMov({ item: i, tipo: "AJUSTE" })} className="min-h-[48px] rounded-xl border border-border text-xs font-semibold flex flex-col items-center justify-center gap-0.5"><SlidersHorizontal className="w-4 h-4" />Contar</button>
                  <button onClick={async () => (await confirmar({ titulo: `¿Eliminar ${i.producto}?`, mensaje: "Se borra del inventario.", confirmar: "Eliminar", peligro: true })) && post(`/api/inventory/${i.id}`, { method: "DELETE" }, "Producto eliminado")} className="min-h-[48px] rounded-xl border border-border text-xs font-semibold flex flex-col items-center justify-center gap-0.5 text-muted"><Trash2 className="w-4 h-4" />Borrar</button>
                </div>
              </div>
            ))}
            {invVis.length === 0 && <div className="card"><Empty icon={Package}>{caja.inventario.length ? "Ningún producto con ese filtro" : "Aún no hay productos"}</Empty></div>}
          </div>
          <div className="hidden sm:block card overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left p-3">Producto</th>
                  <th className="text-right p-3">Cantidad</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-right p-3">Movimientos</th>
                </tr>
              </thead>
              <tbody>
                {invVis.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <div className="font-semibold">{i.producto}</div>
                      <div className="text-xs text-muted">Mín. {i.minimo} {i.unidad}{i.costoUnitario > 0 && ` · ${m(i.costoUnitario)}/${i.unidad}`}</div>
                    </td>
                    <td className="p-3 text-right font-bold tabular-nums">{i.cantidad} <span className="font-normal text-muted text-xs">{i.unidad}</span></td>
                    <td className="p-3">
                      <span className={cn("text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-full", i.estado === "Agotado" && "bg-accent text-white", i.estado === "Bajo" && "bg-accent-light text-accent-dark", i.estado === "OK" && "bg-surface text-muted")}>
                        {i.estado}
                      </span>
                    </td>
                    <td className="p-3">
                      <AdminBtnGroup className="justify-end w-full">
                        <Button size="sm" variant="secondary" title="Entrada / compra" onClick={() => setMov({ item: i, tipo: "ENTRADA" })}><ArrowDownToLine className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="secondary" title="Salida / consumo" onClick={() => setMov({ item: i, tipo: "SALIDA" })}><ArrowUpFromLine className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="secondary" title="Ajuste por conteo" onClick={() => setMov({ item: i, tipo: "AJUSTE" })}><SlidersHorizontal className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" title="Eliminar" onClick={async () => (await confirmar({ titulo: `¿Eliminar ${i.producto}?`, mensaje: "Se borra del inventario.", confirmar: "Eliminar", peligro: true })) && post(`/api/inventory/${i.id}`, { method: "DELETE" }, "Producto eliminado")}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </AdminBtnGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card overflow-hidden">
            <div className="p-3 border-b border-border bg-surface text-sm font-semibold">Últimos movimientos</div>
            {caja.movimientosInventario.length === 0 ? (
              <Empty>Sin movimientos</Empty>
            ) : (
              caja.movimientosInventario.map((x) => (
                <div key={x.id} className="px-3 py-2 border-b border-border last:border-0 text-sm flex justify-between gap-2">
                  <span>
                    <strong>{x.tipo === "ENTRADA" ? "+" : x.tipo === "SALIDA" ? "−" : "="}{x.cantidad}</strong> {x.producto}
                    {x.nota && <span className="text-muted"> · {x.nota}</span>}
                  </span>
                  <span className="text-xs text-muted whitespace-nowrap">{fecha(x.fecha)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <MovModal mov={mov} onClose={() => setMov(null)} />
      <AjusteCajaModal
        tipo={ajuste}
        actual={ajuste === "base" ? caja.base : caja.saldo}
        onClose={() => setAjuste(null)}
        onSave={async (valor) => {
          const ok =
            ajuste === "arqueo"
              ? await post("/api/caja", { method: "POST", body: JSON.stringify({ action: "arqueo", saldoReal: valor }) }, (r) => `Arqueo registrado · diferencia ${m(r.diff)}`)
              : await post("/api/caja", { method: "POST", body: JSON.stringify({ action: "base", base: valor }) }, "Base actualizada");
          if (ok) setAjuste(null);
        }}
      />
      <ItemModal open={nuevoItem} onClose={() => setNuevoItem(false)} />
    </div>
  );
}

function MovModal({ mov, onClose }: { mov: { item: Item; tipo: "ENTRADA" | "SALIDA" | "AJUSTE" } | null; onClose: () => void }) {
  const flash = useAdminStore((s) => s.flash);
  const refreshAll = useAdminStore((s) => s.refreshAll);
  const [cantidad, setCantidad] = useState("");
  const [costoTotal, setCostoTotal] = useState("");
  const [fuente, setFuente] = useState("CAJA_MENOR");
  const [nota, setNota] = useState("");
  const titulo = mov?.tipo === "ENTRADA" ? "Entrada / compra" : mov?.tipo === "SALIDA" ? "Salida / consumo" : "Ajuste por conteo físico";

  return (
    <Modal open={Boolean(mov)} title={`${titulo} · ${mov?.item.producto ?? ""}`} subtitle={mov ? `Hay ${mov.item.cantidad} ${mov.item.unidad}` : ""} onClose={onClose}>
      {mov && (
        <ModalForm
          submitLabel="Registrar"
          onCancel={onClose}
          onSubmit={async () => {
            await apiSend(`/api/inventory/${mov.item.id}`, {
              method: "PATCH",
              body: JSON.stringify({ action: "movimiento", tipo: mov.tipo, cantidad: Number(cantidad), costoTotal: Number(costoTotal) || 0, fuente, nota }),
            });
            flash("Inventario actualizado");
            setCantidad(""); setCostoTotal(""); setNota("");
            onClose();
            await refreshAll();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label={mov.tipo === "AJUSTE" ? `Cantidad real (${mov.item.unidad})` : `Cantidad (${mov.item.unidad})`}>
              <input type="number" step="any" min={0} required className={inputClass} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </Field>
            <Field label="Nota">
              <input className={inputClass} value={nota} onChange={(e) => setNota(e.target.value)} />
            </Field>
            {mov.tipo === "ENTRADA" && (
              <>
                <Field label="Costo total de la compra">
                  <MoneyInput value={costoTotal} onValueChange={setCostoTotal} placeholder="0 = sin gasto" />
                </Field>
                <Field label="Pagado con">
                  <select className={inputClass} value={fuente} onChange={(e) => setFuente(e.target.value)}>
                    <option value="CAJA_MENOR">Caja menor</option>
                    <option value="EFECTIVO">Efectivo caja mayor</option>
                    <option value="BANCO">Banco</option>
                  </select>
                </Field>
              </>
            )}
          </div>
          {mov.tipo === "ENTRADA" && <p className="text-xs text-muted">Si pones el costo, se registra automáticamente como gasto del área {AREA_LABEL[mov.item.area]}.</p>}
        </ModalForm>
      )}
    </Modal>
  );
}

function ItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const flash = useAdminStore((s) => s.flash);
  const refreshAll = useAdminStore((s) => s.refreshAll);
  const [f, setF] = useState({ producto: "", cantidad: "0", unidad: "kg", minimo: "5", area: "COMIDA" });
  return (
    <Modal open={open} title="Nuevo producto de inventario" onClose={onClose}>
      <ModalForm
        submitLabel="Crear"
        onCancel={onClose}
        onSubmit={async () => {
          await apiSend("/api/inventory", { method: "POST", body: JSON.stringify(f) });
          flash(`${f.producto} agregado al inventario`);
          setF({ producto: "", cantidad: "0", unidad: "kg", minimo: "5", area: "COMIDA" });
          onClose();
          await refreshAll();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Producto" className="col-span-2"><input required className={inputClass} value={f.producto} onChange={(e) => setF({ ...f, producto: e.target.value })} /></Field>
          <Field label="Cantidad inicial"><input type="number" step="any" className={inputClass} value={f.cantidad} onChange={(e) => setF({ ...f, cantidad: e.target.value })} /></Field>
          <Field label="Unidad"><input className={inputClass} value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })} /></Field>
          <Field label="Mínimo (alerta)"><input type="number" step="any" className={inputClass} value={f.minimo} onChange={(e) => setF({ ...f, minimo: e.target.value })} /></Field>
          <Field label="Área">
            <select className={inputClass} value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })}>
              <option value="COMIDA">Comida</option>
              <option value="HABITACIONES">Habitaciones (aseo, lencería)</option>
              <option value="GENERAL">General</option>
            </select>
          </Field>
        </div>
      </ModalForm>
    </Modal>
  );
}

/** Arqueo (contar el dinero real) o cambio de la base de la caja menor. */
function AjusteCajaModal({
  tipo,
  actual,
  onClose,
  onSave,
}: {
  tipo: "arqueo" | "base" | null;
  actual: number;
  onClose: () => void;
  onSave: (valor: number) => Promise<void>;
}) {
  const [valor, setValor] = useState("");
  useEffect(() => {
    if (tipo) setValor(String(actual));
  }, [tipo, actual]);
  return (
    <Modal
      open={Boolean(tipo)}
      title={tipo === "arqueo" ? "Arqueo de caja" : "Cambiar base"}
      subtitle={tipo === "arqueo" ? "Cuenta el dinero que hay físicamente en la caja menor." : "Monto fijo que debe tener la caja menor."}
      onClose={onClose}
    >
      <ModalForm submitLabel="Guardar" onCancel={onClose} onSubmit={() => onSave(Number(valor))}>
        <Field label={tipo === "arqueo" ? "Dinero contado" : "Nueva base"}>
          <MoneyInput required autoFocus value={valor} onValueChange={setValor} />
        </Field>
      </ModalForm>
    </Modal>
  );
}
