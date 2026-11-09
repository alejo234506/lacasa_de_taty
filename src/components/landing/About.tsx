import Image from "@/components/ui/Image";
import { LOGO_SRC } from "@/lib/constants";
import { FadeIn } from "@/components/ui/FadeIn";

export function About() {
  return (
    <section id="nosotros" className="section-deferred py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src={LOGO_SRC}
                  alt="Casa Taty"
                  fill
                  className="object-cover"
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 560px"
                  quality={75}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 rounded-2xl bg-accent p-6 flex flex-col justify-end shadow-xl">
                <div className="font-[family-name:var(--font-playfair)] text-white text-2xl font-bold italic">
                  &ldquo;Como en casa&rdquo;
                </div>
                <div className="text-white/70 text-sm mt-1">— Taty M.</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={120}>
            <span className="text-xs tracking-[0.2em] uppercase text-accent font-semibold">
              Nuestra historia
            </span>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl lg:text-5xl font-bold mt-3 mb-6 leading-tight">
              Más que un alojamiento,
              <span className="text-accent italic"> una familia</span>
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              Casa Taty nació del sueño de ofrecer un espacio cálido y acogedor para quienes
              buscan un hogar temporal en Colombia. Con 48 habitaciones distribuidas en tres
              pisos, atendemos tanto a huéspedes por noche como a pensionados mensuales.
            </p>
            <p className="text-muted leading-relaxed mb-8">
              Nuestro comedor sirve desayuno, almuerzo y cena preparados con ingredientes frescos del
              mercado local. Cada plato lleva el cariño de la cocina colombiana tradicional.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {[
                { n: "3", t: "Pisos" },
                { n: "24/7", t: "Recepción" },
                { n: "100%", t: "Colombiano" },
                { n: "WiFi", t: "Gratis" },
              ].map((item) => (
                <div key={item.t} className="border-l-2 border-accent pl-4">
                  <div className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-accent">
                    {item.n}
                  </div>
                  <div className="text-sm text-muted">{item.t}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
