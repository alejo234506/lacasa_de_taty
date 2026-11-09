
import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  BedDouble,
  ChevronRight,
  DoorOpen,
  HandCoins,
  Lightbulb,
  LogOut,
  Receipt,
  Sparkles,
  UserPlus,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useAdminStore, type Intent } from "@/lib/store";
import { useTour, type TourId } from "./Tour";
import type { AdminView } from "@/lib/data";
import { cn } from "@/lib/utils";

type Tarea = { label: string; detalle: string; icon: React.ElementType; view: AdminView; intent?: Intent; tour: TourId };

/** Lo que se hace en el día, dicho en palabras simples. Cada tarea abre directo el lugar correcto. */
export const TAREAS: Tarea[] = [
  { label: "Me pagaron", detalle: "Registrar el pago de un pensionado", icon: HandCoins, view: "pensionados", intent: "ver-deben", tour: "me-pagaron" },
  { label: "Llegó un huésped", detalle: "Check-in en una habitación libre", icon: DoorOpen, view: "rack", intent: "checkin", tour: "llego-huesped" },
  { label: "Se va un huésped", detalle: "Check-out y factura", icon: LogOut, view: "rack", intent: "ver-huespedes", tour: "se-va-huesped" },
  { label: "Vendí comida", detalle: "Desayuno, almuerzo o cena", icon: UtensilsCrossed, view: "comedor", tour: "vendi-comida" },
  { label: "Anotar un gasto", detalle: "Compras, servicios, arreglos…", icon: Receipt, view: "caja", intent: "nuevo-gasto", tour: "anotar-gasto" },
  { label: "Revisar pagos avisados", detalle: "Confirmar transferencias que avisaron", icon: BadgeDollarSign, view: "pagos", tour: "pagos-avisados" },
  { label: "Nuevo pensionado", detalle: "Agregar a alguien que vive por mes", icon: UserPlus, view: "pensionados", intent: "nuevo-pensionado", tour: "nuevo-pensionado" },
  { label: "Nueva habitación", detalle: "Crear un cuarto con su tarifa", icon: BedDouble, view: "rack", intent: "nueva-habitacion", tour: "nueva-habitacion" },
];

/** Hoja "¿Qué quieres hacer?" con todas las tareas a un toque. */
export function QueHacer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const irA = useAdminStore((s) => s.irA);
  const iniciarGuia = useTour((s) => s.iniciar);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="no-print fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/45 anim-fade"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="anim-sheet w-full sm:max-w-md max-h-[90dvh] overflow-y-auto bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sm:hidden mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between px-1 mb-3">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">¿Qué quieres hacer?</h2>
            <p className="text-sm text-muted">Toca una opción y te guío paso a paso.</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:bg-surface">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {TAREAS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.label}
                onClick={() => {
                  irA(t.view, t.intent);
                  onClose();
                  iniciarGuia(t.tour);
                }}
                className="card w-full p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
              >
                <span className="w-11 h-11 rounded-2xl bg-accent-light text-accent flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold">{t.label}</span>
                  <span className="block text-xs text-muted">{t.detalle}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-muted shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Explicación corta de cada pantalla. Se puede cerrar; queda un enlace para volver a verla. */
const GUIAS: Partial<Record<AdminView, { titulo: string; pasos: string[] }>> = {
  rack: {
    titulo: "Cómo usar Cuartos",
    pasos: [
      "Toca una habitación para ver sus opciones: check-in, check-out, limpieza o editar.",
      "Libres = se pueden alquilar. Usa los filtros de arriba para encontrarlas rápido.",
      "Al hacer check-out se genera la factura con lo que debe el huésped.",
    ],
  },
  pensionados: {
    titulo: "Cómo usar Pensión",
    pasos: [
      "Cada mes toca «Cargar mes a todos» para sumar la mensualidad.",
      "Cuando alguien te pague, toca «Cobrar» en su tarjeta y escribe el monto.",
      "Toca el nombre para ver su historial, enviarle su link por WhatsApp o editar sus datos.",
    ],
  },
  pagos: {
    titulo: "Cómo usar Pagos",
    pasos: [
      "Arriba aparecen los pagos que los pensionados avisaron desde su link: revisa y aprueba.",
      "Abajo está el historial de facturas; toca una para verla o compartirla.",
    ],
  },
  caja: {
    titulo: "Cómo usar Gastos",
    pasos: [
      "Anota cada gasto con su concepto y monto; si salió de la caja menor, se descuenta solo.",
      "«Arqueo» es contar el dinero real de la caja; «Reponer» la vuelve a llenar hasta la base.",
      "En Inventario usa Entra / Sale / Contar para llevar los productos.",
    ],
  },
  comedor: {
    titulo: "Cómo usar Comida",
    pasos: [
      "Elige quién compra y cómo paga, y toca «Vender» en la comida.",
      "Si es un huésped, elige «Cargo a habitación» y se cobra en su check-out.",
    ],
  },
  cierre: {
    titulo: "Cómo usar Cierre",
    pasos: [
      "Aquí ves la ganancia del mes por área.",
      "Al terminar el mes, ciérralo para que nadie cambie los números.",
    ],
  },
};

export function Guia({ view }: { view: AdminView }) {
  const g = GUIAS[view];
  const key = `casa_taty_guia_${view}`;
  const [abierta, setAbierta] = useState(false);
  const guiaPasoAPaso = useTour((s) => s.tour);

  // La primera vez que se entra a una pantalla, la explicación sale sola en el centro.
  useEffect(() => {
    try {
      setAbierta(localStorage.getItem(key) !== "1");
    } catch {
      setAbierta(false);
    }
  }, [key]);

  useEffect(() => {
    if (!abierta) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!g) return null;
  function cerrar() {
    setAbierta(false);
    try {
      localStorage.setItem(key, "1");
    } catch {
      // sin almacenamiento: solo dura esta visita
    }
  }

  return (
    <>
      <button onClick={() => setAbierta(true)} className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent min-h-[32px]">
        <Lightbulb className="w-3.5 h-3.5" /> ¿Cómo funciona esta pantalla?
      </button>
      {/* No se muestra encima de una guía paso a paso que ya está corriendo */}
      {abierta && !guiaPasoAPaso && (
        <div
          className="no-print fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/55 anim-fade"
          onMouseDown={(e) => e.target === e.currentTarget && cerrar()}
          role="dialog"
          aria-label={g.titulo}
        >
          <div className="anim-sheet w-full max-w-md rounded-3xl bg-white shadow-2xl border-2 border-amber-300 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-6 h-6" />
                </span>
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight">{g.titulo}</h2>
              </div>
              <button onClick={cerrar} aria-label="Cerrar" className="w-9 h-9 -mt-1 -mr-2 rounded-full flex items-center justify-center text-muted hover:bg-surface shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="mt-5 space-y-3">
              {g.pasos.map((p, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-snug">
                  <span className="w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="pt-1">{p}</span>
                </li>
              ))}
            </ol>
            <button onClick={cerrar} className="mt-6 w-full min-h-[48px] rounded-xl bg-accent text-white font-semibold">
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Botón flotante que abre «¿Qué quieres hacer?». */
export function BotonQueHacer({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label="¿Qué quieres hacer?"
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-foreground text-white font-semibold text-sm pl-4 pr-5 h-12 shadow-xl active:scale-95 transition-transform",
        className
      )}
    >
      <Sparkles className="w-4 h-4 text-amber-300" /> ¿Qué hago?
    </button>
  );
}
