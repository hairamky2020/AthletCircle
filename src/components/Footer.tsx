import Link from "next/link";
import { topSports } from "@/data/sports";
import { launchCities, allCities } from "@/data/locations";
import { placeHref } from "@/data/locations";

export function Footer() {
  const sports = topSports().slice(0, 10);
  const cities = launchCities().concat(allCities().filter((c) => !c.launch).slice(0, 8));
  return (
    <footer className="mt-20 border-t border-ink-100 bg-ink-900 text-ink-200">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-extrabold text-white">Athlet<span className="text-brand-500">Circle</span></p>
          <p className="mt-2 text-sm text-ink-300">Discover sports. Find events. Explore nearby. Participate.</p>
          <p className="mt-4 text-xs text-ink-400">We list events from organisers across India and link to their official registration pages. We don&apos;t sell tickets.</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Sports</p>
          <ul className="grid grid-cols-2 gap-1.5 text-sm">
            {sports.map((s) => <li key={s.slug}><Link className="hover:text-white" href={`/sports/${s.slug}/`}>{s.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Cities</p>
          <ul className="grid grid-cols-2 gap-1.5 text-sm">
            {cities.map((c) => <li key={c.path}><Link className="hover:text-white" href={`${placeHref(c.path)}/`}>{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">AthletCircle</p>
          <ul className="space-y-1.5 text-sm">
            <li><Link className="hover:text-white" href="/list-your-event/">List your event</Link></li>
            <li><Link className="hover:text-white" href="/how-we-verify/">How we verify events</Link></li>
            <li><Link className="hover:text-white" href="/about/">About</Link></li>
            <li><Link className="hover:text-white" href="/privacy/">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-800">
        <p className="container-page py-4 text-xs text-ink-400">© {new Date().getFullYear()} AthletCircle · Map data © OpenStreetMap contributors</p>
      </div>
    </footer>
  );
}
