import { Bed, UtensilsCrossed, Users, Heart } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

const stats = [
  { icon: Bed, value: "48", label: "Habitaciones", sub: "Individual, doble, suite y compartida" },
  { icon: UtensilsCrossed, value: "3", label: "Comidas al día", sub: "Desayuno, almuerzo y cena caseros" },
  { icon: Users, value: "500+", label: "Huéspedes felices", sub: "Pensionados y visitantes" },
  { icon: Heart, value: "15+", label: "Años de experiencia", sub: "Atención personalizada" },
];

export function Stats() {
  return (
    <section className="section-deferred py-16 bg-white relative -mt-16 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 80}>
              <div className="group relative p-8 rounded-2xl bg-background border border-border hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center mb-4 group-hover:bg-accent transition-colors duration-300">
                  <s.icon className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                </div>
                <div className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-accent mb-1">
                  {s.value}
                </div>
                <div className="font-semibold text-foreground mb-1">{s.label}</div>
                <div className="text-sm text-muted">{s.sub}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
