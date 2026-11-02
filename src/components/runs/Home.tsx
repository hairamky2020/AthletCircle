"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Run } from "@/data/schema";
import { useLocation } from "@/components/location/LocationProvider";
import { LazyMap } from "@/components/map/LazyMap";
import { haversineMetres, type LatLng } from "@/lib/geo";
import { useMyRuns } from "@/lib/myRuns";
import { dayParts, groupByMonth, isPast, placeLabel, runHref, type Kind } from "@/lib/runs";
import { CalendarGrid } from "./CalendarGrid";
import { EventCard } from "@/components/EventCard";
import { SPORT_LIST } from "@/components/SportIcon";
import { SCOPE } from "@/data/events";
import { AdSlot } from "./AdSlot";

/*
 * Home, designed around three questions a runner actually has:
 *   1. What's on soon (this weekend / this month)?   -> "When" chips
 *   2. What's close to me?                            -> "Near me"
 *   3. What fits me (half, ultra, fun run...)?        -> "Type" chips
 * One result area, shown as List, Calendar or Map. Saved runs are one tap away.
 */

type When = "" | "weekend" | "month" | "3months";
type View = "list" | "calendar" | "saved";
type Filters = { q: string; when: When; kind: string; near: boolean; view: View };
const EMPTY: Filters = { q: "", when: "", kind: "", near: false, view: "list" };

const WHEN: { key: When; label: string }[] = [
  { key: "", label: "Any time" },
  { key: "weekend", label: "This weekend" },
  { key: "month", label: "Next 30 days" },
  { key: "3months", label: "Next 3 months" },
];
const VIEWS: { key: View; label: string }[] = [
  { key: "list", label: "List" },
  { key: "calendar", label: "Calendar" },
  { key: "saved", label: "Saved" },
];
/** Category chips. A run matches only on what's announced (its distances or its type); nothing is guessed. */
const has = (r: Run, ...d: string[]) => r.distances.some((x) => d.includes(x.toUpperCase().replace(/\s/g, "")));
const CATS: { key: string; label: string; match: (r: Run) => boolean }[] = [
  { key: "3k", label: "3K", match: (r) => has(r, "3K") },
  { key: "5k", label: "5K", match: (r) => has(r, "5K") },
  { key: "10k", label: "10K", match: (r) => has(r, "10K") },
  { key: "half", label: "Half Marathon", match: (r) => r.kind === "half" || has(r, "21.1K", "21K") },
  { key: "full", label: "Full Marathon", match: (r) => has(r, "42.2K", "42K", "42.195K") || (r.kind === "marathon" && /marathon/i.test(r.title) && !/half/i.test(r.title)) },
  { key: "ultra", label: "Ultra Run", match: (r) => r.kind === "ultra" },
  { key: "theme", label: "Fun Run", match: (r) => r.kind === "theme" },
  { key: "cause", label: "For a Cause", match: (r) => r.kind === "cause" },
];

const SHORT_KIND: Record<Kind, string> = { half: "Half marathon", marathon: "Marathon", ultra: "Ultra", theme: "Fun run", cause: "For a cause", community: "Community" };

function readUrl(): Filters {
  const p = new URLSearchParams(window.location.search);
  const view = (p.get("view") as View) || (window.location.hash === "#my-runs" ? "saved" : "list");
  return { q: p.get("q") ?? "", when: (p.get("when") as When) ?? "", kind: p.get("type") ?? "", near: p.get("sort") === "nearest", view };
}
function writeUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.when) p.set("when", f.when);
  if (f.kind) p.set("type", f.kind);
  if (f.near) p.set("sort", "nearest");
  if (f.view !== "list") p.set("view", f.view);
  const qs = p.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

const ymd = (d: Date) => new Date(d.getTime() + 5.5 * 36e5).toISOString().slice(0, 10); // IST date
function inWindow(date: string, when: When, now: Date) {
  if (!when) return true;
  const today = ymd(now);
  if (when === "weekend") {
    const dow = new Date(today + "T00:00:00Z").getUTCDay(); // 0 Sun .. 6 Sat
    const sat = new Date(Date.parse(today) + ((6 - dow + 7) % 7) * 864e5);
    const start = dow === 0 ? today : ymd(new Date(sat.getTime() - 5.5 * 36e5));
    const end = dow === 0 ? today : ymd(new Date(sat.getTime() + 864e5 - 5.5 * 36e5));
    return date >= start && date <= end;
  }
  const days = when === "month" ? 30 : 92;
  return date >= today && date <= ymd(new Date(now.getTime() + days * 864e5));
}

/** A run matches when EVERY word typed appears in its name, area, venue, type, distances or month. */
function matchesWords(r: Run, words: string[]) {
  if (!words.length) return true;
  const d = dayParts(r.date);
  const hay = `${r.title} ${r.area ?? ""} ${r.venue ?? ""} ${SHORT_KIND[r.kind]} ${r.distances.join(" ")} ${d.month} ${d.year}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}

export function Home({ runs, builtAt }: { runs: Run[]; builtAt: string }) {
  const [now, setNow] = useState(() => new Date(builtAt));
  const [f, setF] = useState<Filters>(EMPTY);
  const { location, detect, detecting, error: geoError, openPicker } = useLocation();
  const mine = useMyRuns();

  useEffect(() => {
    setNow(new Date());
    setF(readUrl());
    const onHash = () => setF((cur) => ({ ...cur, view: window.location.hash === "#my-runs" ? "saved" : cur.view }));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const update = (patch: Partial<Filters>) => setF((cur) => { const next = { ...cur, ...patch }; writeUrl(next); return next; });

  const upcoming = useMemo(() => runs.filter((r) => !isPast(r, now)), [runs, now]);
  const past = useMemo(() => runs.filter((r) => isPast(r, now)).reverse(), [runs, now]);
  const origin: LatLng | null = location ? { lat: location.lat, lng: location.lng } : null;
  const distanceOf = (r: Run) => (origin && r.location ? haversineMetres(origin, r.location) : null);
  const nearOn = f.near && !!origin;

  const shown = useMemo(() => {
    const words = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let list = upcoming.filter((r) => matchesWords(r, words) && inWindow(r.date, f.when, now) && (!f.kind || !!CATS.find((c) => c.key === f.kind)?.match(r)));
    if (nearOn) list = [...list].sort((a, b) => (distanceOf(a) ?? Infinity) - (distanceOf(b) ?? Infinity));
    return list;
  }, [upcoming, f, now, nearOn, origin?.lat, origin?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const cats = CATS.map((c) => ({ ...c, n: upcoming.filter(c.match).length }));
  const saved = runs.filter((r) => mine.has(r.slug));
  const featured = (upcoming.filter((r) => r.featured).length ? upcoming.filter((r) => r.featured) : upcoming).slice(0, 6);
  const filtered = Boolean(f.q || f.when || f.kind || f.near);
  const nearest = origin ? [...upcoming].filter((r) => r.location).sort((a, b) => distanceOf(a)! - distanceOf(b)!).slice(0, 3) : [];
  const countBySport = (slug: string) => upcoming.filter((r) => r.sport === slug).length;
  const strip = useRef<HTMLUListElement>(null);
  const scrollStrip = (dir: number) => strip.current?.scrollBy({ left: dir * strip.current.clientWidth * 0.9, behavior: "smooth" });

  async function nearMe() {
    const l = origin ?? (await detect());
    if (!l) openPicker();
  }

  return (
    <>
      {/* Hero + search */}
      <section className="hero3">
        <div className="wrap hero3-inner">
          <div>
            <p className="tagline mb-3">Discover. Participate. Achieve.</p>
            <h1>Every Sport. Every Athlete. <span className="text-orange">One Circle.</span></h1>
            <p className="hero3-sub">Discover sporting events, explore opportunities near you and connect with the sporting community.</p>
            <form className="searchbar" role="search" onSubmit={(e) => { e.preventDefault(); document.getElementById("upcoming")?.scrollIntoView({ behavior: "smooth" }); }}>
              <label className="sr-only" htmlFor="q">Search events</label>
              <input id="q" type="search" className="field" value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder="Search events or areas" aria-label="Search runs or areas" />
              <label className="sr-only" htmlFor="sport">Sport</label>
              <select id="sport" className="field" defaultValue={SCOPE.sport} aria-label="Sport">
                {SPORT_LIST.filter((s) => countBySport(s.slug)).map((s) => <option key={s.slug} value={s.slug} disabled={!countBySport(s.slug)}>{s.name}{countBySport(s.slug) ? "" : " (soon)"}</option>)}
              </select>
              <label className="sr-only" htmlFor="when">Date</label>
              <select id="when" className="field" value={f.when} onChange={(e) => update({ when: e.target.value as When })} aria-label="Date">
                {WHEN.map((w) => <option key={w.key} value={w.key}>{w.label}</option>)}
              </select>
              <button className="btn-primary" type="submit">Search</button>
            </form>
            {f.q.trim() && <p className="search-hint" aria-live="polite">{shown.length ? <>{shown.length} {shown.length === 1 ? "event matches" : "events match"} “{f.q.trim()}” · <a href="#upcoming">see results ↓</a></> : <>No upcoming events match “{f.q.trim()}”.</>}</p>}
            <div className="hero-quick" aria-label="Quick picks">
              <button type="button" className="quick-chip" onClick={() => { update({ when: "weekend" }); document.getElementById("upcoming")?.scrollIntoView({ behavior: "smooth" }); }}>This weekend</button>
              <a className="quick-chip" href="#nearby">Near me</a>
              <a className="quick-chip" href="#map">On the map</a>
            </div>
            <p className="mt-3 text-sm text-muted">City: <b className="text-navy">{SCOPE.cityName}</b> · {upcoming.length} upcoming events, each checked by our team.</p>
          </div>
          <svg className="hero-rings" viewBox="0 0 380 320" aria-hidden="true">
            <circle cx="140" cy="130" r="100" stroke="#FF8A00" />
            <circle cx="245" cy="150" r="92" stroke="#0866E9" />
            <circle cx="185" cy="215" r="76" stroke="#36B900" />
          </svg>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="wrap section" aria-labelledby="featured-h">
          <div className="section-head">
            <h2 id="featured-h" className="h2">Featured events</h2>
            <div className="hidden gap-2 sm:flex">
              <button className="carousel-btn" onClick={() => scrollStrip(-1)} aria-label="Previous featured events">‹</button>
              <button className="carousel-btn" onClick={() => scrollStrip(1)} aria-label="Next featured events">›</button>
            </div>
          </div>
          <ul ref={strip} className="featured-strip">
            {featured.map((r) => <li key={r.slug}><EventCard run={r} now={now} featured /></li>)}
          </ul>
        </section>
      )}

      {/* Upcoming events */}
      <section id="upcoming" className="wrap section scroll-mt-20" aria-labelledby="upcoming-h">
        <div className="section-head"><h2 id="upcoming-h" className="h2">Upcoming events</h2></div>
        <div className="chip-row" role="group" aria-label="When">
          {WHEN.map((w) => <button key={w.key} className="chip2" aria-pressed={f.when === w.key} onClick={() => update({ when: w.key })}>{w.label}</button>)}
        </div>
        <div className="results-bar">
          <p aria-live="polite"><b>{f.view === "saved" ? saved.length : shown.length}</b> {f.view === "saved" ? "saved" : (shown.length === 1 ? "event" : "events")}
            {nearOn && f.view !== "saved" && <span className="text-muted"> · nearest first, straight-line</span>}
            {f.kind && <span className="text-muted"> · {CATS.find((c) => c.key === f.kind)?.label}</span>}
            {filtered && f.view !== "saved" && <button className="btn-tertiary ml-2 !min-h-0 text-sm" onClick={() => update({ ...EMPTY, view: f.view })}>Clear filters</button>}
          </p>
          <div className="view-switch" role="tablist" aria-label="View">
            {VIEWS.map((v) => (
              <button key={v.key} role="tab" aria-selected={f.view === v.key} onClick={() => update({ view: v.key })}>
                {v.label}{v.key === "saved" && saved.length > 0 && <span className="view-count">{saved.length}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5">
          {f.view === "list" && (shown.length ? <CardList runs={shown} now={now} distanceOf={distanceOf} flat={nearOn} /> : <Empty cat={CATS.find((c) => c.key === f.kind)?.label} onClear={() => update({ ...EMPTY })} />)}
          {f.view === "calendar" && <CalendarGrid runs={shown} today={now} />}
          {f.view === "saved" && <div id="my-runs">{saved.length ? <CardList runs={saved} now={now} distanceOf={distanceOf} flat /> : (
            <p className="empty-box">Tap ♡ on any event and it appears here. Saved on this device only, no account needed.</p>
          )}</div>}
        </div>
      </section>

      {/* Nearby */}
      <section id="nearby" className="wrap section scroll-mt-20" aria-labelledby="nearby-h">
        <div className="section-head">
          <h2 id="nearby-h" className="h2">Events near you</h2>
          {origin ? <p>Nearest to <b className="text-navy">{location?.label}</b>, straight-line. <button className="btn-tertiary !min-h-0" onClick={openPicker}>Change</button></p> : null}
        </div>
        {!origin ? (
          <div className="near-ask">
            <span className="near-ask-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg></span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-navy">Show events near you?</p>
              <p className="text-sm text-text-2">Tap “Use my location” and your browser will ask for permission. Your location stays on this device, is never shared, and is forgotten when you close the site. Prefer not to? Pick an area instead.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" onClick={nearMe} disabled={detecting}>{detecting ? "Finding you…" : "Use my location"}</button>
              <button className="btn-secondary" onClick={openPicker}>Pick an area</button>
            </div>
            {geoError && <p className="w-full text-sm text-text-2" role="alert">{geoError}</p>}
          </div>
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{nearest.map((r) => <li key={r.slug}><EventCard run={r} now={now} away={distanceOf(r)} /></li>)}</ul>
            <button className="btn-tertiary mt-3" onClick={() => { update({ near: true, view: "list" }); document.getElementById("upcoming")?.scrollIntoView({ behavior: "smooth" }); }}>Sort all events by distance</button>
          </>
        )}
      </section>

      {/* Map */}
      <section id="map" className="wrap section scroll-mt-20" aria-labelledby="map-h">
        <div className="section-head"><h2 id="map-h" className="h2">Event map</h2><p>{shown.filter((r) => r.location).length} of {shown.length} events on the map. Pins show the area, not the exact start line.</p></div>
        <LazyMap runs={shown.filter((r) => r.location)} origin={origin} height="h-[360px] md:h-[440px]" />
      </section>

      {/* Explore by categories */}
      <section className="wrap section" aria-labelledby="cats-h">
        <div className="section-head"><h2 id="cats-h" className="h2">Explore by categories</h2><p>Counts include only distances organizers have announced.</p></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Distance or type">
          <button className="chip2" aria-pressed={!f.kind} onClick={() => update({ kind: "" })}>All categories</button>
          {cats.map((c) => (
            <button key={c.key} className="chip2" aria-pressed={f.kind === c.key} onClick={() => { update({ kind: f.kind === c.key ? "" : c.key, view: "list" }); document.getElementById("upcoming")?.scrollIntoView({ behavior: "smooth" }); }}>
              {c.label}<span className="chip-n">{c.n}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section id="past" className="wrap section" aria-label="Completed events">
          <details className="past-box">
            <summary>Completed events <span className="font-medium text-muted">({past.length}) · for reference</span></summary>
            <ul className="mt-3 divide-y divide-line">
              {past.map((r) => (
                <li key={r.slug}><Link href={runHref(r.slug)} className="flex flex-wrap justify-between gap-2 py-3 text-text-2 hover:text-blue">
                  <span className="font-semibold">{r.title}</span><span>{dayParts(r.date).day} {dayParts(r.date).month} {dayParts(r.date).year}{placeLabel(r) ? ` · ${placeLabel(r)}` : ""}</span>
                </Link></li>
              ))}
            </ul>
          </details>
        </section>
      )}

      <div className="wrap section"><AdSlot size="inline" /></div>

      {/* Organizer CTA */}
      <section className="wrap section">
        <div className="organizer-cta">
          <div><p className="text-xl font-bold !text-white">Organising a sporting event?</p><p>List it free on AthletCircle. Every event is reviewed before it goes live.</p></div>
          <Link href="/submit" className="btn-primary">Submit an Event</Link>
        </div>
      </section>
    </>
  );
}

const Empty = ({ onClear, cat }: { onClear: () => void; cat?: string }) => (
  <div className="empty-box">{cat ? `No ${cat} events announced yet. We'll list them as soon as organizers confirm.` : "No events match."} <button className="btn-tertiary" onClick={onClear}>Show all events</button></div>
);

type ListProps = { runs: Run[]; now: Date; distanceOf: (r: Run) => number | null };

function CardList({ runs, now, distanceOf, flat }: ListProps & { flat: boolean }) {
  const groups = flat ? [{ key: "all", label: "", items: runs }] : groupByMonth(runs);
  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g.key}>
          {g.label && <h3 className="month-head">{g.label}</h3>}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((r) => <li key={r.slug}><EventCard run={r} now={now} away={distanceOf(r)} /></li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
