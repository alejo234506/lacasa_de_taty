
import { useEffect, useState } from "react";
import { apiSend } from "@/lib/api-client";
import { formatMoney } from "@/lib/money";
import { METODOS_PAGO, type Pago } from "@/lib/panel-types";
import { Field, Modal, ModalForm, MoneyInput, inputClass } from "./Modal";

/**
 * Registrar un pago: el pensionado avisó (captura por WhatsApp, etc.); aquí se
 * transcribe en texto lo que muestra el comprobante y se genera la factura.
 */
export function PagoModal({
  open,
  titulo,
  saldo,
  target,
  onClose,
  onDone,
}: {
  open: boolean;
  titulo: string;
  saldo: number;
  target: { residentId: string } | { cuentaId: string } | null;
  onClose: () => void;
  onDone: (pago: Pago) => void;
}) {
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState<string>("Transferencia");
  const [referencia, setReferencia] = useState("");
  const [comprobante, setComprobante] = useState("");

  useEffect(() => {
    if (open) {
      setMonto(saldo > 0 ? String(saldo) : "");
      setMetodo("Transferencia");
      setReferencia("");
      setComprobante("");
    }
  }, [open, saldo]);

  return (
    <Modal
      open={open && Boolean(target)}
      title="Registrar pago"
      subtitle={`${titulo} · saldo actual ${saldo > 0 ? formatMoney(saldo) : "al día"}`}
      onClose={onClose}
    >
      <ModalForm
        submitLabel="Registrar y generar factura"
        onCancel={onClose}
        onSubmit={async () => {
          const pago = await apiSend<Pago>("/api/pagos", {
            method: "POST",
            body: JSON.stringify({ ...target, monto: Number(monto), metodo, referencia, comprobante }),
          });
          onDone(pago);
        }}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Monto recibido">
            <MoneyInput required value={monto} onValueChange={setMonto} />
          </Field>
          <Field label="Método">
            <select className={inputClass} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {METODOS_PAGO.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="N.º de referencia / aprobación" className="sm:col-span-2">
            <input className={inputClass} value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej: M123456" />
          </Field>
          <Field label="Comprobante (lo que dice la captura)" className="sm:col-span-2">
            <textarea
              rows={3}
              className={inputClass}
              value={comprobante}
              onChange={(e) => setComprobante(e.target.value)}
              placeholder="Ej: Captura por WhatsApp 24/10 10:32 a.m. Nequi de Rosalba Pérez a Casa Taty, $1.290.000"
            />
          </Field>
        </div>
        {Number(monto) > 0 && (
          <p className="text-sm text-muted">
            Saldo después del pago:{" "}
            <strong className={saldo - Number(monto) > 0 ? "text-accent" : "text-green-700"}>
              {saldo - Number(monto) > 0
                ? formatMoney(saldo - Number(monto))
                : saldo - Number(monto) < 0
                  ? `al día (saldo a favor ${formatMoney(Number(monto) - saldo)})`
                  : "al día"}
            </strong>
          </p>
        )}
      </ModalForm>
    </Modal>
  );
}
