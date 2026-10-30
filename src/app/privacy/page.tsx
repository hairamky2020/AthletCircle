import type { Metadata } from "next";
import { PageHero } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy", description: "How AthletCircle handles your location and data.", alternates: { canonical: "/privacy/" } };

export default function Privacy() {
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs items={[{ name: "Privacy" }]} />} title="Privacy" intro="Short version: your location stays on your device, and you don't need an account." />
      <Prose>
        <h2>Your location</h2>
        <ul>
          <li>We only ask for your current location when you tap “Use my location”, and your browser asks for permission first. You can always choose a city, locality or PIN code instead.</li>
          <li>Distances are calculated in your browser. We don&apos;t send your location to our servers and we never show it to anyone.</li>
          <li>Your chosen place is remembered in your browser (rounded to about 1 KM) so you don&apos;t have to set it again. Clear your browser data to remove it.</li>
          <li>To show road distance on an event page, your browser asks the OpenStreetMap routing service (OSRM) for a route from your location (rounded to about 100 m) to the venue.</li>
          <li>If you search for an address or landmark, that search text is sent to OpenStreetMap&apos;s Nominatim service.</li>
        </ul>
        <h2>Accounts and personal data</h2>
        <p>You don&apos;t need an account to use AthletCircle. If you submit an event, we use your name and contact details only to verify the event with you.</p>
        <h2>Contact</h2>
        <p>Questions or deletion requests: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
      </Prose>
    </>
  );
}
