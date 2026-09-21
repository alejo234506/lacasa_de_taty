import nextDynamic from "next/dynamic";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";

const Stats = nextDynamic(() => import("@/components/landing/Stats").then((m) => m.Stats));
const About = nextDynamic(() => import("@/components/landing/About").then((m) => m.About));
const Rooms = nextDynamic(() => import("@/components/landing/Rooms").then((m) => m.Rooms));
const Amenities = nextDynamic(() => import("@/components/landing/Amenities").then((m) => m.Amenities));
const Testimonials = nextDynamic(() =>
  import("@/components/landing/Testimonials").then((m) => m.Testimonials)
);
const Contact = nextDynamic(() => import("@/components/landing/Contact").then((m) => m.Contact));
const Footer = nextDynamic(() => import("@/components/landing/Footer").then((m) => m.Footer));

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <About />
        <Rooms />
        <Amenities />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
