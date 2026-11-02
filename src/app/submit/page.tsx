import type { Metadata } from "next";
import { SubmitPortal } from "@/components/portal/SubmitPortal";
import { PORTAL_ON, submitMail } from "@/lib/live";

export const metadata: Metadata = { title: "Submit an event", description: "Organising an event? List it free on AthletCircle. Every listing is reviewed.", alternates: { canonical: "/submit" } };

export default function SubmitPage() {
  return (
    <div className="wrap pt-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Submit an event</h1>
      <p className="mb-8 mt-3 max-w-xl text-lg text-ink-600">It&apos;s free. Our team reviews every event before it goes live, and you&apos;ll get an email at each step.</p>
      {PORTAL_ON ? <SubmitPortal /> : (
        <div className="card max-w-xl">
          <p className="font-bold text-navy">Send us your event by email</p>
          <p className="mt-2 text-text-2">Our online organizer portal opens soon. Until then, email the event name, date, venue, categories and fees, registration link and your contact details. We review every event before it goes live.</p>
          <a href={submitMail} className="btn-primary mt-4">Email your event</a>
        </div>
      )}
    </div>
  );
}
