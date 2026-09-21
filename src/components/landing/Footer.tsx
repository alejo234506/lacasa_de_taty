import Link from "next/link";
import Image from "next/image";
import { PHONE_DISPLAY, PHONE_TEL, LOGO_SRC } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="gradient-hero text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={LOGO_SRC}
                  alt="Casa Taty"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  sizes="40px"
                  loading="lazy"
                />
              </div>
              <span className="font-[family-name:var(--font-playfair)] text-xl font-bold">
                Casa Taty
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Alojamiento con alma en Colombia. 48 habitaciones, comedor con desayuno, almuerzo y cena.
            </p>
            <a href={`tel:${PHONE_TEL}`} className="inline-block mt-4 text-lg font-semibold text-white hover:text-amber-200 transition-colors">
              {PHONE_DISPLAY}
            </a>
          </div>

          <div>
            <h4 className="font-semibold mb-4 tracking-wide">Enlaces</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="#inicio" className="hover:text-white transition-colors">Inicio</a></li>
              <li><a href="#habitaciones" className="hover:text-white transition-colors">Habitaciones</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
              <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 tracking-wide">Legal</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>NIT 900.845.221-4</li>
              <li>Alojamiento Casa Taty · Colombia</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Alojamiento Casa Taty. Todos los derechos reservados.
          </p>
          <div className="flex flex-col items-center sm:items-end gap-1">
            <p className="text-sm tracking-[0.3em] uppercase text-white/50">
              Vive · Descubre · Disfruta
            </p>
            <Link href="/acceso" className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
              Acceso personal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
