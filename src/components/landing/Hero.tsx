import Image from "next/image";
import { ArrowDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WHATSAPP_URL, LOGO_SRC } from "@/lib/constants";

export function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen gradient-hero overflow-hidden flex items-center">
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
        <div className="hero-blur-orb absolute top-20 left-10 w-48 h-48 lg:w-72 lg:h-72 rounded-full bg-accent/30 blur-[60px] lg:blur-[80px] animate-float" />
        <div
          className="hero-blur-orb absolute bottom-20 right-10 w-56 h-56 lg:w-96 lg:h-96 rounded-full bg-amber-500/20 blur-[60px] lg:blur-[80px] animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <div className="hero-content">
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-white/90 text-sm mb-6">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="tracking-wide">Colombia · Hospedaje con alma</span>
          </div>

          <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-6xl lg:text-7xl font-bold text-gradient leading-[1.05] mb-6">
            Tu hogar
            <br />
            <span className="italic text-white/95">lejos de casa</span>
          </h1>

          <p className="text-lg text-white/70 max-w-lg leading-relaxed mb-8">
            48 habitaciones, comedor casero con desayuno, almuerzo y cena, pensión mensual y la calidez de Taty.
            Un lugar donde cada huésped se siente en familia.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto min-h-[48px]">Reserva tu cupo</Button>
            </a>
            <a href="#habitaciones" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto min-h-[48px]">Explorar habitaciones</Button>
            </a>
          </div>

          <p className="hero-tagline mt-10 text-sm tracking-[0.3em] uppercase text-white/40 font-light">
            Vive · Descubre · Disfruta
          </p>
        </div>

        <div className="hero-image relative hidden lg:block">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10">
            <Image
              src={LOGO_SRC}
              alt="Alojamiento Casa Taty"
              fill
              className="object-cover"
              priority
              sizes="560px"
              quality={75}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-5">
              <div className="text-xs tracking-widest uppercase text-muted mb-1">Desde</div>
              <div className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-accent">
                $95.000
                <span className="text-base font-normal text-muted"> / noche</span>
              </div>
            </div>
          </div>

          <div className="absolute -top-4 -right-4 glass rounded-2xl p-4 shadow-xl animate-float">
            <div className="text-2xl font-bold text-accent font-[family-name:var(--font-playfair)]">48</div>
            <div className="text-xs text-muted">Habitaciones</div>
          </div>

          <div
            className="absolute -bottom-4 -left-4 glass rounded-2xl p-4 shadow-xl animate-float"
            style={{ animationDelay: "1s" }}
          >
            <div className="text-2xl font-bold text-accent font-[family-name:var(--font-playfair)]">★ 4.9</div>
            <div className="text-xs text-muted">Valoración huéspedes</div>
          </div>
        </div>
      </div>

      <a
        href="#nosotros"
        className="hero-scroll absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors flex flex-col items-center gap-2"
      >
        <span className="text-xs tracking-widest uppercase">Descubre más</span>
        <ArrowDown className="w-5 h-5 animate-bounce" />
      </a>
    </section>
  );
}
