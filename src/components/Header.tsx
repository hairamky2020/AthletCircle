import Link from "next/link";
import { LocationPill } from "./location/LocationPill";

const NAV = [
  { href: "/search/", label: "Events" },
  { href: "/map/", label: "Map" },
  { href: "/calendar/", label: "Calendar" },
  { href: "/sports/", label: "Sports" },
  { href: "/organisers/", label: "Organisers" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight" aria-label="AthletCircle home">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-white">◎</span>
          <span className="hidden text-lg sm:inline">Athlet<span className="text-brand-500">Circle</span></span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LocationPill />
          <Link href="/list-your-event/" className="btn btn-primary hidden !py-2 text-sm md:inline-flex">List your event</Link>
        </div>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-ink-100 px-3 py-1.5 lg:hidden" aria-label="Main mobile">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50">{n.label}</Link>
        ))}
        <Link href="/list-your-event/" className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-600">List your event</Link>
      </nav>
    </header>
  );
}
