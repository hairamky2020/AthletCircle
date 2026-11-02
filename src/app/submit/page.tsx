import type { Metadata } from "next";
import { SubmitPortal } from "@/components/portal/SubmitPortal";

export const metadata: Metadata = { title: "Submit an event", description: "Organising an event? List it free on AthletCircle. Every listing is reviewed.", alternates: { canonical: "/submit" } };

export default function SubmitPage() {
  return (
    <div className="wrap pt-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Submit an event</h1>
      <p className="mb-8 mt-3 max-w-xl text-lg text-ink-600">It&apos;s free. Our team reviews every event before it goes live, and you&apos;ll get an email at each step.</p>
      <SubmitPortal />
    </div>
  );
}
