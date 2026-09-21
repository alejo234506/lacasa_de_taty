"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export interface ResidentFormData {
  id?: string;
  nombre: string;
  documento: string;
  habitacion: string;
  grupo: "REGULAR_13_20" | "MEDICINA_30_05";
  comidaIncluida: boolean;
  tarifaMensual: number;
  saldo: number;
  estudios: string;
}

const empty: ResidentFormData = {
  nombre: "",
  documento: "",
  habitacion: "",
  grupo: "REGULAR_13_20",
  comidaIncluida: true,
  tarifaMensual: 1290000,
  saldo: 0,
  estudios: "",
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
  const [form, setForm] = useState<ResidentFormData>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial || empty);
  }, [open, initial]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <form
        onSubmit={submit}
        className="bg-white rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4"
      >
        <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold">
          {initial?.id ? "Editar pensionado" : "Nuevo pensionado"}
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2 block">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Nombre completo</span>
            <input
              required
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2 block">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Qué estudia / ocupa</span>
            <input
              required
              placeholder="Ej: Medicina, Ingeniería, Trabajo..."
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={form.estudios}
              onChange={(e) => setForm({ ...form, estudios: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Documento</span>
            <input
              required
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={form.documento}
              onChange={(e) => setForm({ ...form, documento: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Habitación</span>
            <input
              required
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={form.habitacion}
              onChange={(e) => setForm({ ...form, habitacion: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Grupo</span>
            <select
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-base focus:border-accent focus:outline-none"
              value={form.grupo}
              onChange={(e) => setForm({ ...form, grupo: e.target.value as ResidentFormData["grupo"] })}
            >
              <option value="REGULAR_13_20">Regular · 13 al 20</option>
              <option value="MEDICINA_30_05">Medicina · 30 al 05</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Tarifa mensual</span>
            <input
              type="number"
              required
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={form.tarifaMensual}
              onChange={(e) => setForm({ ...form, tarifaMensual: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Saldo pendiente</span>
            <input
              type="number"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={form.saldo}
              onChange={(e) => setForm({ ...form, saldo: Number(e.target.value) })}
            />
          </label>
          <label className="sm:col-span-2 flex items-center gap-2 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={form.comidaIncluida}
              onChange={(e) => setForm({ ...form, comidaIncluida: e.target.checked })}
              className="w-5 h-5 rounded border-border text-accent focus:ring-accent"
            />
            <span className="text-sm font-medium">Comida incluida en contrato</span>
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 sm:justify-end sticky bottom-0 bg-white pb-1">
          <Button type="button" variant="secondary" size="sm" className="w-full sm:w-auto min-h-[44px]" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={saving} className="w-full sm:w-auto min-h-[44px]">
            {saving ? "Guardando..." : initial?.id ? "Guardar cambios" : "Crear pensionado"}
          </Button>
        </div>
      </form>
    </div>
  );
}
