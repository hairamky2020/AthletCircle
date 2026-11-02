import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of use", alternates: { canonical: "/terms" } };

export default function Page() {
  return (
    <div className="wrap pt-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">Terms of use</h1>
      <Prose>
        <p>By using AthletCircle you agree to these terms.</p>
        <h2>Listings</h2>
        <p>AthletCircle is a discovery site. We do not organise events, sell tickets or take payments. Registration happens on the organizer’s own site, under their terms.</p>
        <h2>Submitting an event</h2>
        <p>Organizers must submit accurate information and only posters or images they have the right to use. We may edit, decline or remove any listing.</p>
        <h2>Acceptable use</h2>
        <p>Do not misuse the site, scrape it at scale, or submit spam or misleading events.</p>
        <h2>Liability</h2>
        <p>The site is provided as is. To the extent the law allows, we are not liable for losses from relying on a listing.</p>
        <p className="text-sm text-ink-500">Draft, last updated November 2026. Questions: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
      </Prose>
    </div>
  );
}
