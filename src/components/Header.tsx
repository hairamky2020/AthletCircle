"use client";

import Link from "next/link";
import { useState } from "react";
import { LocationPill } from "./location/LocationPill";
import { LogoMark } from "./Logo";
import { useMyRuns } from "@/lib/myRuns";
import { SCOPE, listingHref } from "@/data/events";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/#upcoming", label: "Discover Events" },
  { href: listingHref(), label: SCOPE.sportName },
  { href: "/#map", label: "Events Near Me" },
  { href: "/cities", label: "Cities" },
  { href: "/submit", label: "Submit an Event" },
  { href: "/about", label: "About Us" },
];

export function Header() {
  const { slugs } = useMyRuns();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="wrap flex h-16 items-center gap-5">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="AthletCircle home">
          <LogoMark className="text-brand-500" />
          <span className="logo-text text-[20px] font-black text-white">Athlet<span className="text-brand-500">Circle</span></span>
        </Link>
        <nav className="hidden items-center gap-5 text-[14px] text-white/70 xl:flex" aria-label="Main">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="whitespace-nowrap hover:text-white">{n.label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <label className="hidden items-center gap-1 text-sm sm:flex">
            <span className="sr-only">City</span>
            <select aria-label="City" className="city-select" defaultValue={SCOPE.city}>
              <option value={SCOPE.city}>{SCOPE.cityName}</option>
              <option disabled>More cities soon</option>
            </select>
          </label>
          <span className="hidden md:block"><LocationPill /></span>
          <Link href="/#my-runs" className="my-runs-btn">
            My runs<span className="my-runs-count">{slugs.length}</span>
          </Link>
          <button className="menu-btn xl:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="wrap grid gap-1 pb-4 xl:hidden" aria-label="Mobile">
          {NAV.map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-medium hover:bg-ink-50">{n.label}</Link>)}
        </nav>
      )}
    </header>
  );
}
