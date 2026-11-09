
import Image from "@/components/ui/Image";
import { useAdminStore } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import { LOGO_SRC } from "@/lib/constants";
import { AREA_LABEL } from "@/lib/panel-types";
import { Button } from "@/components/ui/Button";
import { AdminBtnGroup } from "../ui/AdminToolbar";
import { Empty, fecha } from "../ui/Modal";

export function ReciboView() {
  const rec = useAdminStore((s) => s.recibo);
  const setView = useAdminStore((s) => s.setView);
  const moneda = useAdminStore((s) => s.moneda);
  const m = (n: number) => formatMoney(n, moneda);

  if (!rec) {
    return (
      <div className="card">
        <Empty>
          Selecciona una factura desde <button className="text-accent underline" onClick={() => setView("pagos")}>Pagos y facturas</button>.
        </Empty>
      </div>
    );
  }

  const campos = [
    { k: "Recibido de", v: rec.cliente },
    { k: "Documento", v: rec.documento || "—" },
    { k: "Habitación", v: rec.habitacion },
    { k: "Modalidad", v: rec.origen === "HOTEL" ? "Hotel por noches" : rec.origen === "CUENTA" ? "Cuenta unida" : "Pensión" },
    { k: "Método de pago", v: `${rec.metodo}${rec.referencia ? ` · ref ${rec.referencia}` : ""}` },
    { k: "Fecha", v: fecha(rec.fecha) },
  ];

  return (
    <div className="flex gap-6 items-start flex-col lg:flex-row">
      <div className="w-full max-w-[720px] card p-6 sm:p-10 lg:p-12 shadow-lg relative">
        {rec.anulado && (
          <div className="absolute top-6 right-6 rotate-12 border-4 border-accent text-accent font-black text-2xl px-4 py-1 rounded">ANULADA</div>
        )}
        <div className="flex justify-between items-start gap-6 border-b-2 border-border pb-5 mb-6">
          <Image src={LOGO_SRC} alt="Alojamiento Casa Taty" width={190} height={80} className="mix-blend-multiply" />
          <div className="text-right text-sm leading-relaxed">
            <div className="font-[family-name:var(--font-playfair)] font-bold text-base uppercase tracking-wide">Factura / recibo de caja</div>
            <div>No. {rec.numero}</div>
            <div>Alojamiento Casa Taty · Colombia</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-border mb-6">
          {campos.map((c) => (
            <div key={c.k}>
              <div className="text-[9px] tracking-widest uppercase text-muted">{c.k}</div>
              <div className="font-semibold mt-0.5">{c.v}</div>
            </div>
          ))}
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 font-semibold">Concepto</th>
              <th className="text-left py-2 font-semibold hidden sm:table-cell">Área</th>
              <th className="text-right py-2 font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {rec.lineas.map((l, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-3">{l.concepto}</td>
                <td className="py-3 text-xs uppercase text-muted hidden sm:table-cell">{AREA_LABEL[l.area]}</td>
                <td className="py-3 text-right tabular-nums">{m(l.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-baseline pt-4 border-t-2 border-border">
          <span className="font-[family-name:var(--font-playfair)] font-bold uppercase tracking-wide">Total recibido</span>
          <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-accent">{m(rec.total)}</span>
        </div>
        {rec.origen !== "HOTEL" && (
          <div className="flex justify-between text-sm mt-3">
            <span className="text-muted">Saldo anterior {m(rec.saldoAnterior)} → saldo actual</span>
            <strong className={rec.saldoNuevo > 0 ? "text-accent" : "text-green-700"}>
              {rec.saldoNuevo > 0 ? m(rec.saldoNuevo) : rec.saldoNuevo < 0 ? `Al día · a favor ${m(-rec.saldoNuevo)}` : "AL DÍA"}
            </strong>
          </div>
        )}
        {rec.comprobante && <div className="mt-4 text-xs text-muted">Comprobante: {rec.comprobante}</div>}

        <div className="flex gap-8 mt-16">
          {["Firma quien recibe", "Firma cliente"].map((label) => (
            <div key={label} className="flex-1 border-t border-foreground pt-2 text-[11px] uppercase tracking-wider">{label}</div>
          ))}
        </div>
        <div className="mt-6 text-[11px] text-muted">Vive · Descubre · Disfruta</div>
      </div>

      <AdminBtnGroup className="no-print w-full lg:w-64 flex-col shrink-0 [&>button]:w-full [&>button]:justify-center">
        <Button onClick={() => window.print()}>Imprimir / guardar PDF</Button>
        <Button variant="secondary" onClick={() => setView("pagos")}>Ver todos los pagos</Button>
        <Button variant="secondary" onClick={() => setView("pensionados")}>Volver a pensionados</Button>
      </AdminBtnGroup>
    </div>
  );
}
