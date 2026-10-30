import Link from "next/link";
import { LocationPill } from "./location/LocationPill";

const NAV = [
  { href: "/", label: "Runs" },
  { href: "/calendar", label: "Calendar" },
  { href: "/map", label: "Map" },
  { href: "/add-a-run", label: "Add a run" },
];

export function Header() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="wrap flex h-14 items-center gap-6">
        <Link href="/" className="flex shrink-0 items-baseline gap-2" aria-label="AthletCircle home">
          <span className="text-[19px] font-bold tracking-tight">athletcircle</span>
          <span className="eyebrow hidden sm:inline">Hyderabad</span>
        </Link>
        <nav className="hidden items-center gap-5 text-[15px] md:flex" aria-label="Main">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="text-ink-700 hover:text-ink-900">{n.label}</Link>)}
        </nav>
        <div className="ml-auto"><LocationPill /></div>
      </div>
      <nav className="no-scrollbar wrap flex gap-5 overflow-x-auto pb-3 text-[15px] md:hidden" aria-label="Main mobile">
        {NAV.map((n) => <Link key={n.href} href={n.href} className="shrink-0 whitespace-nowrap text-ink-700">{n.label}</Link>)}
      </nav>
    </header>
  );
}
