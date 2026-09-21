import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { PHONE_DISPLAY, PHONE_TEL, WHATSAPP_URL } from "@/lib/constants";

export function Contact() {
  return (
    <section id="contacto" className="section-deferred py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <FadeIn>
            <span className="text-xs tracking-[0.2em] uppercase text-accent font-semibold">
              Contacto
            </span>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl lg:text-5xl font-bold mt-3 mb-6">
              Reserva tu estadía
            </h2>
            <p className="text-muted leading-relaxed mb-8">
              Escríbenos o llámanos para consultar disponibilidad. Taty y su equipo
              te atenderán con gusto desde las 6:00 a.m.
            </p>

            <div className="space-y-5">
              {[
                { icon: MapPin, label: "Ubicación", value: "Colombia · Alojamiento Casa Taty" },
                { icon: Phone, label: "Teléfono · Taty", value: PHONE_DISPLAY, href: `tel:${PHONE_TEL}` },
                { icon: Mail, label: "Correo", value: "reservas@casadetaty.com" },
                { icon: Clock, label: "Horario comedor", value: "Desayuno 6:30 – 9:00 · Almuerzo 11:30 – 14:00 · Cena 18:00 – 20:00" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-xs tracking-wider uppercase text-muted">{item.label}</div>
                    {"href" in item && item.href ? (
                      <a href={item.href} className="font-medium text-accent hover:underline text-lg">
                        {item.value}
                      </a>
                    ) : (
                      <div className="font-medium">{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-8">
              <Button size="lg">Escríbenos por WhatsApp</Button>
            </a>
          </FadeIn>

          <FadeIn delay={120}>
            <form className="bg-white rounded-2xl p-8 shadow-xl border border-border">
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-6">
                Envíanos un mensaje
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted block mb-1.5">Nombre completo</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted block mb-1.5">Correo electrónico</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted block mb-1.5">Tipo de estadía</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all">
                    <option>Por noche</option>
                    <option>Pensión mensual</option>
                    <option>Consulta general</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted block mb-1.5">Mensaje</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                    placeholder="Cuéntanos sobre tu estadía..."
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Enviar mensaje
                </Button>
              </div>
            </form>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
