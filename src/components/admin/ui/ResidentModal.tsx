
import { useEffect, useState } from "react";
import { useAdminStore } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import type { PlanComida } from "@/lib/panel-types";
import { Field, Modal, ModalForm, MoneyInput, inputClass } from "./Modal";

export interface ResidentFormData {
  id?: string;
  nombre: string;
  documento: string;
  telefono: string;
  habitacion: string;
  grupo: "REGULAR_13_20" | "MEDICINA_30_05";
  estudios: string;
  tarifaHabitacion: number;
  planComida: PlanComida;
  tarifaComida: number;
  saldo: number;
}

const empty: ResidentFormData = {
  nombre: "",
  documento: "",
  telefono: "",
  habitacion: "",
  grupo: "REGULAR_13_20",
  estudios: "",
  tarifaHabitacion: 900000,
  planComida: "MENSUAL",
  tarifaComida: 380000,
  saldo: 0,
};

export function ResidentModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: ResidentFormData | null;
  onClose: () => void;
  onSave: (data: ResidentFormData) => Promise<void>;
}) {
  const rooms = useAdminStore((s) => s.rooms);
  const [form, setForm] = useState<ResidentFormData>(empty);

  useEffect(() => {
    if (open) setForm(initial || empty);
  }, [open, initial]);

  const set = <K extends keyof ResidentFormData>(k: K, v: ResidentFormData[K]) => setForm((f) => ({ ...f, [k]: v }));
  const comidaMes = form.planComida === "MENSUAL" ? form.tarifaComida : form.planComida === "SEMANAL" ? form.tarifaComida * 4 : 0;

  return (
    <Modal open={open} title={initial?.id ? "Editar pensionado" : "Nuevo pensionado"} onClose={onClose}>
      <ModalForm submitLabel={initial?.id ? "Guardar cambios" : "Crear pensionado"} onCancel={onClose} onSubmit={() => onSave(form)}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nombre completo" className="sm:col-span-2">
            <input required className={inputClass} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </Field>
          <Field label="Documento">
            <input required className={inputClass} value={form.documento} onChange={(e) => set("documento", e.target.value)} />
          </Field>
          <Field label="Teléfono / WhatsApp">
            <input className={inputClass} value={form.telefono} onChange={(e) => set("telefono", e.target.value)} />
          </Field>
          <Field label="Qué estudia / ocupación" className="sm:col-span-2">
            <input className={inputClass} value={form.estudios} onChange={(e) => set("estudios", e.target.value)} placeholder="Ej: Medicina, Ingeniería, Trabajo..." />
          </Field>
          <Field label="Habitación">
            <select required className={inputClass} value={form.habitacion} onChange={(e) => set("habitacion", e.target.value)}>
              <option value="">Selecciona...</option>
              {rooms.map((r) => {
                const ocupados = r.residentes.length;
                const propia = initial?.habitacion === r.numero;
                const llena = ocupados >= r.capacidad && !propia;
                return (
                  <option key={r.id} value={r.numero} disabled={llena || Boolean(r.stay)}>
                    {r.numero} · {r.tipo} · {ocupados}/{r.capacidad}
                    {llena ? " (llena)" : r.stay ? " (huésped)" : ""}
                  </option>
                );
              })}
            </select>
          </Field>
          <Field label="Grupo de cobro">
            <select className={inputClass} value={form.grupo} onChange={(e) => set("grupo", e.target.value as ResidentFormData["grupo"])}>
              <option value="REGULAR_13_20">Regular · paga del 13 al 20</option>
              <option value="MEDICINA_30_05">Medicina · paga del 30 al 05</option>
            </select>
          </Field>
          <Field label="Arriendo habitación (mes)">
            <MoneyInput required value={form.tarifaHabitacion} onValueChange={(d) => set("tarifaHabitacion", Number(d))} />
          </Field>
          <Field label="Plan de comida">
            <select
              className={inputClass}
              value={form.planComida}
              onChange={(e) => set("planComida", e.target.value as PlanComida)}
            >
              <option value="MENSUAL">Mensual</option>
              <option value="SEMANAL">Semanal</option>
              <option value="NINGUNO">Sin comida</option>
            </select>
          </Field>
          {form.planComida !== "NINGUNO" && (
            <Field label={form.planComida === "SEMANAL" ? "Valor comida por semana" : "Valor comida por mes"}>
              <MoneyInput value={form.tarifaComida} onValueChange={(d) => set("tarifaComida", Number(d))} />
            </Field>
          )}
          {!initial?.id && (
            <Field label="Saldo inicial que debe">
              <MoneyInput allowNegative value={form.saldo} onValueChange={(d) => set("saldo", d === "-" ? 0 : Number(d))} />
            </Field>
          )}
        </div>
        <div className="rounded-xl bg-surface border border-border p-3 text-sm flex justify-between">
          <span className="text-muted">Total mensual estimado</span>
          <strong>{formatMoney(form.tarifaHabitacion + comidaMes)}</strong>
        </div>
      </ModalForm>
    </Modal>
  );
}
