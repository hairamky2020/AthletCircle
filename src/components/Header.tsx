"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoFull, LogoIcon } from "./Logo";
import { SportIcon, SPORT_LIST } from "./SportIcon";
import { sportColour } from "@/lib/brand";
import { useMyRuns } from "@/lib/myRuns";
import { SCOPE, listingHref } from "@/data/events";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/#upcoming", label: "Discover Events" },
  { href: listingHref(), label: SCOPE.sportName },
  { href: "/#nearby", label: "Events Near Me" },
  { href: "/cities", label: "Cities" },
  { href: "/about", label: "About Us" },
];

export function Header() {
  const { slugs } = useMyRuns();
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="wrap flex h-[68px] items-center gap-6">
        <Link href="/" className="shrink-0" aria-label="AthletCircle home">
          <span className="hidden items-center gap-3 sm:flex"><LogoFull height={38} /><span className="tagline hidden 2xl:inline">Discover. Participate. Achieve.</span></span>
          <span className="sm:hidden"><LogoIcon size={38} /></span>
        </Link>
        <nav className="site-nav hidden items-center gap-5 xl:flex" aria-label="Main">
          {NAV.map((n) => <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined} className="whitespace-nowrap">{n.label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <select aria-label="City" className="city-select hidden md:block" defaultValue={SCOPE.city}>
            <option value={SCOPE.city}>{SCOPE.cityName}</option>
            <option disabled>More cities soon</option>
          </select>
          <Link href="/#my-runs" className="saved-btn" aria-label={`Saved events: ${slugs.length}`}>
            <span aria-hidden>♡</span><span className="hidden sm:inline">Saved</span><span className="my-runs-count">{slugs.length}</span>
          </Link>
          <Link href="/submit" className="btn-primary hidden whitespace-nowrap md:inline-flex">Submit an Event</Link>
          <button className="menu-btn xl:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
      <SportBar />
      {open && (
        <nav id="mobile-nav" className="site-nav wrap grid gap-1 border-t border-line pb-4 pt-2 xl:hidden" aria-label="Mobile">
          {[...NAV, { href: "/submit", label: "Submit an Event" }].map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3">{n.label}</Link>)}
        </nav>
      )}
    </header>
  );
}

/** One-line sports bar under the menu. Only live sports are links; the rest say "Soon". */
function SportBar() {
  return (
    <nav className="sport-bar" aria-label="Sports">
      <ul className="wrap">
        {SPORT_LIST.map((s) => {
          const live = s.slug === SCOPE.sport;
          const inner = <><span className="sb-ic"><SportIcon sport={s.slug} /></span>{s.name}{!live && <span className="sr-only"> (coming soon)</span>}</>;
          return (
            <li key={s.slug} style={{ "--sport": sportColour(s.slug) } as React.CSSProperties}>
              {live ? <Link href={listingHref()} className="sb-item is-live">{inner}</Link> : <span className="sb-item is-soon" aria-disabled="true">{inner}</span>}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
