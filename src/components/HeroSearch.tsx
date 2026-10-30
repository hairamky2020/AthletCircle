"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form role="search" className="flex w-full max-w-2xl items-center gap-2 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-ink-100"
      onSubmit={(e) => { e.preventDefault(); router.push(`/search/?q=${encodeURIComponent(q.trim())}`); }}>
      <span className="pl-2 text-xl" aria-hidden>🔎</span>
      <label htmlFor="hero-q" className="sr-only">Search events</label>
      <input id="hero-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sport, event, city or locality"
        className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-ink-900 outline-none placeholder:text-ink-400" />
      <button className="btn btn-primary">Search</button>
    </form>
  );
}
