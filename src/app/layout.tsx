import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LocationProvider } from "@/components/location/LocationProvider";
import { LocationPicker } from "@/components/location/LocationPicker";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "AthletCircle · Sports events near you in India", template: "%s · AthletCircle" },
  description: "Find running events, marathons, tournaments and sports competitions near you across India. See distance, dates and official registration links on one map and calendar.",
  openGraph: { siteName: "AthletCircle", type: "website", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#ff5a1f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
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
