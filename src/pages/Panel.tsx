import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { AdminApp } from "@/components/admin/AdminApp";

type Estado = "cargando" | "ok" | "fuera" | "sin-servidor";

/** Solo deja entrar al panel con sesión abierta; si no, manda a /acceso. */
export default function PanelPage() {
  const { pathname } = useLocation();
  const [estado, setEstado] = useState<Estado>("cargando");

  const verificar = useCallback(async (signal?: AbortSignal) => {
    setEstado("cargando");
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store", signal });
      if (r.ok) setEstado("ok");
      else if (r.status === 401) setEstado("fuera");
      else setEstado("sin-servidor");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setEstado("sin-servidor");
    }
  }, []);

  useEffect(() => {
    document.title = "Panel · Casa Taty";
    const ctrl = new AbortController();
    void verificar(ctrl.signal);
    return () => ctrl.abort();
  }, [verificar]);

  if (estado === "cargando") return <div className="min-h-screen bg-background" />;
  if (estado === "fuera") return <Navigate to={`/acceso?next=${encodeURIComponent(pathname)}`} replace />;
  if (estado === "sin-servidor") {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-6 sm:p-8 text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-2">Sin conexión con el servidor</h1>
          <p className="text-muted text-sm mb-5">
            No se pudo comprobar tu sesión. Revisa que el servidor esté encendido y tu internet funcione.
          </p>
          <button
            onClick={() => void verificar()}
            className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold min-h-[44px]"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }
  return <AdminApp />;
}
