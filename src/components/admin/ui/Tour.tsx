import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { create } from "zustand";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Guía paso a paso: un letrero en el centro de la pantalla que dice qué hacer,
 * oscurece el resto y señala con una flecha el botón o campo que hay que usar.
 *
 * Los elementos se marcan en las pantallas con `data-tour="nombre"`.
 */

export type TourId =
  | "me-pagaron"
  | "llego-huesped"
  | "se-va-huesped"
  | "vendi-comida"
  | "anotar-gasto"
  | "pagos-avisados"
  | "nuevo-pensionado"
  | "nueva-habitacion";

type Paso = {
  titulo: string;
  texto: string;
  /** Elemento que se resalta (valor de data-tour). Sin él, el letrero va solo en el centro. */
  target?: string;
  /** Pasa solo al siguiente paso cuando la persona toca el elemento resaltado (o `clickEn`). */
  alTocar?: boolean;
  /** Selector CSS alternativo para detectar el toque (por ejemplo, cualquiera de varios botones). */
  clickEn?: string;
  /** Pasa solo al siguiente paso cuando este elemento desaparece (por ejemplo, se cerró el formulario al guardar). */
  hastaQueSeCierre?: string;
  /** Qué decir si el elemento no está en pantalla. */
  siNoEsta?: string;
};

const sel = (t: string) => `[data-tour="${t}"]`;

const GUIAS: Record<TourId, { nombre: string; pasos: Paso[]; listo: string }> = {
  "me-pagaron": {
    nombre: "Registrar un pago",
    listo: "El pago quedó registrado, se generó la factura y el saldo de la persona ya está actualizado.",
    pasos: [
      {
        titulo: "Busca a la persona",
        texto: "Te muestro solo a los pensionados que deben. Toca «Cobrar» al lado de la persona que te pagó.",
        target: "cobrar",
        alTocar: true,
        siNoEsta:
          "Ahora nadie debe. Si alguien pagó por adelantado, toca el filtro «Todos» y luego «Cobrar» en su tarjeta.",
      },
      {
        titulo: "Escribe el pago",
        texto: "Escribe cuánto te pagó y elige cómo pagó: efectivo, Nequi, transferencia…",
        target: "modal-form",
      },
      {
        titulo: "Guarda",
        texto: "Toca este botón para guardar. El sistema hace la factura solo.",
        target: "guardar",
        hastaQueSeCierre: "modal-form",
      },
    ],
  },
  "llego-huesped": {
    nombre: "Check-in de un huésped",
    listo: "El huésped quedó registrado en la habitación. Cuando se vaya, usa «Se va un huésped».",
    pasos: [
      {
        titulo: "Elige la habitación",
        texto: "Estas son las habitaciones libres. Toca la que le vas a dar al huésped.",
        target: "room-libre",
        alTocar: true,
        siNoEsta: "No hay habitaciones libres en este momento. Revisa si alguna está sucia o en mantenimiento.",
      },
      {
        titulo: "Toca «Check-in»",
        texto: "Ahora toca el botón «Check-in» de esa habitación.",
        target: "btn-checkin",
        alTocar: true,
      },
      {
        titulo: "Datos del huésped",
        texto: "Escribe el nombre del huésped, cuántas personas son y el valor. Revisa que todo esté bien.",
        target: "modal-form",
      },
      {
        titulo: "Confirma",
        texto: "Toca este botón para registrar la entrada.",
        target: "guardar",
        hastaQueSeCierre: "modal-form",
      },
    ],
  },
  "se-va-huesped": {
    nombre: "Check-out y factura",
    listo: "El huésped salió, se generó la factura y la habitación quedó para limpieza.",
    pasos: [
      {
        titulo: "Elige la habitación",
        texto: "Estas son las habitaciones con huésped. Toca la del huésped que se va.",
        target: "room-huesped",
        alTocar: true,
        siNoEsta: "No hay huéspedes en este momento.",
      },
      {
        titulo: "Toca «Check-out y facturar»",
        texto: "Toca este botón para cerrar la cuenta del huésped.",
        target: "btn-checkout",
        alTocar: true,
      },
      {
        titulo: "Revisa el cobro",
        texto: "Revisa el total (noches y consumos) y elige cómo pagó.",
        target: "modal-form",
      },
      {
        titulo: "Cobra y factura",
        texto: "Toca este botón para cobrar y generar la factura.",
        target: "guardar",
        hastaQueSeCierre: "modal-form",
      },
    ],
  },
  "vendi-comida": {
    nombre: "Vender comida",
    listo: "La venta quedó anotada. Puedes vender otra comida cuando quieras.",
    pasos: [
      {
        titulo: "¿Quién compra?",
        texto: "Escribe el nombre de quien compra. Si no lo sabes, déjalo vacío.",
        target: "comedor-cliente",
      },
      {
        titulo: "¿Cómo pagó?",
        texto: "Elige cómo pagó. Si es un huésped y se lo cobras al salir, elige «Cargo a habitación».",
        target: "comedor-pago",
      },
      {
        titulo: "Toca «Vender»",
        texto: "Toca «Vender» debajo de la comida: desayuno, almuerzo o cena.",
        target: "comedor-comidas",
        alTocar: true,
        clickEn: 'button[aria-label^="Vender"]',
      },
    ],
  },
  "anotar-gasto": {
    nombre: "Anotar un gasto",
    listo: "El gasto quedó anotado. Si salió de la caja menor, ya se descontó.",
    pasos: [
      {
        titulo: "Escribe el gasto",
        texto: "Escribe qué compraste o pagaste, a qué área va, de dónde salió la plata y el monto.",
        target: "gasto-form",
      },
      {
        titulo: "Guarda el gasto",
        texto: "Toca «Agregar gasto» para guardarlo.",
        target: "gasto-guardar",
        alTocar: true,
      },
    ],
  },
  "pagos-avisados": {
    nombre: "Verificar pagos avisados",
    listo: "El pago quedó verificado y se generó la factura.",
    pasos: [
      {
        titulo: "Revisa el aviso",
        texto: "Mira en tu banco o Nequi si llegó la plata. Si llegó, toca «Verificar y facturar».",
        target: "pago-verificar",
        alTocar: true,
        siNoEsta: "No hay avisos de pago pendientes. Los pensionados avisan desde su link personal.",
      },
      {
        titulo: "Monto que llegó",
        texto: "Escribe el monto que realmente llegó a tu cuenta.",
        target: "modal-form",
      },
      {
        titulo: "Confirma",
        texto: "Toca este botón para confirmar y generar la factura.",
        target: "guardar",
        hastaQueSeCierre: "modal-form",
      },
    ],
  },
  "nuevo-pensionado": {
    nombre: "Agregar un pensionado",
    listo: "El pensionado quedó creado. Desde su tarjeta puedes enviarle su link por WhatsApp.",
    pasos: [
      {
        titulo: "Llena sus datos",
        texto: "Escribe el nombre, elige la habitación, el grupo de cobro, la tarifa mensual y si come aquí.",
        target: "modal-form",
      },
      {
        titulo: "Guarda",
        texto: "Toca este botón para crear al pensionado.",
        target: "guardar",
        hastaQueSeCierre: "modal-form",
      },
    ],
  },
  "nueva-habitacion": {
    nombre: "Crear una habitación",
    listo: "La habitación quedó creada y ya aparece en Cuartos.",
    pasos: [
      {
        titulo: "Datos de la habitación",
        texto: "Escribe el nombre o número, el tipo, cuántas personas caben, si se cobra por noche o por mes y la tarifa.",
        target: "modal-form",
      },
      {
        titulo: "Guarda",
        texto: "Toca «Crear habitación».",
        target: "guardar",
        hastaQueSeCierre: "modal-form",
      },
    ],
  },
};

type TourState = {
  tour: TourId | null;
  paso: number;
  iniciar: (t: TourId) => void;
  ir: (paso: number) => void;
  cerrar: () => void;
};

export const useTour = create<TourState>((set) => ({
  tour: null,
  paso: 0,
  iniciar: (tour) => set({ tour, paso: 0 }),
  ir: (paso) => set({ paso }),
  cerrar: () => set({ tour: null, paso: 0 }),
}));

/** Primer elemento visible que coincide (hay vistas que se repiten para celular y computador). */
function visible(selector: string): HTMLElement | null {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
  }
  return null;
}

type Caja = { top: number; left: number; width: number; height: number };
const OSCURO = "absolute";
const FONDO: React.CSSProperties = { background: "rgba(15, 6, 9, 0.72)" };
const MARGEN = 8;

export function Tour() {
  const { tour, paso, ir, cerrar } = useTour();
  const guia = tour ? GUIAS[tour] : null;
  const pasos = guia?.pasos ?? [];
  const actual: Paso | undefined = pasos[paso];
  const terminado = Boolean(guia) && paso >= pasos.length;

  const [caja, setCaja] = useState<Caja | null>(null);
  const [buscando, setBuscando] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState({ w: 360, h: 220 });
  const visto = useRef(false); // el elemento de "hastaQueSeCierre" llegó a aparecer

  const siguiente = useCallback(() => ir(paso + 1), [ir, paso]);

  // Al cambiar de paso: busca el elemento, lo acerca a la vista y lo sigue mientras se mueve.
  useEffect(() => {
    if (!actual) return;
    visto.current = false;
    setBuscando(true);
    setCaja(null);
    let desplazado = false;
    const inicio = Date.now();

    const tick = () => {
      if (actual.hastaQueSeCierre) {
        const abierto = visible(sel(actual.hastaQueSeCierre));
        if (abierto) visto.current = true;
        else if (visto.current) return siguiente();
      }
      const el = actual.target ? visible(sel(actual.target)) : null;
      if (el) {
        if (!desplazado) {
          desplazado = true;
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
        const r = el.getBoundingClientRect();
        setCaja({ top: r.top - MARGEN, left: r.left - MARGEN, width: r.width + MARGEN * 2, height: r.height + MARGEN * 2 });
        setBuscando(false);
      } else {
        setCaja(null);
        // Espera un poco a que la pantalla cargue antes de decir que no está.
        if (Date.now() - inicio > 1500) setBuscando(false);
      }
    };
    tick();
    const id = window.setInterval(tick, 200);
    window.addEventListener("resize", tick);
    window.addEventListener("scroll", tick, true);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", tick);
      window.removeEventListener("scroll", tick, true);
    };
  }, [actual, siguiente]);

  // Pasos que avanzan solos cuando la persona toca lo señalado.
  useEffect(() => {
    if (!actual?.alTocar) return;
    const selector = actual.clickEn ?? (actual.target ? sel(actual.target) : null);
    if (!selector) return;
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.(selector)) window.setTimeout(siguiente, 250);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [actual, siguiente]);

  // Si la persona cancela el formulario, la guía se cierra (no se hizo nada, no hay "¡Listo!").
  useEffect(() => {
    if (!tour) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t?.closest?.(sel("cancelar")) || t?.matches?.(sel("fondo-modal"))) cerrar();
    };
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [tour, cerrar]);

  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tour, cerrar]);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (Math.abs(r.width - cardSize.w) > 1 || Math.abs(r.height - cardSize.h) > 1) setCardSize({ w: r.width, h: r.height });
  });

  if (!guia) return null;

  // ---- Dónde va el letrero: en el centro, salvo que tape lo que hay que tocar ----
  const W = window.innerWidth;
  const H = window.innerHeight;
  const cw = cardSize.w;
  const ch = cardSize.h;
  let pos: React.CSSProperties = { top: Math.max(16, (H - ch) / 2), left: Math.max(16, (W - cw) / 2) };
  let flecha: "abajo" | "arriba" | null = null;

  if (caja && !terminado) {
    const centro = { top: (H - ch) / 2, left: (W - cw) / 2 };
    const tapa =
      centro.left < caja.left + caja.width &&
      centro.left + cw > caja.left &&
      centro.top < caja.top + caja.height + 56 &&
      centro.top + ch > caja.top - 56;
    if (tapa) {
      const arriba = caja.top;
      const abajo = H - (caja.top + caja.height);
      const izq = caja.left;
      const der = W - (caja.left + caja.width);
      if (abajo >= ch + 72) pos = { top: caja.top + caja.height + 64, left: centro.left };
      else if (arriba >= ch + 72) pos = { top: caja.top - ch - 64, left: centro.left };
      else if (der >= cw + 32) pos = { top: Math.max(16, centro.top), left: caja.left + caja.width + 16 };
      else if (izq >= cw + 32) pos = { top: Math.max(16, centro.top), left: caja.left - cw - 16 };
      else pos = { top: 16, left: centro.left }; // pantalla pequeña con formulario grande: arriba
    }
    flecha = caja.top > 70 ? "abajo" : "arriba";
  }

  const noEsta = actual && actual.target && !caja && !buscando;
  const esUltimo = paso === pasos.length - 1;
  const puedeSeguir = actual && !actual.alTocar && !actual.hastaQueSeCierre;

  return (
    <div className="no-print fixed inset-0 z-[140] pointer-events-none" role="dialog" aria-live="polite" aria-label={`Guía: ${guia.nombre}`}>
      {/* Oscurece todo menos lo que hay que tocar */}
      {caja && !terminado ? (
        <>
          {/* Cuatro paneles oscuros alrededor del hueco */}
          <div className={OSCURO} style={{ ...FONDO, top: 0, left: 0, right: 0, height: Math.max(0, caja.top) }} />
          <div className={OSCURO} style={{ ...FONDO, top: caja.top + caja.height, left: 0, right: 0, bottom: 0 }} />
          <div className={OSCURO} style={{ ...FONDO, top: caja.top, left: 0, width: Math.max(0, caja.left), height: caja.height }} />
          <div className={OSCURO} style={{ ...FONDO, top: caja.top, left: caja.left + caja.width, right: 0, height: caja.height }} />
          <div className="absolute rounded-2xl border-4 border-amber-300 tour-pulso" style={caja} />
        </>
      ) : (
        <div className="absolute inset-0 anim-fade" style={FONDO} />
      )}

      {/* Flecha que señala */}
      {caja && !terminado && flecha && (
        <div
          className="absolute flex justify-center text-amber-300 drop-shadow-lg animate-bounce"
          style={{
            left: caja.left,
            width: caja.width,
            top: flecha === "abajo" ? caja.top - 52 : caja.top + caja.height + 8,
          }}
        >
          {flecha === "abajo" ? <ArrowDown className="w-11 h-11" strokeWidth={3} /> : <ArrowUp className="w-11 h-11" strokeWidth={3} />}
        </div>
      )}

      {/* El letrero */}
      <div
        ref={cardRef}
        className="absolute pointer-events-auto w-[min(380px,calc(100vw-32px))] rounded-3xl bg-white shadow-2xl border-2 border-amber-300 p-5 anim-sheet transition-[top,left] duration-200"
        style={pos}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-accent">
            {guia.nombre}
            {!terminado && ` · Paso ${paso + 1} de ${pasos.length}`}
          </div>
          <button onClick={cerrar} aria-label="Cerrar guía" className="w-9 h-9 -mt-2 -mr-2 rounded-full flex items-center justify-center text-muted hover:bg-surface shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!terminado && (
          <div className="flex gap-1.5 mt-2" aria-hidden>
            {pasos.map((_, i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < paso ? "bg-green-500" : i === paso ? "bg-accent" : "bg-border")} />
            ))}
          </div>
        )}

        {terminado ? (
          <div className="mt-3 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mt-2">¡Listo!</h3>
            <p className="text-sm text-muted mt-1">{guia.listo}</p>
            <button onClick={cerrar} className="mt-4 w-full min-h-[48px] rounded-xl bg-accent text-white font-semibold">
              Entendido
            </button>
          </div>
        ) : (
          actual && (
            <>
              <div className="flex items-start gap-3 mt-3">
                <span className="w-9 h-9 rounded-full bg-accent text-white font-bold flex items-center justify-center shrink-0">{paso + 1}</span>
                <div className="min-w-0">
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight">{actual.titulo}</h3>
                  <p className="text-[15px] text-foreground/80 mt-1 leading-snug">{actual.texto}</p>
                </div>
              </div>

              {noEsta && (
                <div className="mt-3 flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  {actual.siNoEsta ?? "No encuentro este paso en la pantalla. Sigue con el siguiente o cierra la guía."}
                </div>
              )}

              {(actual.alTocar || actual.hastaQueSeCierre) && caja && (
                <p className="mt-3 text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> Toca lo que está señalado y sigo contigo.
                </p>
              )}

              <div className="mt-4 flex items-center gap-2">
                {paso > 0 && (
                  <button onClick={() => ir(paso - 1)} className="min-h-[44px] px-3 rounded-xl border border-border text-sm font-semibold flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>
                )}
                <button onClick={cerrar} className="min-h-[44px] px-3 rounded-xl text-sm text-muted">
                  Salir
                </button>
                {noEsta ? (
                  <button
                    onClick={cerrar}
                    className="ml-auto min-h-[44px] px-4 rounded-xl bg-accent text-white text-sm font-semibold"
                  >
                    Entendido
                  </button>
                ) : puedeSeguir && (
                  <button
                    onClick={siguiente}
                    className="ml-auto min-h-[44px] px-4 rounded-xl bg-accent text-white text-sm font-semibold flex items-center gap-1"
                  >
                    {esUltimo ? "Terminar" : "Siguiente"} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
