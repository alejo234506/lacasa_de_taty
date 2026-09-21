import { Quote } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

const testimonials = [
  {
    name: "Ana Lucía Rojas",
    role: "Pensionada · Medicina",
    text: "Llevo seis meses aquí y me siento en casa. La comida es deliciosa y Taty siempre está pendiente de nosotros.",
    rating: 5,
  },
  {
    name: "Emma Whitfield",
    role: "Huésped internacional",
    text: "The warmth and hospitality here is unmatched. Clean rooms, amazing food, and Taty makes everyone feel welcome.",
    rating: 5,
  },
  {
    name: "Miguel Ospina",
    role: "Pensionado · Regular",
    text: "El mejor alojamiento por precio en la zona. El comedor es como comer en la casa de la abuela. 100% recomendado.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="section-deferred py-24 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden>
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, var(--accent) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <FadeIn className="text-center mb-16">
          <span className="text-xs tracking-[0.2em] uppercase text-accent font-semibold">
            Testimonios
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl lg:text-5xl font-bold mt-3">
            Lo que dicen nuestros huéspedes
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 100}>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-border h-full">
                <Quote className="w-10 h-10 text-accent/20 absolute top-6 right-6" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <span key={j} className="text-amber-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-muted leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-muted">{t.role}</div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
