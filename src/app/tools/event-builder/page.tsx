import type { Metadata } from "next";
import { EventEditor } from "@/components/forms/EventEditor";
import { PageHero } from "@/components/LandingEvents";

export const metadata: Metadata = { title: "Event entry helper", robots: { index: false, follow: false } };

export default function EventBuilder() {
  return (
    <>
      <PageHero title="Event entry helper (team)" intro={<>Fill in a verified event, place and confirm the venue pin, then copy the JSON into <code className="rounded bg-ink-100 px-1">content/events.json</code>. The site rebuilds and the event goes live. Nothing on this page is saved anywhere.</>} />
      <div className="container-page mt-8 max-w-3xl"><EventEditor mode="builder" /></div>
    </>
  );
}
