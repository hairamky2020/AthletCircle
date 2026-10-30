import type { Metadata } from "next";
import { CalendarView } from "@/components/calendar/CalendarView";
import { PUBLIC_SUMMARIES } from "@/data/events";
import { topSports } from "@/data/sports";
import { cityOptions } from "@/lib/options";
import { PageHero } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Sports calendar India",
  description: "Calendar of upcoming sports events in India by day, week and month. Filter by sport, city and distance; see registration deadlines.",
  alternates: { canonical: "/calendar/" },
};

export default function CalendarPage() {
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs items={[{ name: "Calendar" }]} />} title="Sports calendar" intro="Every listed event by day, week or month, with registration deadlines." />
      <div className="container-page mt-6">
        <CalendarView events={PUBLIC_SUMMARIES} sports={topSports().map(({ slug, name }) => ({ slug, name }))} cities={cityOptions()} />
      </div>
    </>
  );
}
