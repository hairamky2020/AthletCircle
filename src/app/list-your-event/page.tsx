import type { Metadata } from "next";
import { EventEditor } from "@/components/forms/EventEditor";
import { PageHero } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "List your sports event free",
  description: "Organising a run, ride, tournament or competition? List it free on AthletCircle. We verify details, map the venue and link to your registration page.",
  alternates: { canonical: "/list-your-event/" },
};

export default function ListYourEvent() {
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs items={[{ name: "List your event" }]} />} title="List your event free"
        intro="Tell us about your event. We check it against your official page, confirm the venue on the map and publish it with a link to your registration page. No fees, no ticketing." />
      <div className="container-page mt-8 max-w-3xl"><EventEditor mode="public" /></div>
    </>
  );
}
