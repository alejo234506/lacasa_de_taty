
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Buscador en forma de píldora con botón para limpiar. */
export function Buscador({
  value,
  onChange,
  placeholder = "Buscar",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        className="card w-full pl-10 pr-10 h-12 !rounded-full text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 [&::-webkit-search-cancel-button]:hidden"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </label>
  );
}

/** Fila deslizable de filtros; cada chip puede mostrar cuántos elementos tiene. */
export function Chips<K extends string>({
  opciones,
  value,
  onChange,
  className,
}: {
  opciones: { key: K; label: string; n?: number; icon?: React.ElementType }[];
  value: K;
  onChange: (k: K) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5", className)} role="tablist">
      {opciones.map((o) => {
        const on = o.key === value;
        const Icon = o.icon;
        return (
          <button key={o.key} role="tab" aria-selected={on} className="chip" data-on={on} onClick={() => onChange(o.key)}>
            {Icon && <Icon className="w-4 h-4" />}
            {o.label}
            {o.n !== undefined && (
              <span className={cn("min-w-[20px] h-5 px-1.5 rounded-full text-[11px] leading-5 text-center", on ? "bg-white/20" : "bg-surface text-muted")}>
                {o.n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
