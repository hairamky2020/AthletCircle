import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return (
    <div className="wrap pt-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">About</h1>
      <Prose>
        <p>athletcircle lists upcoming running events in Hyderabad in one place: by month, on a calendar and on a map. We’re starting with running in Hyderabad and will add more sports and cities.</p>
        <h2>Where the listings come from</h2>
        <p>We only list runs we’ve seen announced. If something isn’t announced yet, such as the start time, distances or the registration link, we say so rather than guess. Always confirm with the organiser before you travel.</p>
        <h2>Map pins and distances</h2>
        <p>Until the exact venue is announced, a run’s pin marks its area (for example Gachibowli), not the start line. Distances are straight-line (“as the crow flies”), not road distance.</p>
        <h2>Your location</h2>
        <p>We only ask for your location when you tap to use it. It stays in your browser, rounded to about 1 KM, and is never sent to us or shown to anyone.</p>
        <h2>Contact</h2>
        <p>Corrections and new runs: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a></p>
      </Prose>
    </div>
  );
}
