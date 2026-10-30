import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LocationProvider } from "@/components/location/LocationProvider";
import { LocationPicker } from "@/components/location/LocationPicker";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Running events in Hyderabad · athletcircle", template: "%s · athletcircle" },
  description: "Upcoming runs, half marathons and ultras in Hyderabad, by month, on a calendar and on a map.",
  openGraph: { siteName: "athletcircle", type: "website", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#f7f5f0", width: "device-width", initialScale: 1 };

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
