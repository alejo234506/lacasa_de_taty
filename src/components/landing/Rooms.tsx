import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

const rooms = [
  {
    type: "Individual",
    price: "$95.000",
    desc: "Perfecta para viajeros solos. Cama individual, baño privado y escritorio.",
    features: ["Baño privado", "WiFi", "Ventilador", "Escritorio"],
    popular: false,
  },
  {
    type: "Doble",
    price: "$140.000",
    desc: "Ideal para parejas o amigos. Dos camas, espacio amplio y vista al jardín.",
    features: ["2 camas", "Baño privado", "WiFi", "Closet amplio"],
    popular: true,
  },
  {
    type: "Suite",
    price: "$170.000",
    desc: "Nuestra opción premium. Sala de estar, minibar y balcón privado.",
    features: ["Sala de estar", "Minibar", "Balcón", "TV"],
    popular: false,
  },
  {
    type: "Pensión mensual",
    price: "Desde $980.000",
    desc: "Contrato mensual con alimentación incluida. Ideal para estudiantes y profesionales.",
    features: ["Desayuno incluido", "Almuerzo incluido", "Cena incluida", "Contrato flexible"],
    popular: false,
  },
];

export function Rooms() {
  return (
    <section id="habitaciones" className="section-deferred py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <span className="text-xs tracking-[0.2em] uppercase text-accent font-semibold">
            Habitaciones
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl lg:text-5xl font-bold mt-3">
            Encuentra tu espacio ideal
          </h2>
          <p className="text-muted mt-4 max-w-2xl mx-auto">
            Desde una noche hasta meses completos, tenemos la opción perfecta para ti.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rooms.map((room, i) => (
            <FadeIn key={room.type} delay={i * 80}>
              <div
                className={`relative rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full flex flex-col ${
                  room.popular ? "ring-2 ring-accent" : "border border-border"
                }`}
              >
                {room.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Más popular
                  </div>
                )}
                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold mt-2">
                  {room.type}
                </h3>
                <div className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-accent my-3">
                  {room.price}
                  {!room.type.includes("Pensión") && (
                    <span className="text-sm font-normal text-muted"> / noche</span>
                  )}
                </div>
                <p className="text-sm text-muted mb-5 leading-relaxed">{room.desc}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {room.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#contacto">
                  <Button
                    variant={room.popular ? "primary" : "secondary"}
                    size="sm"
                    className="w-full"
                  >
                    Consultar
                  </Button>
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
