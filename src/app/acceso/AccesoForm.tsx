"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LOGO_SRC } from "@/lib/constants";

export default function AccesoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/panel";

  const [email, setEmail] = useState("taty@casadetaty.com");
  const [password, setPassword] = useState("casa2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initMsg, setInitMsg] = useState("Preparando base de datos...");

  useEffect(() => {
    fetch("/api/seed", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setInitMsg("");
        else setInitMsg("Aviso: " + (d.error || "No se pudo inicializar"));
      })
      .catch(() => setInitMsg(""));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Error al ingresar");
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md acceso-enter">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al sitio
        </Link>

        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-accent/20 mb-4">
              <Image src={LOGO_SRC} alt="Casa Taty" fill className="object-cover" sizes="80px" />
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
              Acceso personal
            </h1>
            <p className="text-sm text-muted mt-1 text-center">
              Solo para el equipo que administra Casa Taty
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted block mb-1.5">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="taty@casadetaty.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted block mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="••••••••"
                required
              />
            </div>

            {initMsg && (
              <p className="text-xs text-muted text-center animate-pulse">{initMsg}</p>
            )}

            {error && (
              <p className="text-sm text-accent font-medium bg-accent-light px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              <Lock className="w-4 h-4" />
              {loading ? "Ingresando..." : "Ingresar al panel"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
