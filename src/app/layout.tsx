import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Alojamiento Casa Taty | Vive · Descubre · Disfruta",
  description:
    "Alojamiento Casa Taty — hospedaje cálido en Colombia. 48 habitaciones, comedor, pensión mensual y atención personalizada.",
  keywords: ["alojamiento", "hotel", "pensión", "Colombia", "Casa Taty"],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{history.scrollRestoration="manual";var h=location.hash;if(h){var e=document.querySelector(h);if(e){e.scrollIntoView();return}}var k="casa_taty_scroll:"+location.pathname;var y=sessionStorage.getItem(k);if(y){var n=parseInt(y,10);if(!isNaN(n)&&n>0){window.scrollTo(0,n);document.documentElement.classList.add("no-entry-anim")}}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full antialiased">
        <ScrollRestoration />
        {children}
      </body>
    </html>
  );
}
