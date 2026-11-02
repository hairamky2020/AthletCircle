import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default function Page() {
  return (
    <div className="wrap pt-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">Privacy policy</h1>
      <Prose>
        <p>We collect as little as we can. You can browse AthletCircle without an account.</p>
        <h2>What we store</h2>
        <ul><li>Runs you save to My runs and the area you pick stay in your own browser. We never receive them.</li><li>If you use your location, it is rounded to about 1 km and kept in your browser only.</li><li>Organizers who submit an event give us a name, email and the event details, used only to review the listing and email you about it.</li><li>We count anonymous page views and clicks (for example, how many people opened an event) without cookies, IP addresses or personal identifiers.</li></ul>
        <h2>Who we share with</h2>
        <p>Our providers process data for us only: Supabase (database), our email provider, our hosting provider, and OpenFreeMap for map tiles. We do not sell data.</p>
        <h2>Your rights</h2>
        <p>Under India’s Digital Personal Data Protection Act you can ask us to see, correct or delete your data. Email us and we will reply within 30 days.</p>
        <p className="text-sm text-ink-500">Draft, last updated November 2026. Questions: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
      </Prose>
    </div>
  );
}
