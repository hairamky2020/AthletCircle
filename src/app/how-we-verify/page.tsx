import type { Metadata } from "next";
import { PageHero } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "How we verify events", description: "How AthletCircle checks every event before it appears: official sources, venue pins and regular re-checks.", alternates: { canonical: "/how-we-verify/" } };

export default function HowWeVerify() {
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs items={[{ name: "How we verify" }]} />} title="How we verify events" intro="Every event you see has been checked by a person against an official source." />
      <Prose>
        <h2>Before an event goes live</h2>
        <ul>
          <li><strong>Official source.</strong> We confirm the name, date, venue and registration link on the organiser&apos;s official page, a federation calendar or directly with the organiser. Every event lists its sources.</li>
          <li><strong>Venue pin.</strong> A team member places and checks the venue on the map. If we can&apos;t pin a venue accurately, the event isn&apos;t published, rather than showing it in the wrong place.</li>
          <li><strong>Registration link.</strong> We check that the link opens the organiser&apos;s official registration page.</li>
          <li><strong>No duplicates.</strong> We check for the same event listed twice.</li>
        </ul>
        <h2>After it goes live</h2>
        <ul>
          <li>Each event shows the date we last verified it.</li>
          <li>Cancelled and postponed events stay visible with a clear notice, so you aren&apos;t caught out.</li>
          <li>Anyone can report a correction from the event page.</li>
        </ul>
        <h2>Distances</h2>
        <p>Distances on cards are straight-line (“as the crow flies”) from the location you chose. On event pages we also show road distance and approximate car time when the free OpenStreetMap routing service returns a route; it does not include live traffic. We never estimate a road distance or travel time ourselves.</p>
        <h2>Demo events</h2>
        <p>While we prepare for launch, some listings are marked “Demo”. They are sample data used to preview the site and are not real events.</p>
      </Prose>
    </>
  );
}
