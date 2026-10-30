import type { Metadata } from "next";
import { RunsPage } from "@/components/runs/RunsPage";

export const metadata: Metadata = { title: "Map of runs in Hyderabad", description: "See where upcoming runs in Hyderabad take place, and how far they are from you.", alternates: { canonical: "/map" } };

export default function MapPage() {
  return <RunsPage view="map" />;
}
