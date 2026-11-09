
import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useAdminStore, type ToastTipo } from "@/lib/store";
import { cn } from "@/lib/utils";

const ESTILO: Record<ToastTipo, { icon: React.ElementType; caja: string; icono: string }> = {
  ok: { icon: CheckCircle2, caja: "bg-white border-green-200", icono: "text-green-600" },
  error: { icon: XCircle, caja: "bg-white border-red-200", icono: "text-red-600" },
  info: { icon: Info, caja: "bg-white border-sky-200", icono: "text-sky-600" },
};

/** Avisos flotantes: arriba en el celular (no tapan la barra inferior), abajo a la derecha en computador. */
export function Toasts() {
  const toasts = useAdminStore((s) => s.toasts);
  const cerrar = useAdminStore((s) => s.cerrarToast);
  return (
    <div
      aria-live="polite"
      className="no-print fixed z-[200] inset-x-0 top-2 px-3 flex flex-col items-center gap-2 pointer-events-none sm:inset-x-auto sm:top-auto sm:bottom-6 sm:right-6 sm:items-end"
    >
      {toasts.map((t) => {
        const e = ESTILO[t.tipo];
        const Icon = e.icon;
        return (
          <button
            key={t.id}
            onClick={() => cerrar(t.id)}
            className={cn(
              "pointer-events-auto anim-toast w-full max-w-sm flex items-start gap-3 text-left rounded-2xl border shadow-xl px-4 py-3",
              e.caja
            )}
          >
            <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", e.icono)} />
            <span className="flex-1 text-sm font-semibold text-foreground">{t.msg}</span>
            <X className="w-4 h-4 mt-0.5 text-muted shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

/** Ventana de confirmación con ícono; se abre con useAdminStore().confirmar({...}). */
export function ConfirmDialog() {
  const c = useAdminStore((s) => s.confirmacion);
  const responder = useAdminStore((s) => s.responderConfirmacion);

  useEffect(() => {
    if (!c) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && responder(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [c, responder]);

  if (!c) return null;
  return (
    <div
      className="no-print fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/45 anim-fade"
      onMouseDown={(e) => e.target === e.currentTarget && responder(false)}
    >
      <div className="anim-sheet w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center shadow-2xl">
        <div
          className={cn(
            "mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3",
            c.peligro ? "bg-red-50 text-red-600" : "bg-accent-light text-accent"
          )}
        >
          {c.peligro ? <AlertTriangle className="w-7 h-7" /> : <Info className="w-7 h-7" />}
        </div>
        <h2 className="text-lg font-bold">{c.titulo}</h2>
        {c.mensaje && <p className="text-sm text-muted mt-1">{c.mensaje}</p>}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button onClick={() => responder(false)} className="min-h-[48px] rounded-xl border border-border font-semibold">
            Cancelar
          </button>
          <button
            autoFocus
            onClick={() => responder(true)}
            className={cn("min-h-[48px] rounded-xl font-semibold text-white", c.peligro ? "bg-red-600" : "bg-accent")}
          >
            {c.confirmar ?? "Sí, continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
