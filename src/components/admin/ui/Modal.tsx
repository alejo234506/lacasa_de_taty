
import { useEffect, useState } from "react";
import { AlertCircle, Check, Inbox, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export const inputClass =
  "mt-1 w-full px-3 min-h-[48px] rounded-xl border border-border bg-white text-base sm:text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

/** Campo de dinero: muestra puntos de miles mientras se escribe (95.000) y entrega solo los dígitos. */
export function MoneyInput({
  value,
  onValueChange,
  allowNegative = false,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number | string;
  onValueChange: (digits: string) => void;
  allowNegative?: boolean;
}) {
  const raw = String(value ?? "");
  const negative = allowNegative && raw.startsWith("-");
  const digits = raw.replace(/\D/g, "");
  const shown = (negative ? "-" : "") + (digits ? Number(digits).toLocaleString("es-CO") : "");
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      className={className ?? inputClass}
      value={shown}
      onChange={(e) => {
        const v = e.target.value;
        const d = v.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
        onValueChange((allowNegative && v.trim().startsWith("-") ? "-" : "") + d);
      }}
    />
  );
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      data-tour="fondo-modal"
      className="no-print fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/45 anim-fade"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        data-tour="modal-form"
        className={cn(
          "anim-sheet bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-h-[92dvh] overflow-y-auto overscroll-contain",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        )}
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 sm:px-6 pt-3 pb-3 border-b border-border">
          <div className="sm:hidden mx-auto mb-2 h-1.5 w-10 rounded-full bg-border" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold">{title}</h2>
              {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              data-tour="cancelar"
              onClick={onClose}
              className="w-10 h-10 -mr-2 shrink-0 rounded-full flex items-center justify-center text-muted hover:bg-surface"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-5 sm:px-6 py-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

/** Formulario dentro de un modal: maneja estado de guardado y muestra el error del servidor. */
export function ModalForm({
  onSubmit,
  onCancel,
  submitLabel,
  children,
  danger,
}: {
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit();
    } catch (err) {
      setError((err as Error).message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {children}
      {error && (
        <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}
      {/* Botones siempre visibles abajo, también con el teclado del celular abierto */}
      <div className="sticky bottom-0 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 bg-white/95 backdrop-blur border-t border-border grid grid-cols-[auto_1fr] sm:flex sm:justify-end gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button type="button" data-tour="cancelar" variant="secondary" className="min-h-[48px] px-5" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" data-tour="guardar" disabled={saving} className={cn("min-h-[48px]", danger && "bg-foreground")}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" | "solid" | "green" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap",
        tone === "muted" && "bg-surface text-muted border border-border",
        tone === "accent" && "bg-accent-light text-accent-dark",
        tone === "solid" && "bg-accent text-white",
        tone === "green" && "bg-green-50 text-green-700 border border-green-200"
      )}
    >
      {children}
    </span>
  );
}

export function Empty({ children, icon: Icon = Inbox }: { children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="p-8 flex flex-col items-center gap-2 text-center text-sm text-muted">
      <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      {children}
    </div>
  );
}

/** Marcador animado mientras llegan los datos (en vez de un texto "Cargando..."). */
export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando">
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-surface animate-pulse" />
        <div className="h-24 rounded-2xl bg-surface animate-pulse" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-surface animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

export function fecha(iso: string, withTime = true) {
  return new Date(iso).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
