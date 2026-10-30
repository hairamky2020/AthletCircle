import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="wrap flex flex-col gap-4 py-8 text-sm text-ink-500 md:flex-row md:items-center md:justify-between">
        <p>athletcircle · running events in Hyderabad. More sports and cities later.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
          <Link href="/about" className="hover:text-ink-900">About</Link>
          <Link href="/add-a-run" className="hover:text-ink-900">Add a run</Link>
          <a href={`mailto:${SITE.contactEmail}`} className="hover:text-ink-900">{SITE.contactEmail}</a>
        </nav>
      </div>
      <p className="wrap pb-8 text-xs text-ink-400">Maps © OpenStreetMap contributors, tiles by OpenFreeMap. Always confirm dates and details with the organiser.</p>
    </footer>
  );
}
