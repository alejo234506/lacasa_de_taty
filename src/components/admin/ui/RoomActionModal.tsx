"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { RoomStatus } from "@/lib/data";

export function RoomActionModal({
  open,
  roomNumero,
  estado,
  onClose,
  onAction,
}: {
  open: boolean;
  roomNumero: string;
  estado: RoomStatus;
  onClose: () => void;
  onAction: (action: string, payload?: { ocupante?: string; tarifa?: number; consumo?: number }) => Promise<void>;
}) {
  const [ocupante, setOcupante] = useState("");
  const [tarifa, setTarifa] = useState(95000);
  const [consumo, setConsumo] = useState(18000);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function run(action: string, payload?: { ocupante?: string; tarifa?: number; consumo?: number }) {
    setLoading(true);
    try {
      await onAction(action, payload);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const primaryAction =
    estado === "LIBRE" ? "checkin" :
    estado === "HOTEL" ? "checkout" :
    estado === "PENS" ? "checkout" :
    estado === "SUCIA" ? "limpiar" :
    "limpiar";

  const primaryLabel =
    estado === "LIBRE" ? "Confirmar check-in" :
    estado === "HOTEL" || estado === "PENS" ? "Confirmar check-out" :
    estado === "SUCIA" ? "Marcar como limpia" :
    "Finalizar mantenimiento";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">
          Hab. {roomNumero}
        </h2>

        {estado === "LIBRE" && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted uppercase">Nombre del huésped</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-xl border border-border focus:border-accent focus:outline-none"
                value={ocupante}
                onChange={(e) => setOcupante(e.target.value)}
                placeholder="Nombre completo"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted uppercase">Tarifa (noche o mes)</span>
              <input
                type="number"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-border focus:border-accent focus:outline-none"
                value={tarifa}
                onChange={(e) => setTarifa(Number(e.target.value))}
              />
            </label>
          </div>
        )}

        <label className="block">
          <span className="text-xs font-semibold text-muted uppercase">Cargar consumo ($)</span>
          <input
            type="number"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-border focus:border-accent focus:outline-none"
            value={consumo}
            onChange={(e) => setConsumo(Number(e.target.value))}
          />
        </label>

        <div className="flex flex-wrap gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => run("consumo", { consumo })}
          >
            Cargar consumo
          </Button>
          {estado === "MANT" && (
            <Button type="button" size="sm" disabled={loading} onClick={() => run("limpiar")}>
              Cerrar mantenimiento
            </Button>
          )}
          {estado !== "MANT" && (
            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={() => run(primaryAction, { ocupante, tarifa })}
            >
              {primaryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
