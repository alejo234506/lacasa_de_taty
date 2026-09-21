import { Suspense } from "react";
import AccesoForm from "./AccesoForm";

export default function AccesoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-hero" />}>
      <AccesoForm />
    </Suspense>
  );
}
