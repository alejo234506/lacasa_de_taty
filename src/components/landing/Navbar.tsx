
import { useState, useEffect, type MouseEvent } from "react";
import Link from "@/components/ui/Link";
import Image from "@/components/ui/Image";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PHONE_DISPLAY, PHONE_TEL, LOGO_SRC } from "@/lib/constants";
import { scrollToSection } from "@/components/ScrollRestoration";

const links = [
  { href: "#inicio", label: "Inicio" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#habitaciones", label: "Habitaciones" },
  { href: "#servicios", label: "Servicios" },
  { href: "#contacto", label: "Contacto" },
];

function NavAnchor({
  href,
  className,
  children,
  onNavigate,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (href.startsWith("#")) {
      e.preventDefault();
      scrollToSection(href);
      onNavigate?.();
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background,padding,box-shadow] duration-500 nav-enter ${
        scrolled ? "glass-dark py-3 shadow-2xl" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/#inicio" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-accent/60 transition-all">
            <Image
              src={LOGO_SRC}
              alt="Casa Taty"
              width={48}
              height={48}
              className="object-cover w-full h-full"
              sizes="48px"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <div className="font-[family-name:var(--font-playfair)] font-bold text-white text-lg leading-tight">
              Casa Taty
            </div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-white/60">
              Alojamiento
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <NavAnchor
              key={l.href}
              href={l.href}
              className="text-sm text-white/80 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-accent after:transition-all hover:after:w-full"
            >
              {l.label}
            </NavAnchor>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <a
            href={`tel:${PHONE_TEL}`}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors font-semibold text-sm"
          >
            <Phone className="w-4 h-4 text-amber-300" />
            <span className="hidden xl:inline">{PHONE_DISPLAY}</span>
            <span className="xl:hidden">Llamar</span>
          </a>
          <NavAnchor href="#contacto">
            <Button size="sm">Reservar ahora</Button>
          </NavAnchor>
        </div>

        <button
          className="lg:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div
        className={`lg:hidden glass-dark border-t border-white/10 overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <NavAnchor
              key={l.href}
              href={l.href}
              onNavigate={() => setOpen(false)}
              className="text-white/90 py-2"
            >
              {l.label}
            </NavAnchor>
          ))}
          <a
            href={`tel:${PHONE_TEL}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-white font-semibold py-2"
          >
            <Phone className="w-4 h-4" /> {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </header>
  );
}
