
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/store";
import { apiGet, apiSend } from "@/lib/api-client";
import { AdminBtnGroup, AdminToolbar } from "../ui/AdminToolbar";
import { Skeleton } from "../ui/Modal";

interface DiaRow {
  dia: string;
  desayuno: string;
  almuerzo: string;
  cena: string;
}

export function MinutaView() {
  const flash = useAdminStore((s) => s.flash);
  const [semana, setSemana] = useState(1);
  const [dias, setDias] = useState<DiaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const mes = new Date().toISOString().slice(0, 7);

  async function load(week: number, signal?: AbortSignal) {
    setLoading(true);
    try {
      const data = await apiGet<{ dias: DiaRow[] }>(`/api/minuta?semana=${week}&mes=${mes}`, signal);
      setDias(data.dias);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        flash("No se pudo cargar la minuta");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    load(semana, controller.signal);
    return () => controller.abort();
  }, [semana]);

  function updateDia(index: number, field: keyof DiaRow, value: string) {
    setDias((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  }

  async function save() {
    setSaving(true);
    try {
      await apiSend("/api/minuta", {
        method: "PUT",
        body: JSON.stringify({ mes, semana, dias }),
      });
      flash(`Minuta semana ${semana} guardada`);
    } catch {
      flash("Error al guardar minuta", "error");
    } finally {
      setSaving(false);
    }
  }

  async function duplicatePrevious() {
    const prevWeek = semana === 1 ? 4 : semana - 1;
    try {
      const data = await apiGet<{ dias: DiaRow[] }>(`/api/minuta?semana=${prevWeek}&mes=${mes}`);
      setDias(data.dias);
      flash(`Minuta de semana ${prevWeek} copiada — guarda para aplicar`);
    } catch {
      flash("No se pudo copiar la minuta anterior");
    }
  }

  return (
    <div>
      <AdminToolbar className="mb-5">
        <AdminBtnGroup>
          {[1, 2, 3, 4].map((n) => (
            <Button
              key={n}
              size="sm"
              variant={semana === n ? "primary" : "secondary"}
              onClick={() => setSemana(n)}
            >
              Semana {n}
            </Button>
          ))}
        </AdminBtnGroup>
        <AdminBtnGroup>
          <Button size="sm" variant="secondary" onClick={duplicatePrevious}>
            Duplicar semana anterior
          </Button>
          <Button size="sm" onClick={save} disabled={saving || loading}>
            {saving ? "Guardando..." : "Guardar minuta"}
          </Button>
        </AdminBtnGroup>
      </AdminToolbar>

      {/* Celular: una tarjeta por día */}
      {!loading && (
        <div className="sm:hidden space-y-3">
          {dias.map((d, i) => (
            <div key={d.dia} className="card p-4 space-y-2">
              <div className="font-[family-name:var(--font-playfair)] font-bold uppercase tracking-wide">{d.dia}</div>
              {(["desayuno", "almuerzo", "cena"] as const).map((field) => (
                <label key={field} className="block">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wide">{field}</span>
                  <input
                    className="mt-1 w-full px-3 min-h-[48px] rounded-xl border border-border bg-background text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    value={d[field]}
                    onChange={(e) => updateDia(i, field, e.target.value)}
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
      <div className={loading ? "" : "hidden sm:block card overflow-x-auto"}>
        {loading ? (
          <Skeleton />
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left p-4 font-semibold w-28">Día</th>
                <th className="text-left p-4 font-semibold">Desayuno</th>
                <th className="text-left p-4 font-semibold">Almuerzo</th>
                <th className="text-left p-4 font-semibold">Cena</th>
              </tr>
            </thead>
            <tbody>
              {dias.map((d, i) => (
                <tr key={d.dia} className="border-b border-border last:border-0">
                  <td className="p-4 font-[family-name:var(--font-playfair)] font-bold uppercase text-sm tracking-wide">
                    {d.dia}
                  </td>
                  {(["desayuno", "almuerzo", "cena"] as const).map((field) => (
                    <td key={field} className="p-3">
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        value={d[field]}
                        onChange={(e) => updateDia(i, field, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
