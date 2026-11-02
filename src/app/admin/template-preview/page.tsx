import type { Metadata } from "next";
import { eventSchema } from "@/data/schema";
import { RUNS } from "@/data/events";
import { EventDetails } from "@/components/event/EventDetails";

// Layout preview for admins: shows every section filled in, using obviously fictional sample data.
// Not linked from the site and not indexed. Real events only ever show announced information.
export const metadata: Metadata = { title: "Event page template preview", robots: { index: false, follow: false } };

const sample = eventSchema.parse({
  slug: "sample-event-preview", title: "Sample Event (layout preview)", sport: "running", date: "2027-01-17", startTime: "05:30",
  area: "Sample area", venue: "Sample venue", kind: "half", distances: ["5K", "10K", "21.1K"],
  registrationUrl: "https://example.com/register", websiteUrl: "https://example.com", source: "Sample data for layout preview", added: "2026-11-02", updated: "2026-11-02",
  location: { lat: 17.4401, lng: 78.3489, precision: "area" }, provenance: "organizer",
  details: {
    reportingTime: "04:45", endTime: "10:00",
    overview: "This is sample text that shows where the organizer’s description appears. Every value on this page is fictional and only illustrates the layout.",
    categories: [
      { name: "5K Fun Run", distance: "5 km", fee: "₹ sample", startTime: "06:30", ageGroup: "8+" },
      { name: "10K", distance: "10 km", fee: "₹ sample", startTime: "06:00", cutoff: "1 h 30 min", ageGroup: "14+" },
      { name: "Half Marathon", distance: "21.1 km", fee: "₹ sample", startTime: "05:30", cutoff: "3 h 15 min", ageGroup: "18+" },
    ],
    prizes: [
      { category: "Half Marathon · Open", places: [{ place: "1st", award: "Sample award" }, { place: "2nd", award: "Sample award" }, { place: "3rd", award: "Sample award" }] },
      { category: "10K · Open", places: [{ place: "1st", award: "Sample award" }, { place: "2nd", award: "Sample award" }] },
    ],
    awards: ["Finisher medal", "E-certificate"],
    schedule: [{ time: "04:45", item: "Reporting and bag drop" }, { time: "05:30", item: "Half Marathon flag-off" }, { time: "06:00", item: "10K flag-off" }, { time: "06:30", item: "5K flag-off" }, { time: "09:00", item: "Prize ceremony" }],
    facilities: ["water", "medical", "timing", "bib", "tshirt", "medal", "photos", "parking", "baggage", "toilets"],
    eligibility: ["Sample eligibility line", "Another sample eligibility line"],
    rules: ["Sample rule", "Another sample rule"],
    organizer: { name: "Sample Organizer", email: "organizer@example.com", website: "https://example.com" },
    faqs: [{ q: "Sample organizer question?", a: "Sample answer from the organizer." }],
    sportFields: { terrain: "Road", timing: "Chip timed", route: "Sample route description", cutoff_time: "3 h 15 min" },
    verified: ["categories"],
    history: [{ date: "2026-11-02", change: "Sample: categories and fees added" }],
  },
});

export default function TemplatePreview() {
  return (
    <>
      <p className="bg-navy px-4 py-3 text-center text-sm font-bold text-white">Layout preview with fictional sample data. Not a real event. Real event pages only show announced information.</p>
      <EventDetails run={sample} similarPool={RUNS} />
    </>
  );
}
