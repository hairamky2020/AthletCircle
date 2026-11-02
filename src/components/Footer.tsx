import Link from "next/link";
import { SITE } from "@/lib/site";
import { LogoReversed } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-accent" />
      <div className="wrap grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <LogoReversed height={64} />
          <p className="mt-4 text-lg font-bold">Discover. Participate. Achieve.</p>
          <p className="muted text-sm">Every Sport. Every Athlete. One Circle.</p>
          <p className="muted mt-1 text-sm">Starting with running events in Hyderabad. More sports and cities soon.</p>
        </div>
        <nav aria-label="Explore"><h2>Explore</h2><ul className="grid gap-2 text-sm">
          <li><Link href="/#upcoming">Discover Events</Link></li><li><Link href="/#nearby">Events Near Me</Link></li><li><Link href="/cities">Cities</Link></li></ul></nav>
        <nav aria-label="Organizers"><h2>Organizers</h2><ul className="grid gap-2 text-sm">
          <li><Link href="/submit">Submit an Event</Link></li><li><Link href="/about">About Us</Link></li><li><a href={`mailto:${SITE.contactEmail}`}>Contact</a></li></ul></nav>
        <nav aria-label="Legal"><h2>Legal</h2><ul className="grid gap-2 text-sm">
          <li><Link href="/privacy">Privacy</Link></li><li><Link href="/terms">Terms</Link></li><li><Link href="/disclaimer">Disclaimer</Link></li></ul></nav>
      </div>
      <p className="wrap muted pb-8 text-xs">© AthletCircle. Maps © OpenStreetMap contributors. Distances are straight-line unless marked otherwise. Always confirm event details with the organizer.</p>
    </footer>
  );
}
