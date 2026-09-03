import type { Metadata } from "next";
import "./globals.css";
// Leaflet positions its tiles/panes via this stylesheet — without it, map
// tiles escape the map container and scatter across the page (mobile especially).
import "leaflet/dist/leaflet.css";
import { Navbar, Footer } from "@/components/layout/Navbar";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "GUCAIR — Global University Consortium of AI Readiness",
  description: "Assess, benchmark and improve AI readiness across five pillars.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
