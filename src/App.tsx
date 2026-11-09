import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import HomePage from "@/pages/Home";

const AccesoPage = lazy(() => import("@/pages/Acceso"));
const PanelPage = lazy(() => import("@/pages/Panel"));
const MiCasaPage = lazy(() => import("@/pages/MiCasa"));

export default function App() {
  return (
    <BrowserRouter>
      <ScrollRestoration />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/acceso" element={<AccesoPage />} />
          <Route path="/panel/*" element={<PanelPage />} />
          <Route path="/admin" element={<Navigate to="/panel" replace />} />
          <Route path="/mi-casa/:token" element={<MiCasaPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
