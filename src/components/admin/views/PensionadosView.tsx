"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Copy, Check, MessageCircle, RefreshCw, Link2, Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import type { ResidentRow } from "@/lib/panel-types";
import { AdminBtnGroup, AdminTableActions, AdminToolbar } from "../ui/AdminToolbar";
import { ResidentModal, type ResidentFormData } from "../ui/ResidentModal";

const GRUPOS = [
  ["TODOS", "Todos"],
  ["REGULAR_13_20", "Regular · 13 al 20"],
  ["MEDICINA_30_05", "Medicina · 30 al 05"],
] as const;

export function PensionadosView() {
  const moneda = useAdminStore((s) => s.moneda);
  const setRecibo = useAdminStore((s) => s.setRecibo);
  const flash = useAdminStore((s) => s.flash);
  const refreshPanel = useAdminStore((s) => s.refreshPanel);
  const m = (n: number) => formatMoney(n, moneda);

  const residents = useAdminStore((s) => s.residents);
  const panelLoading = useAdminStore((s) => s.panelLoading);
  const refreshResources = useAdminStore((s) => s.refreshResources);
  const [grupo, setGrupo] = useState("TODOS");
  const [copied, setCopied] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ResidentFormData | null>(null);

  async function load() {
    await refreshResources(["residents", "dashboard", "cierre"]);
  }

  async function copyLink(id: string, link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(id);
    flash("Link copiado al portapapeles");
    setTimeout(() => setCopied(null), 2000);
  }

  function whatsappLink(nombre: string, link: string) {
    const msg = encodeURIComponent(
      `Hola ${nombre.split(" ")[0]}, aquí está tu enlace personal de Casa Taty para ver tu plan de alimentación y balance:\n\n${link}\n\nGuárdalo en tus favoritos.`
    );
    return `https://wa.me/?text=${msg}`;
  }

  async function regenerateLink(id: string) {
    const res = await fetch(`/api/residents/${id}`, { method: "POST" });
    if (res.ok) {
      flash("Link regenerado — el anterior ya no funciona");
      load();
    } else {
      flash("No se pudo regenerar el link");
    }
  }

  async function saveResident(data: ResidentFormData) {
    if (data.id) {
      const res = await fetch(`/api/residents/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      flash("Pensionado actualizado");
    } else {
      const res = await fetch("/api/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      flash("Pensionado creado");
    }
    await load();
    await refreshPanel();
  }

  async function deleteResident(id: string, nombre: string) {
    if (!confirm(`¿Desactivar a ${nombre}?`)) return;
    const res = await fetch(`/api/residents/${id}`, { method: "DELETE" });
    if (res.ok) {
      flash("Pensionado desactivado");
      load();
      refreshPanel();
    }
  }

  async function cobrar(p: ResidentRow) {
    const reciboRes = await fetch("/api/dashboard", { method: "POST" });
    const reciboData = reciboRes.ok ? await reciboRes.json() : { numero: `RC-${Date.now()}` };

    if (p.saldo > 0) {
      await fetch(`/api/residents/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldo: 0 }),
      });
    }

    setRecibo({
      numero: reciboData.numero,
      cliente: p.nombre,
      documento: p.documento,
      hab: p.habitacion,
      concepto: "Pensión mensual septiembre 2026",
      extra: p.comidaIncluida ? "Alimentación incluida en contrato (30 días)" : null,
      monto: p.tarifaMensual,
      saldo: 0,
      grupo: grupoLabel(p.grupo),
      ventana: ventana(p.grupo),
    });
    flash("Cobro registrado · saldo actualizado");
    load();
    refreshPanel();
  }

  const filtered = residents.filter(
    (r) => grupo === "TODOS" || r.grupo === grupo
  );

  const grupoLabel = (g: string) => (g === "REGULAR_13_20" ? "Regular" : "Medicina");
  const ventana = (g: string) =>
    g === "REGULAR_13_20" ? "13 → 20 sep" : "30 ago → 05 sep";

  if (panelLoading && residents.length === 0) {
    return <div className="text-muted animate-pulse p-8">Cargando pensionados...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="bg-accent-light border border-accent/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Link2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-accent-dark">Links personales para residentes</h3>
            <p className="text-sm text-muted mt-1">
              Crea, edita y cobra pensionados. Cada uno tiene un enlace único para su portal.
            </p>
          </div>
        </div>
      </div>

      <AdminToolbar className="flex-col sm:flex-row items-stretch sm:items-center">
        <AdminBtnGroup className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {GRUPOS.map(([k, label]) => (
            <Button
              key={k}
              size="sm"
              variant={grupo === k ? "primary" : "secondary"}
              onClick={() => setGrupo(k)}
              className="shrink-0"
            >
              {label}
            </Button>
          ))}
        </AdminBtnGroup>
        <Button
          size="sm"
          className="w-full sm:w-auto min-h-[44px]"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Nuevo pensionado
        </Button>
      </AdminToolbar>

      {/* Tarjetas móvil */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => {
          const alDia = p.saldo === 0;
          return (
            <div
              key={p.id}
              className={cn(
                "rounded-2xl border border-border p-4 bg-white shadow-sm",
                !alDia && "border-accent/30 bg-accent-light/30"
              )}
            >
              <div className="flex justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="font-bold truncate">{p.nombre}</div>
                  <div className="text-xs text-muted mt-0.5">
                    Hab. {p.habitacion} · {p.estudios || "Sin registrar"}
                  </div>
                </div>
                <div className={cn("text-right font-bold shrink-0", alDia ? "text-muted" : "text-accent")}>
                  {alDia ? "Al día" : m(p.saldo)}
                </div>
              </div>
              <div className="text-xs text-muted mb-3">
                {grupoLabel(p.grupo)} · {p.comidaIncluida ? "Comida incluida" : "Sin comida"}
              </div>
              <AdminTableActions className="justify-start flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => copyLink(p.id, p.link)}>
                  {copied === p.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <a href={whatsappLink(p.nombre, p.link)} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="secondary"><MessageCircle className="w-4 h-4" /></Button>
                </a>
                <Button size="sm" variant="secondary" onClick={() => regenerateLink(p.id)}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing({
                      id: p.id,
                      nombre: p.nombre,
                      documento: p.documento,
                      habitacion: p.habitacion,
                      grupo: p.grupo as ResidentFormData["grupo"],
                      comidaIncluida: p.comidaIncluida,
                      tarifaMensual: p.tarifaMensual,
                      saldo: p.saldo,
                      estudios: p.estudios || "",
                    });
                    setModalOpen(true);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => cobrar(p)}>Cobrar</Button>
              </AdminTableActions>
            </div>
          );
        })}
      </div>

      {/* Tabla escritorio */}
      <div className="hidden md:block bg-white rounded-2xl border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[960px]">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="text-left p-3 font-semibold">Pensionado</th>
              <th className="text-left p-3 font-semibold">Estudios</th>
              <th className="text-left p-3 font-semibold">Hab.</th>
              <th className="text-right p-3 font-semibold">Saldo</th>
              <th className="text-right p-3 font-semibold w-[320px]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const alDia = p.saldo === 0;
              return (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-surface/50",
                    !alDia && "bg-accent-light/50"
                  )}
                >
                  <td className="p-3">
                    <div className="font-bold">{p.nombre}</div>
                    <div className="text-xs text-muted">
                      {grupoLabel(p.grupo)} · {p.comidaIncluida ? "Comida incluida" : "Sin comida"} · {ventana(p.grupo)}
                    </div>
                  </td>
                  <td className="p-3 text-sm">{p.estudios || "—"}</td>
                  <td className="p-3 font-[family-name:var(--font-playfair)] font-bold">
                    {p.habitacion}
                  </td>
                  <td className={cn("p-3 text-right font-bold tabular-nums", alDia ? "text-muted" : "text-accent")}>
                    {alDia ? "Al día" : m(p.saldo)}
                    <div className="text-xs font-normal text-muted">{m(p.tarifaMensual)}/mes</div>
                  </td>
                  <td className="p-3">
                    <AdminTableActions>
                      <Button size="sm" variant="secondary" onClick={() => copyLink(p.id, p.link)} title="Copiar link">
                        {copied === p.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <a href={whatsappLink(p.nombre, p.link)} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="secondary" title="WhatsApp">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button size="sm" variant="secondary" onClick={() => regenerateLink(p.id)} title="Regenerar link">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditing({
                            id: p.id,
                            nombre: p.nombre,
                            documento: p.documento,
                            habitacion: p.habitacion,
                            grupo: p.grupo as ResidentFormData["grupo"],
                            comidaIncluida: p.comidaIncluida,
                            tarifaMensual: p.tarifaMensual,
                            saldo: p.saldo,
                            estudios: p.estudios || "",
                          });
                          setModalOpen(true);
                        }}
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => deleteResident(p.id, p.nombre)} title="Desactivar">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={() => cobrar(p)}>
                        Cobrar
                      </Button>
                    </AdminTableActions>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ResidentModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={saveResident}
      />
    </div>
  );
}
