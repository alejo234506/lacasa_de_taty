import {
  Wifi,
  Coffee,
  Shield,
  Clock,
  Sparkles,
  Car,
  Shirt,
  Phone,
} from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

const services = [
  { icon: Coffee, title: "Comedor casero", desc: "Desayuno, almuerzo y cena con recetas tradicionales colombianas." },
  { icon: Wifi, title: "WiFi de alta velocidad", desc: "Conexión gratuita en todas las habitaciones y áreas comunes." },
  { icon: Shield, title: "Seguridad 24/7", desc: "Recepción activa las 24 horas con control de acceso." },
  { icon: Clock, title: "Check-in flexible", desc: "Llegada desde las 6:00 a.m. sin complicaciones." },
  { icon: Sparkles, title: "Limpieza diaria", desc: "Servicio de aseo y cambio de ropa de cama." },
  { icon: Car, title: "Parqueadero", desc: "Espacio seguro para vehículos de huéspedes." },
  { icon: Shirt, title: "Lavandería", desc: "Servicio de lavado disponible bajo solicitud." },
  { icon: Phone, title: "Atención personalizada", desc: "Taty y su equipo siempre disponibles para ayudarte." },
];

export function Amenities() {
  return (
    <section id="servicios" className="section-deferred py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn className="text-center mb-16">
          <span className="text-xs tracking-[0.2em] uppercase text-accent font-semibold">
            Servicios
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl lg:text-5xl font-bold mt-3">
            Todo lo que necesitas
          </h2>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <FadeIn key={s.title} delay={i * 50}>
              <div className="group p-6 rounded-2xl border border-border hover:border-accent/40 bg-white hover:shadow-lg transition-all duration-300 h-full">
                <div className="w-11 h-11 rounded-xl bg-accent-light flex items-center justify-center mb-4 group-hover:bg-accent transition-colors duration-300">
                  <s.icon className="w-5 h-5 text-accent group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
