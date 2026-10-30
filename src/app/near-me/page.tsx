import type { Metadata } from "next";
import { NearMe } from "@/components/events/NearMe";
import { upcoming, countBy } from "@/data/events";
import { topSports } from "@/data/sports";

export const metadata: Metadata = {
  title: "Sports events near me",
  description: "See sports events near your location: runs, cycling rides, badminton, football and cricket tournaments within 5 to 200 KM.",
  alternates: { canonical: "/near-me/" },
};

export default function NearMePage() {
  const events = upcoming();
  const counts = countBy(events, (e) => e.rootSport);
  const sports = topSports().filter((s) => counts.get(s.slug)).sort((a, b) => counts.get(b.slug)! - counts.get(a.slug)!).slice(0, 10);
  return (
    <div className="pb-6">
      <div className="container-page pt-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Sports events near me</h1>
        <p className="mt-2 max-w-2xl text-ink-600">Pick a radius from 5 to 200 KM. Distances are straight-line from your chosen location; open an event to see road distance and travel time where available.</p>
      </div>
      <NearMe events={events} sports={sports.map(({ slug, name, icon }) => ({ slug, name, icon }))} limit={30} />
    </div>
  );
}
