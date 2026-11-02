import Link from "next/link";
import { SITE } from "@/lib/site";
import { LogoMark } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="wrap flex flex-col gap-4 py-8 text-sm text-ink-500 md:flex-row md:items-center md:justify-between">
        <p className="flex items-center gap-2"><LogoMark size={20} className="text-brand-500" /> AthletCircle · every sport, every event near you. Starting with running in Hyderabad.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
          <Link href="/about" className="hover:text-ink-900">About</Link>
          <Link href="/submit" className="hover:text-ink-900">Submit an Event</Link>
          <Link href="/privacy" className="hover:text-ink-900">Privacy</Link>
          <Link href="/terms" className="hover:text-ink-900">Terms</Link>
          <Link href="/disclaimer" className="hover:text-ink-900">Disclaimer</Link>
          <a href={`mailto:${SITE.contactEmail}`} className="hover:text-ink-900">{SITE.contactEmail}</a>
        </nav>
      </div>
      <p className="wrap pb-8 text-xs text-ink-400">Maps © OpenStreetMap contributors, tiles by OpenFreeMap. Distances are straight-line unless marked otherwise. Always confirm dates and details with the organiser.</p>
    </footer>
  );
}
