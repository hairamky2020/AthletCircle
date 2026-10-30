"use client";

import Link from "next/link";
import { LocationPill } from "./location/LocationPill";
import { useMyRuns } from "@/lib/myRuns";

export function Header() {
  const { slugs } = useMyRuns();
  return (
    <header className="site-header">
      <div className="wrap flex h-16 items-center gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="athletcircle home">
          <span className="logo-mark" aria-hidden />
          <span className="text-[19px] font-black tracking-tight text-white">athletcircle</span>
        </Link>
        <nav className="hidden items-center gap-6 text-[15px] text-white/70 md:flex" aria-label="Main">
          <Link href="/#upcoming" className="hover:text-white">Runs</Link>
          <Link href="/#calendar" className="hover:text-white">Calendar</Link>
          <Link href="/#map" className="hover:text-white">Map</Link>
          <Link href="/add-a-run" className="hover:text-white">Add a run</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <span className="hidden sm:block"><LocationPill /></span>
          <Link href="/#my-runs" className="my-runs-btn">
            My runs<span className="my-runs-count">{slugs.length}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
