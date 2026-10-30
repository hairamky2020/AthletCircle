"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EventSummary } from "@/lib/event-types";
import { searchEvents, type Filters } from "@/lib/search";
import { RADIUS_OPTIONS_KM, type LatLng } from "@/lib/geo";
import type { DatePreset } from "@/lib/dates";
import { sportTree } from "@/data/sports";
import { useLocation } from "@/components/location/LocationProvider";
import { EventCard } from "./EventCard";
import { LazyMap } from "@/components/map/LazyMap";
import type { MapBounds } from "@/components/map/EventMap";

type SportOpt = { slug: string; name: string; icon: string; parent: string | null };
type CityOpt = { path: string; name: string };

const WHEN: { v: DatePreset | ""; label: string }[] = [
  { v: "", label: "Any date" }, { v: "weekend", label: "This weekend" }, { v: "7d", label: "Next 7 days" },
  { v: "30d", label: "Next 30 days" }, { v: "this-month", label: "This month" }, { v: "next-month", label: "Next month" },
];
export const TOURNAMENT_SPORTS = ["badminton", "football", "cricket", "chess", "tennis", "table-tennis", "kabaddi", "basketball", "volleyball", "hockey", "carrom", "squash", "martial-arts"];

/** Search + filters + list/map views. All filtering runs in the browser; state lives in the URL. */
// Native history update: Next keeps useSearchParams in sync, and no server round trip is needed.
const setQuery = (qs: string) => window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);

export function Explorer({ events, sports, cities, defaultView = "list", title }: {
  events: EventSummary[]; sports: SportOpt[]; cities: CityOpt[]; defaultView?: "list" | "map"; title?: string;
}) {
  const sp = useSearchParams();
  const { location, openPicker } = useLocation();
  const [now, setNow] = useState<Date | null>(null);
  const [bbox, setBbox] = useState<MapBounds | null>(null);
  const [pendingBbox, setPendingBbox] = useState<MapBounds | null>(null);
  const [showMore, setShowMore] = useState(false);
  const moves = useRef(0);
  useEffect(() => setNow(new Date()), []);

  const get = (k: string) => sp.get(k) ?? "";
  const view = (get("view") || defaultView) as "list" | "map";
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) if (v === null || v === "") next.delete(k); else next.set(k, v);
    setQuery(next.toString());
  };

  // Origin: explicit URL location, else the visitor's chosen location.
  const urlOrigin = sp.get("lat") && sp.get("lng") ? { lat: Number(sp.get("lat")), lng: Number(sp.get("lng")) } : null;
  const origin: LatLng | null = urlOrigin ?? (location ? { lat: location.lat, lng: location.lng } : null);
  const originLabel = urlOrigin ? get("near") || "selected place" : location?.label;
  const radius = get("radius") ? Number(get("radius")) : null;

  const filters: Filters = useMemo(() => {
    const type = sp.get("type");
    const sportSlug = sp.get("sport");
    const tree = sportSlug ? sportTree(sportSlug) : type === "tournaments" ? new Set(TOURNAMENT_SPORTS.flatMap((s) => [...sportTree(s)])) : undefined;
    return {
      q: sp.get("q") ?? undefined,
      sports: tree,
      city: sp.get("city") ?? undefined,
      when: (sp.get("when") as DatePreset) || undefined,
      free: sp.get("free") === "1" || undefined,
      open: sp.get("open") === "1" || undefined,
      level: sp.get("level") ?? undefined,
      age: sp.get("age") ? Number(sp.get("age")) : undefined,
      origin: origin ?? undefined,
      radiusKm: origin && radius ? radius : undefined,
      sort: (sp.get("sort") as Filters["sort"]) || undefined,
    };
  }, [sp, origin?.lat, origin?.lng, radius]); // eslint-disable-line react-hooks/exhaustive-deps

  // Centre on the visitor when searching around them; otherwise frame the results (e.g. a chosen city).
  const mapCentre = origin && (radius || !filters.city) ? origin : undefined;

  const hits = useMemo(() => {
    const list = searchEvents(events, filters, now ?? new Date(0));
    return bbox ? list.filter((e) => e.lat >= bbox.s && e.lat <= bbox.n && e.lng >= bbox.w && e.lng <= bbox.e) : list;
  }, [events, filters, now, bbox]);

  const activeCount = ["sport", "city", "when", "free", "open", "level", "age", "radius", "q", "type"].filter((k) => sp.get(k)).length + (bbox ? 1 : 0);

  const filterBar = (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); update({ q: new FormData(e.currentTarget).get("q") as string }); }}>
        <label htmlFor="ex-q" className="sr-only">Search</label>
        <input id="ex-q" name="q" defaultValue={get("q")} key={get("q")} placeholder="Search events, sports, places"
          className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2.5 outline-none focus:border-ink-900" />
        <button className="btn btn-dark !py-2">Search</button>
      </form>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <select aria-label="Sport" className="chip !pr-8" value={get("sport") || (get("type") === "tournaments" ? "__t" : "")}
          onChange={(e) => update(e.target.value === "__t" ? { sport: null, type: "tournaments" } : { sport: e.target.value, type: null })}>
          <option value="">All sports</option>
          <option value="__t">All tournaments</option>
          {sports.map((s) => <option key={s.slug} value={s.slug}>{s.parent ? "  · " : ""}{s.name}</option>)}
        </select>
        <select aria-label="When" className="chip !pr-8" value={get("when")} onChange={(e) => update({ when: e.target.value })}>
          {WHEN.map((w) => <option key={w.v} value={w.v}>{w.label}</option>)}
        </select>
        <select aria-label="City" className="chip !pr-8" value={get("city")} onChange={(e) => update({ city: e.target.value })}>
          <option value="">All cities</option>
          {cities.map((c) => <option key={c.path} value={c.path}>{c.name}</option>)}
        </select>
        {origin ? (
          <select aria-label="Distance" className="chip !pr-8" value={radius ?? ""} onChange={(e) => update({ radius: e.target.value })}>
            <option value="">Any distance</option>
            {RADIUS_OPTIONS_KM.map((r) => <option key={r} value={r}>Within {r} KM</option>)}
          </select>
        ) : (
          <button type="button" className="chip" onClick={openPicker}>📍 Set location for distance</button>
        )}
        <button type="button" className="chip" aria-pressed={get("open") === "1"} onClick={() => update({ open: get("open") === "1" ? null : "1" })}>Registration open</button>
        <button type="button" className="chip" aria-pressed={get("free") === "1"} onClick={() => update({ free: get("free") === "1" ? null : "1" })}>Free</button>
        <button type="button" className="chip" aria-expanded={showMore} onClick={() => setShowMore((v) => !v)}>More filters</button>
      </div>
      {showMore && (
        <div className="flex flex-wrap gap-3 rounded-xl bg-white p-3 ring-1 ring-ink-100">
          <label className="text-sm">Level{" "}
            <select className="ml-1 rounded-lg border border-ink-200 px-2 py-1" value={get("level")} onChange={(e) => update({ level: e.target.value })}>
              <option value="">Any</option><option value="open">Open</option><option value="amateur">Amateur</option>
              <option value="professional">Professional</option><option value="junior">Junior</option><option value="masters">Masters</option>
            </select>
          </label>
          <label className="text-sm">Participant age{" "}
            <input type="number" min={3} max={100} className="ml-1 w-20 rounded-lg border border-ink-200 px-2 py-1" defaultValue={get("age")}
              onBlur={(e) => update({ age: e.target.value })} />
          </label>
          <label className="text-sm">From <input type="date" className="ml-1 rounded-lg border border-ink-200 px-2 py-1" value={get("from")} onChange={(e) => update({ from: e.target.value, when: null })} /></label>
          <label className="text-sm">To <input type="date" className="ml-1 rounded-lg border border-ink-200 px-2 py-1" value={get("to")} onChange={(e) => update({ to: e.target.value, when: null })} /></label>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-ink-600" aria-live="polite">
          <strong className="text-ink-900">{hits.length}</strong> event{hits.length === 1 ? "" : "s"}
          {origin && <> near <button className="font-semibold underline decoration-dotted underline-offset-4" onClick={openPicker}>{originLabel}</button>{radius ? ` (within ${radius} KM)` : ""}</>}
          {bbox && <> in this map area · <button className="font-semibold text-brand-600" onClick={() => setBbox(null)}>clear</button></>}
          {activeCount > 0 && <> · <button className="font-semibold text-brand-600" onClick={() => { setBbox(null); setQuery(view !== defaultView ? `view=${view}` : ""); }}>Reset filters</button></>}
        </p>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="ex-sort">Sort</label>
          <select id="ex-sort" className="rounded-lg border border-ink-200 bg-white px-2 py-1.5" value={get("sort") || (origin ? "nearest" : "date")} onChange={(e) => update({ sort: e.target.value })}>
            {origin && <option value="nearest">Nearest first</option>}
            <option value="date">Date</option>
            <option value="closing">Registration closing soon</option>
            <option value="recent">Recently added</option>
          </select>
          <div className="flex overflow-hidden rounded-lg border border-ink-200" role="group" aria-label="View">
            <button className={`px-3 py-1.5 ${view === "list" ? "bg-ink-900 text-white" : "bg-white"}`} onClick={() => update({ view: defaultView === "list" ? null : "list" })}>List</button>
            <button className={`px-3 py-1.5 ${view === "map" ? "bg-ink-900 text-white" : "bg-white"}`} onClick={() => update({ view: defaultView === "map" ? null : "map" })}>Map</button>
          </div>
        </div>
      </div>
    </div>
  );

  const list = hits.length ? (
    <div className={`grid gap-4 ${view === "map" ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {hits.slice(0, 120).map((e) => <EventCard key={e.slug} e={e} distanceM={e.distanceM} from="search" />)}
    </div>
  ) : (
    <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-ink-100">
      <p className="font-semibold">No events match these filters.</p>
      <p className="mt-1 text-sm text-ink-600">Try a wider distance, a different date range or fewer filters.</p>
    </div>
  );

  return (
    <div className="container-page py-6">
      {title && <h1 className="mb-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>}
      {filterBar}
      {view === "list" ? <div className="mt-6">{list}</div> : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(320px,400px)_1fr]">
          <div className="order-2 max-h-[75vh] overflow-auto pr-1 lg:order-1">{list}</div>
          <div className="relative order-1 lg:order-2">
            <LazyMap events={hits} origin={origin} radiusKm={origin ? radius : null}
              center={mapCentre}
              zoom={radius && radius > 50 ? 8 : radius && radius > 10 ? 10 : 11} fitToEvents={!mapCentre}
              height="h-[60vh] lg:h-[75vh] lg:sticky lg:top-24"
              onMoveEnd={(b) => { if (moves.current++ > 0) setPendingBbox(b); }} />
            {pendingBbox && (
              <button className="btn btn-dark absolute left-1/2 top-3 z-10 -translate-x-1/2 !py-2 text-sm shadow-lg" onClick={() => { setBbox(pendingBbox); setPendingBbox(null); }}>
                Search this area
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
