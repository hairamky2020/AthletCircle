import type { Metadata } from "next";
import { Suspense } from "react";
import { Explorer } from "@/components/events/Explorer";
import { upcoming } from "@/data/events";
import { sportOptions, cityOptions } from "@/lib/options";

export const metadata: Metadata = {
  title: "Sports events map of India",
  description: "Explore upcoming runs, rides, tournaments and competitions on an interactive map. Filter by sport, date and distance.",
  alternates: { canonical: "/map/" },
};

export default function MapPage() {
  return (
    <Suspense>
      <Explorer events={upcoming()} sports={sportOptions()} cities={cityOptions()} defaultView="map" title="Sports events map" />
    </Suspense>
  );
}
