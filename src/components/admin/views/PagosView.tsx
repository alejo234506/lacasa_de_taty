
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { Buscador, Chips } from "../ui/Filtros";
import { formatMoney } from "@/lib/money";
import { apiSend } from "@/lib/api-client";
import type { Pago, ReporteRow } from "@/lib/panel-types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AdminBtnGroup } from "../ui/AdminToolbar";
import { Badge, Empty, Field, Modal, ModalForm, MoneyInput, fecha, inputClass } from "../ui/Modal";

export function PagosView() {
  const moneda = useAdminStore((s) => s.moneda);
  const pagos = useAdminStore((s) => s.pagos);
  const reportes = useAdminStore((s) => s.reportes);
  const flash = useAdminStore((s) => s.flash);
  const confirmar = useAdminStore((s) => s.confirmar);
  const refreshAll = useAdminStore((s) => s.refreshAll);
  const setRecibo = useAdminStore((s) => s.setRecibo);
  const m = (n: number) => formatMoney(n, moneda);

  const [q, setQ] = useState("");
  const [origen, setOrigen] = useState<"TODOS" | Pago["origen"]>("TODOS");
  const [aprobar, setAprobar] = useState<ReporteRow | null>(null);
  const [monto, setMonto] = useState("");

  const pendientes = reportes.filter((r) => r.estado === "PENDIENTE");
  const resueltos = reportes.filter((r) => r.estado !== "PENDIENTE").slice(0, 10);
  const lista = pagos.filter(
    (p) => (origen === "TODOS" || p.origen === origen) && (!q || `${p.numero} ${p.cliente} ${p.habitacion} ${p.referencia}`.toLowerCase().includes(q.toLowerCase()))
  );

  async function rechazar(r: ReporteRow) {
    const motivo = prompt("Motivo del rechazo (lo verá el pensionado):", "No encontramos el pago en la cuenta");
    if (motivo === null) return;
    try {
      await apiSend(`/api/reportes/${r.id}`, { method: "PATCH", body: JSON.stringify({ action: "rechazar", motivo }) });
      flash("Reporte rechazado");
      await refreshAll();
    } catch (e) {
      flash((e as Error).message, "error");
    }
  }

  async function anular(p: Pago) {
    if (!(await confirmar({ titulo: `¿Anular la factura ${p.numero}?`, mensaje: "El saldo vuelve a la cuenta del pensionado.", confirmar: "Anular", peligro: true }))) return;
    try {
      await apiSend(`/api/pagos/${p.id}`, { method: "DELETE" });
      flash(`Factura ${p.numero} anulada`);
      await refreshAll();
    } catch (e) {
      flash((e as Error).message, "error");
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="section-title mb-3">
          Pagos avisados por verificar ({pendientes.length})
        </h3>
        <div className="card overflow-hidden">
          {pendientes.length === 0 ? (
            <Empty>No hay avisos de pago pendientes. Los pensionados avisan desde su link personal.</Empty>
          ) : (
            pendientes.map((r) => (
              <div key={r.id} className="p-4 border-b border-border last:border-0 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{r.nombre} · hab. {r.habitacion}</div>
                  <div className="text-sm">{m(r.monto)} por {r.metodo}{r.referencia && ` · ref ${r.referencia}`}</div>
                  <div className="text-xs text-muted mt-1">&ldquo;{r.comprobante}&rdquo; · {fecha(r.fecha)}</div>
                  <div className="text-xs text-muted">Saldo actual: {r.saldo > 0 ? m(r.saldo) : "al día"}</div>
                </div>
                <AdminBtnGroup>
                  <Button size="sm" data-tour="pago-verificar" onClick={() => { setAprobar(r); setMonto(String(r.monto)); }}>
                    <CheckCircle2 className="w-4 h-4" /> Verificar y facturar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => rechazar(r)}>
                    <XCircle className="w-4 h-4" /> Rechazar
                  </Button>
                </AdminBtnGroup>
              </div>
            ))
          )}
        </div>
        {resueltos.length > 0 && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-muted">Avisos resueltos recientes</summary>
            <ul className="mt-2 space-y-1">
              {resueltos.map((r) => (
                <li key={r.id} className="flex gap-2 items-center">
                  <Badge tone={r.estado === "APROBADO" ? "green" : "accent"}>{r.estado}</Badge>
                  {r.nombre} · {m(r.monto)} · {fecha(r.fecha)} {r.motivo && `· ${r.motivo}`}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="section-title px-1">Historial de pagos y facturas</h3>
        <Buscador value={q} onChange={setQ} placeholder="Buscar factura, cliente o referencia" />
        <Chips
          value={origen}
          onChange={setOrigen}
          opciones={[
            { key: "TODOS", label: "Todos", n: pagos.length },
            { key: "PENSION", label: "Pensión", n: pagos.filter((p) => p.origen === "PENSION").length },
            { key: "HOTEL", label: "Huéspedes", n: pagos.filter((p) => p.origen === "HOTEL").length },
            { key: "CUENTA", label: "Cuenta unida", n: pagos.filter((p) => p.origen === "CUENTA").length },
          ]}
        />
        {/* Celular: una tarjeta por pago; tocarla abre la factura */}
        <div className="sm:hidden card divide-y divide-border">
          {lista.map((p) => (
            <div key={p.id} className={cn("flex items-center gap-2", p.anulado && "text-muted line-through")}>
              <button onClick={() => setRecibo(p)} className="flex-1 min-w-0 text-left p-3">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold truncate">{p.cliente}</span>
                  <span className="font-bold tabular-nums whitespace-nowrap">{m(p.total)}</span>
                </div>
                <div className="text-xs text-muted truncate">
                  {p.numero} · {p.metodo} · {fecha(p.fecha)}
                </div>
              </button>
              {!p.anulado && (
                <button onClick={() => anular(p)} className="shrink-0 px-3 min-h-[44px] text-xs font-semibold text-accent">
                  Anular
                </button>
              )}
            </div>
          ))}
          {lista.length === 0 && <Empty>Aún no hay pagos registrados</Empty>}
        </div>
        <div className="hidden sm:block card overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left p-3">Factura</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Método</th>
                <th className="text-right p-3">Total</th>
                <th className="text-right p-3">Saldo después</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className={cn("border-b border-border last:border-0", p.anulado && "text-muted line-through")}>
                  <td className="p-3">
                    <div className="font-bold">{p.numero}</div>
                    <div className="text-xs text-muted">{fecha(p.fecha)}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold">{p.cliente}</div>
                    <div className="text-xs text-muted">Hab. {p.habitacion} · {p.origen === "HOTEL" ? "Hotel" : p.origen === "CUENTA" ? "Cuenta unida" : "Pensión"}</div>
                  </td>
                  <td className="p-3 text-xs">{p.metodo}{p.referencia && <div className="text-muted">ref {p.referencia}</div>}</td>
                  <td className="p-3 text-right font-bold tabular-nums">{m(p.total)}</td>
                  <td className="p-3 text-right tabular-nums">{p.origen === "HOTEL" ? "—" : p.saldoNuevo > 0 ? m(p.saldoNuevo) : <span className="text-green-700 font-semibold">Al día</span>}</td>
                  <td className="p-3">
                    <AdminBtnGroup className="justify-end w-full">
                      <Button size="sm" variant="secondary" onClick={() => setRecibo(p)}>Ver factura</Button>
                      {!p.anulado && <Button size="sm" variant="ghost" onClick={() => anular(p)}>Anular</Button>}
                    </AdminBtnGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lista.length === 0 && <Empty>Aún no hay pagos registrados</Empty>}
        </div>
      </section>

      <Modal open={Boolean(aprobar)} title="Verificar pago" subtitle={aprobar ? `${aprobar.nombre} · ${aprobar.metodo}` : ""} onClose={() => setAprobar(null)}>
        {aprobar && (
          <ModalForm
            submitLabel="Confirmar y generar factura"
            onCancel={() => setAprobar(null)}
            onSubmit={async () => {
              const out = await apiSend<{ pago: Pago }>(`/api/reportes/${aprobar.id}`, {
                method: "PATCH",
                body: JSON.stringify({ action: "aprobar", monto: Number(monto) }),
              });
              setAprobar(null);
              flash(`Pago verificado · factura ${out.pago.numero}`);
              await refreshAll();
              setRecibo(out.pago);
            }}
          >
            <p className="text-sm text-muted">&ldquo;{aprobar.comprobante}&rdquo;</p>
            <Field label="Monto que realmente llegó">
              <MoneyInput required value={monto} onValueChange={setMonto} />
            </Field>
          </ModalForm>
        )}
      </Modal>
    </div>
  );
}
