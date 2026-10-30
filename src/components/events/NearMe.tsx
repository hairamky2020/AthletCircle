"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EventSummary } from "@/lib/event-types";
import { searchEvents } from "@/lib/search";
import { RADIUS_OPTIONS_KM, DEFAULT_RADIUS_KM, nextRadius } from "@/lib/geo";
import { sportTree } from "@/data/sports";
import type { DatePreset } from "@/lib/dates";
import { useLocation } from "@/components/location/LocationProvider";
import { EventCard } from "./EventCard";

const WHEN: { v: DatePreset; label: string }[] = [
  { v: "weekend", label: "This weekend" },
  { v: "30d", label: "Next 30 days" },
  { v: "this-month", label: "This month" },
  { v: "next-month", label: "Next month" },
  { v: "all", label: "Any time" },
];

/** "Sports Near Me": radius and date chips, sport filter, and a nudge to widen when results are few. */
export function NearMe({ events, sports, limit = 9 }: { events: EventSummary[]; sports: { slug: string; name: string; icon: string }[]; limit?: number }) {
  const { location, ready, openPicker, detect, detecting } = useLocation();
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS_KM);
  const [when, setWhen] = useState<DatePreset>("30d");
  const [sport, setSport] = useState<string | null>(null);

  const filters = useMemo(() => ({ origin: location ?? undefined, radiusKm: radius, when, sports: sport ? sportTree(sport) : undefined }), [location, radius, when, sport]);
  const hits = useMemo(() => (location ? searchEvents(events, filters) : []), [events, filters, location]);

  // Auto-widen suggestion: next radius that actually adds events.
  const widen = useMemo(() => {
    if (!location || hits.length >= 6) return null;
    for (let r = nextRadius(radius); r; r = nextRadius(r)) {
      const n = searchEvents(events, { ...filters, radiusKm: r }).length;
      if (n > hits.length) return { r, n };
    }
    return null;
  }, [location, hits.length, radius, events, filters]);

  const searchHref = location
    ? `/search/?near=${encodeURIComponent(location.label)}&lat=${location.lat.toFixed(3)}&lng=${location.lng.toFixed(3)}&radius=${radius}&when=${when}${sport ? `&sport=${sport}` : ""}`
    : "/search/";

  return (
    <section id="near-me" className="container-page mt-10" aria-labelledby="near-me-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="near-me-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">Sports near me</h2>
          <p className="mt-1 text-ink-600">
            {location ? <>Events around <button onClick={openPicker} className="font-semibold text-ink-900 underline decoration-dotted underline-offset-4">{location.label}</button>, nearest first.</> : "Set your location to see what's happening around you."}
          </p>
        </div>
        {location && <Link href={searchHref} className="text-sm font-semibold text-brand-600 hover:underline">See all on map →</Link>}
      </div>

      {!ready ? <div className="mt-6 h-40 animate-pulse rounded-2xl bg-ink-100" /> : !location ? (
        <div className="mt-6 grid gap-4 rounded-2xl border border-dashed border-ink-200 bg-white p-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-semibold">Find runs, rides and tournaments near you</p>
            <p className="mt-1 text-sm text-ink-600">Use your current location, or choose a city, locality or PIN code. Your exact location never leaves your device.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => detect()} disabled={detecting} className="btn btn-dark">📍 {detecting ? "Detecting…" : "Use my location"}</button>
            <button onClick={openPicker} className="btn btn-ghost">Choose a place</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-3">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Distance">
              <span className="self-center pr-1 text-sm text-ink-500">Within</span>
              {RADIUS_OPTIONS_KM.map((r) => <button key={r} className="chip" aria-pressed={radius === r} onClick={() => setRadius(r)}>{r} KM</button>)}
            </div>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="When">
              {WHEN.map((w) => <button key={w.v} className="chip" aria-pressed={when === w.v} onClick={() => setWhen(w.v)}>{w.label}</button>)}
            </div>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Sport">
              <button className="chip" aria-pressed={sport === null} onClick={() => setSport(null)}>All sports</button>
              {sports.map((s) => <button key={s.slug} className="chip" aria-pressed={sport === s.slug} onClick={() => setSport(s.slug)}><span aria-hidden>{s.icon}</span>{s.name}</button>)}
            </div>
          </div>

          <p className="mt-4 text-sm text-ink-600" aria-live="polite">
            {hits.length} event{hits.length === 1 ? "" : "s"} within {radius} KM
            {widen && <> · <button className="font-semibold text-brand-600 hover:underline" onClick={() => setRadius(widen.r)}>Show {widen.n} within {widen.r} KM</button></>}
          </p>

          {hits.length > 0 ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hits.slice(0, limit).map((e) => <EventCard key={e.slug} e={e} distanceM={e.distanceM} from="near-me" />)}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl bg-white p-6 text-center text-ink-600 ring-1 ring-ink-100">
              No events match within {radius} KM yet. {widen ? "" : "Try a wider radius, another date range or all sports."}
            </div>
          )}
          {hits.length > limit && <div className="mt-4 text-center"><Link href={searchHref} className="btn btn-ghost">View all {hits.length} events</Link></div>}
        </>
      )}
    </section>
  );
}
