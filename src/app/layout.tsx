import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LocationProvider } from "@/components/location/LocationProvider";
import { LocationPicker } from "@/components/location/LocationPicker";
import { SITE } from "@/lib/site";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "AthletCircle · Discover. Participate. Achieve.", template: "%s · AthletCircle" },
  description: "Discover sporting events, explore opportunities near you and connect with the sporting community. Discover. Participate. Achieve.",
  openGraph: { siteName: "AthletCircle", type: "website", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#FFFFFF", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={manrope.variable}>
      <body className="min-h-screen antialiased">
        <LocationProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <LocationPicker />
        </LocationProvider>
      </body>
    </html>
  );
}
