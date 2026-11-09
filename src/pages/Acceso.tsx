
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Image from "@/components/ui/Image";
import Link from "@/components/ui/Link";
import { Lock, ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LOGO_SRC } from "@/lib/constants";

const EMAIL_KEY = "casa_taty_email";
const IS_DEV = import.meta.env.DEV;

export default function AccesoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/panel";

  const [email, setEmail] = useState("taty@casadetaty.com");
  const [password, setPassword] = useState(IS_DEV ? "casa2026" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Acceso · Casa Taty";
    // Si ya hay sesión abierta, entra directo al panel.
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => {
        if (r.ok) navigate("/panel", { replace: true });
      })
      .catch(() => {});
    try {
      const saved = localStorage.getItem(EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch {
      // almacenamiento no disponible
    }
    // Prepara la base de datos en segundo plano (tablas y usuario inicial).
    fetch("/api/seed", { method: "POST" }).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "No se pudo ingresar");
        setLoading(false);
        return;
      }

      try {
        if (recordar) localStorage.setItem(EMAIL_KEY, email.trim());
        else localStorage.removeItem(EMAIL_KEY);
      } catch {
        // almacenamiento no disponible
      }
      navigate(next, { replace: true });
    } catch {
      setError("Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.");
      setLoading(false);
    }
  }

  const input =
    "w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-white text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <div className="min-h-[100dvh] gradient-hero flex items-center justify-center px-4 py-8 sm:p-6">
      <div className="w-full max-w-sm acceso-enter">
        <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 min-h-[44px]">
          <ArrowLeft className="w-4 h-4" />
          Volver al sitio
        </Link>

        <div className="glass rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-accent/20 mb-3">
              <Image src={LOGO_SRC} alt="Casa Taty" fill className="object-cover" sizes="80px" priority />
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">Bienvenida</h1>
            <p className="text-sm text-muted mt-1 text-center">Ingresa para administrar Casa Taty</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-muted block mb-1.5">Correo</span>
              <span className="relative block">
                <Mail className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={input}
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-muted block mb-1.5">Contraseña</span>
              <span className="relative block">
                <Lock className="w-5 h-5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${input} pr-12`}
                  placeholder="••••••••"
                  required
                  autoFocus={!IS_DEV}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-muted hover:text-accent rounded-lg"
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} className="w-5 h-5 accent-[var(--accent)]" />
              Recordar mi correo en este dispositivo
            </label>

            {error && (
              <p role="alert" className="text-sm text-accent font-medium bg-accent-light px-4 py-3 rounded-xl">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full min-h-[52px]" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
