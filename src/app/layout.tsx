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
  title: { default: "Running Events & Marathons in Hyderabad 2026–27 · AthletCircle", template: "%s · AthletCircle" },
  description: "Find running events and marathons in Hyderabad: 5K, 10K, half marathons, trail and ultra runs with dates, venues, fees and official registration links.",
  keywords: ["running events in Hyderabad", "marathons in Hyderabad", "half marathon Hyderabad", "10K run Hyderabad", "5K run Hyderabad", "Hyderabad runs 2026"],
  openGraph: { siteName: "AthletCircle", type: "website", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#FFFFFF", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={manrope.variable}>
      <body className="min-h-screen antialiased">
        <script dangerouslySetInnerHTML={{ __html: `if("serviceWorker"in navigator)navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister()});if(r.length&&window.caches)caches.keys().then(function(k){k.forEach(function(n){caches.delete(n)})})})` }} />
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
