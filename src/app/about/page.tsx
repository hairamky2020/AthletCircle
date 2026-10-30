import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = { title: "About AthletCircle", description: "AthletCircle helps people across India discover sports events near them.", alternates: { canonical: "/about/" } };

export default function About() {
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs items={[{ name: "About" }]} />} title="About AthletCircle" intro="Discover sports. Find events. Explore nearby. Participate." />
      <Prose>
        <p>AthletCircle is a single place to discover sporting events across India: runs and marathons, cycling rides, triathlons, badminton, football and cricket tournaments, chess, martial arts and many more.</p>
        <p>Today, event information is scattered across organiser websites, ticketing platforms, posters and messaging groups. We bring it together on one map and calendar, show how far each event is from you, and send you to the organiser&apos;s official registration page.</p>
        <h2>What we are (and aren&apos;t)</h2>
        <ul>
          <li>We are a free discovery and information service for participants.</li>
          <li>We don&apos;t sell tickets or take registrations. You always register on the organiser&apos;s official site.</li>
          <li>We list events from any organiser and any registration platform.</li>
        </ul>
        <p>Organising something? <Link href="/list-your-event/">List your event free</Link>.</p>
      </Prose>
    </>
  );
}
