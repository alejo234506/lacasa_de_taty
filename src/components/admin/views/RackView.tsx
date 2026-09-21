"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/store";
import { formatMoney } from "@/lib/money";
import { EST, RoomStatus } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AdminBtnGroup } from "../ui/AdminToolbar";
import { RoomActionModal } from "../ui/RoomActionModal";

const LEYENDA: { label: string; color: string }[] = [
  { label: "Pensionado", color: "#7a0d20" },
  { label: "Hotel", color: "#201e1d" },
  { label: "Libre", color: "#fbf9f8" },
  { label: "Sucia", color: "#eae7e7" },
  { label: "Mantenimiento", color: "#d7d3d3" },
];

export function RackView() {
  const rooms = useAdminStore((s) => s.rooms);
  const sel = useAdminStore((s) => s.sel);
  const setSel = useAdminStore((s) => s.setSel);
  const updateRoom = useAdminStore((s) => s.updateRoom);
  const moneda = useAdminStore((s) => s.moneda);
  const flash = useAdminStore((s) => s.flash);
  const m = (n: number) => formatMoney(n, moneda);

  const panelLoading = useAdminStore((s) => s.panelLoading);
  const refreshResources = useAdminStore((s) => s.refreshResources);
  const [modalOpen, setModalOpen] = useState(false);

  const selected = rooms.find((r) => r.id === sel) || rooms[0];
  if (!selected) {
    return (
      <div className="text-muted animate-pulse p-8">
        {panelLoading ? "Cargando habitaciones..." : "No hay habitaciones para mostrar"}
      </div>
    );
  }
  const meta = EST[selected.estado];

  async function roomAction(action: string, payload?: { ocupante?: string; tarifa?: number; consumo?: number }) {
    const res = await fetch(`/api/rooms/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (res.ok) {
      const room = await res.json();
      updateRoom(room);
      flash(`Hab. ${room.numero} actualizada`);
      void refreshResources(["dashboard", "cierre"]);
    } else {
      flash("No se pudo actualizar la habitación");
    }
  }

  async function setMantenimiento() {
    await roomAction("mantenimiento", { ocupante: "En mantenimiento" });
  }

  return (
    <div className="flex gap-6 items-start flex-col xl:flex-row">
      <div className="flex-1 min-w-0 w-full">
        <div className="flex flex-wrap gap-4 pb-4 mb-4 border-b-2 border-border">
          {LEYENDA.map((l) => (
            <div key={l.label} className="flex items-center gap-2 text-[11px] uppercase font-bold tracking-wider">
              <span className="w-3.5 h-3.5 rounded-sm border border-border" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
          {rooms.map((r) => {
            const e = EST[r.estado];
            const isSelected = r.id === sel;
            return (
              <button
                key={r.id}
                onClick={() => setSel(r.id)}
                className={cn(
                  "text-left rounded-xl overflow-hidden border transition-all hover:scale-[1.02] hover:shadow-md",
                  isSelected ? "ring-2 ring-accent border-accent shadow-lg" : "border-border"
                )}
                style={{ background: e.bg }}
              >
                <div className="h-1.5" style={{ background: e.bar }} />
                <div className="p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-[family-name:var(--font-playfair)] text-xl font-bold">{r.numero}</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted">{r.tipo}</span>
                  </div>
                  <div className="text-[11px] font-semibold mt-1 min-h-[28px] leading-tight">{r.ocupante}</div>
                  <div className="text-[9px] uppercase tracking-wider font-extrabold mt-1" style={{ color: e.color }}>
                    {e.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="w-full xl:w-80 shrink-0 bg-white rounded-2xl border border-border shadow-lg overflow-hidden">
        <div className="p-5 border-b border-border bg-surface">
          <div className="text-[10px] tracking-widest uppercase text-muted">Habitación</div>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">{selected.numero}</h2>
          <div className="text-xs font-bold uppercase tracking-wider text-accent mt-1">{meta.label}</div>
        </div>
        <div className="p-5 space-y-3">
          {[
            { k: "Tipo", v: selected.tipo },
            { k: "Ocupante", v: selected.ocupante },
            { k: "Desde", v: selected.desde },
            { k: "Hasta", v: selected.hasta },
            { k: selected.estado === "PENS" ? "Tarifa mes" : "Tarifa noche", v: m(selected.tarifa) },
            { k: "Consumos cargados", v: m(selected.consumos) },
          ].map((d) => (
            <div key={d.k} className="flex justify-between gap-3 text-sm border-b border-border pb-2">
              <span className="text-[10px] uppercase tracking-wider text-muted font-bold">{d.k}</span>
              <span className="font-semibold text-right">{d.v}</span>
            </div>
          ))}
          <AdminBtnGroup className="flex-col w-full pt-2 [&>button]:w-full [&>button]:justify-center">
            <Button onClick={() => setModalOpen(true)}>Gestionar habitación</Button>
            <Button variant="secondary" onClick={setMantenimiento}>Enviar a mantenimiento</Button>
          </AdminBtnGroup>
        </div>
      </aside>

      <RoomActionModal
        open={modalOpen}
        roomNumero={selected.numero}
        estado={selected.estado as RoomStatus}
        onClose={() => setModalOpen(false)}
        onAction={roomAction}
      />
    </div>
  );
}
