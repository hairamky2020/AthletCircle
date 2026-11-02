import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer", alternates: { canonical: "/disclaimer" } };

export default function Page() {
  return (
    <div className="wrap pt-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">Disclaimer</h1>
      <Prose>
        <p>Event details come from organizers and public announcements. We check every listing, but dates, venues, fees and prizes can change. Anything we have not confirmed is shown as Not Announced; we never guess.</p>
        <p>Always confirm details with the organizer before you register or travel. Map pins marked as an area show the centre of the locality, not the start line. Distances are straight-line unless marked otherwise.</p>
        <p>Taking part in sport carries risk. Check with a doctor if you are unsure about your fitness.</p>
        <p className="text-sm text-ink-500">Draft, last updated November 2026. Questions: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
      </Prose>
    </div>
  );
}
