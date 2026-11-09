import { lazy, Suspense, useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";

const Stats = lazy(() => import("@/components/landing/Stats").then((m) => ({ default: m.Stats })));
const About = lazy(() => import("@/components/landing/About").then((m) => ({ default: m.About })));
const Rooms = lazy(() => import("@/components/landing/Rooms").then((m) => ({ default: m.Rooms })));
const Amenities = lazy(() => import("@/components/landing/Amenities").then((m) => ({ default: m.Amenities })));
const Testimonials = lazy(() => import("@/components/landing/Testimonials").then((m) => ({ default: m.Testimonials })));
const Contact = lazy(() => import("@/components/landing/Contact").then((m) => ({ default: m.Contact })));
const Footer = lazy(() => import("@/components/landing/Footer").then((m) => ({ default: m.Footer })));

export default function HomePage() {
  useEffect(() => {
    document.title = "Alojamiento Casa Taty | Vive · Descubre · Disfruta";
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={null}>
          <Stats />
          <About />
          <Rooms />
          <Amenities />
          <Testimonials />
          <Contact />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
