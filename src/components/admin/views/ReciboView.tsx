"use client";

import Image from "next/image";
import { useAdminStore } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import { LOGO_SRC } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { AdminBtnGroup } from "../ui/AdminToolbar";

export function ReciboView() {
  const recibo = useAdminStore((s) => s.recibo);
  const setView = useAdminStore((s) => s.setView);
  const moneda = useAdminStore((s) => s.moneda);
  const m = (n: number) => formatMoney(n, moneda);

  const rec = recibo || {
    numero: "RC-4118",
    cliente: "Emma Whitfield",
    documento: "PPT 5518 (USA)",
    hab: "302",
    concepto: "Hotel · 4 noches del 27 al 31 de agosto",
    extra: "3 almuerzos cargados a la habitación",
    monto: 480000,
    saldo: 0,
    grupo: "Hotel diario",
    ventana: "Pago al check-out",
  };

  const campos = [
    { k: "Recibido de", v: rec.cliente },
    { k: "Documento", v: rec.documento },
    { k: "Habitación", v: rec.hab },
    { k: "Modalidad", v: rec.grupo },
    { k: "Ventana de cobro", v: rec.ventana },
    { k: "Fecha", v: "31 de agosto de 2026" },
  ];

  const lineas = [
    { concepto: rec.concepto, valor: m(rec.monto) },
    ...(rec.extra ? [{ concepto: rec.extra, valor: m(0) }] : []),
  ];

  return (
    <div className="flex gap-6 items-start flex-col lg:flex-row">
      <div className="w-full max-w-[720px] bg-white rounded-2xl border border-border p-10 lg:p-12 shadow-lg">
        <div className="flex justify-between items-start gap-6 border-b-2 border-border pb-5 mb-6">
          <Image
            src={LOGO_SRC}
            alt="Alojamiento Casa Taty"
            width={190}
            height={80}
            className="mix-blend-multiply"
          />
          <div className="text-right text-sm leading-relaxed">
            <div className="font-[family-name:var(--font-playfair)] font-bold text-base uppercase tracking-wide">
              Recibo de caja
            </div>
            <div>No. {rec.numero}</div>
            <div>NIT 900.845.221-4</div>
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
              <th className="text-right py-2 font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l) => (
              <tr key={l.concepto} className="border-b border-border">
                <td className="py-3">{l.concepto}</td>
                <td className="py-3 text-right tabular-nums">{l.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-baseline pt-4 border-t-2 border-border">
          <span className="font-[family-name:var(--font-playfair)] font-bold uppercase tracking-wide">
            Total recibido
          </span>
          <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-accent">
            {m(rec.monto)}
          </span>
        </div>

        <div className="flex gap-8 mt-16">
          {["Firma quien recibe", "Firma cliente"].map((label) => (
            <div key={label} className="flex-1 border-t border-foreground pt-2 text-[11px] uppercase tracking-wider">
              {label}
            </div>
          ))}
        </div>

        <div className="mt-6 text-[11px] text-muted">Vive · Descubre · Disfruta</div>
      </div>

      <AdminBtnGroup className="no-print w-full lg:w-64 flex-col shrink-0 [&>button]:w-full [&>button]:justify-center">
        <Button onClick={() => window.print()}>Imprimir recibo</Button>
        <Button variant="secondary" onClick={() => setView("pensionados")}>
          Volver a pensionados
        </Button>
      </AdminBtnGroup>
    </div>
  );
}
