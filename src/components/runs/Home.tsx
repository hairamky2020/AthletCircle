"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Run } from "@/data/schema";
import { useLocation } from "@/components/location/LocationProvider";
import { LazyMap } from "@/components/map/LazyMap";
import { formatDistance, haversineMetres, type LatLng } from "@/lib/geo";
import { useMyRuns } from "@/lib/myRuns";
import { dayParts, groupByMonth, isPast, placeLabel, relativeDay, runHref, type Kind } from "@/lib/runs";
import { photoFor } from "@/lib/images";
import { CalendarGrid } from "./CalendarGrid";
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
  const origin: LatLng | null = location ? { lat: location.lat, lng: location.lng } : null;
  const distanceOf = (r: Run) => (origin && r.location ? haversineMetres(origin, r.location) : null);
  const nearOn = f.near && !!origin;

  const shown = useMemo(() => {
    const words = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let list = upcoming.filter((r) =>
      matchesWords(r, words) &&
      inWindow(r.date, f.when, now) &&
      (!f.kind || !!CATS.find((c) => c.key === f.kind)?.match(r)));
    if (nearOn) list = [...list].sort((a, b) => (distanceOf(a) ?? Infinity) - (distanceOf(b) ?? Infinity));
    return list;
  }, [upcoming, f, now, nearOn, origin?.lat, origin?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const cats = CATS.map((c) => ({ ...c, n: upcoming.filter(c.match).length }));
  const saved = runs.filter((r) => mine.has(r.slug));
  const featured = (upcoming.filter((r) => r.featured).length ? upcoming.filter((r) => r.featured) : upcoming).slice(0, 6);
  const filtered = Boolean(f.q || f.when || f.kind || f.near);
  const past = useMemo(() => runs.filter((r) => isPast(r, now)).reverse(), [runs, now]);

  async function nearMe() {
    if (nearOn) return update({ near: false });
    const l = origin ?? (await detect());
    if (l) update({ near: true });
    else openPicker();
  }

  return (
    <>
      {/* 1. Hero: one sentence, one search, one location button */}
      <section className="hero2">
        <div className="wrap">
          <h1 className="hero2-title">Find your next run<span className="text-brand-500"> in Hyderabad.</span></h1>
          <p className="hero2-sub">{upcoming.length} upcoming runs, checked by us. Free, no sign-up.</p>
          <div className="hero2-search" role="search">
            <svg className="ml-4 shrink-0 text-ink-400" width="18" height="18" viewBox="0 0 16 16" aria-hidden><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            <input type="search" value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder="Search a run or area, e.g. Gachibowli" aria-label="Search runs or areas" />
            <button className={`near-pill ${nearOn ? "is-on" : ""}`} onClick={nearMe} disabled={detecting} aria-pressed={nearOn}>
              <svg width="14" height="16" viewBox="0 0 12 14" aria-hidden><path d="M6 13.5S1 8.6 1 5.5a5 5 0 0 1 10 0c0 3.1-5 8-5 8Z" fill="none" stroke="currentColor" strokeWidth="1.6"/><circle cx="6" cy="5.5" r="1.6" fill="currentColor"/></svg>
              {detecting ? "Finding you…" : nearOn ? `Near ${location?.label}` : "Near me"}
            </button>
          </div>
          {geoError && <p className="mt-2 text-sm text-ink-500" role="alert">{geoError}</p>}
          {f.q.trim() && <p className="search-hint" aria-live="polite">{shown.length ? <>{shown.length} {shown.length === 1 ? "run matches" : "runs match"} “{f.q.trim()}” · <a href="#upcoming">see below ↓</a></> : <>No upcoming runs match “{f.q.trim()}”.</>}</p>}
        </div>
      </section>

      {/* 2. Featured: swipeable poster cards */}
      {!filtered && featured.length > 0 && (
        <section className="wrap mt-8" aria-label="Featured runs">
          <h2 className="h2-small">Featured</h2>
          <ul className="featured-strip">
            {featured.map((r) => <li key={r.slug}><Poster run={r} now={now} /></li>)}
          </ul>
        </section>
      )}

      {/* Map of the runs that match, right under the search (free OpenStreetMap tiles) */}
      <section className="wrap mt-8" aria-label="Map of runs">
        <LazyMap runs={shown.filter((r) => r.location)} origin={origin} height="h-[300px] md:h-[360px]" />
        <p className="mt-2 text-xs text-ink-500">{shown.filter((r) => r.location).length} of {shown.length} runs on the map. Pins show the area, not the exact start line.</p>
      </section>

      {/* 3. Results: quick filters + one view at a time */}
      <section id="upcoming" className="wrap mt-10 scroll-mt-20" aria-label="Runs">
        <div className="filter-rows">
          <div className="chip-row" role="group" aria-label="When">
            {WHEN.map((w) => <button key={w.key} className="chip2" aria-pressed={f.when === w.key} onClick={() => update({ when: w.key })}>{w.label}</button>)}
          </div>
          <div className="chip-row" role="group" aria-label="Distance or type">
            <button className="chip2" aria-pressed={!f.kind} onClick={() => update({ kind: "" })}>All categories</button>
            {cats.map((c) => (
              <button key={c.key} className="chip2" aria-pressed={f.kind === c.key} onClick={() => update({ kind: f.kind === c.key ? "" : c.key })}>
                {c.label}<span className="chip-n">{c.n}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="results-bar">
          <p aria-live="polite"><b>{f.view === "saved" ? saved.length : shown.length}</b> {f.view === "saved" ? "saved" : (shown.length === 1 ? "run" : "runs")}
            {nearOn && f.view !== "saved" && <span className="text-ink-500"> · nearest first, straight-line</span>}
            {filtered && f.view !== "saved" && <button className="ml-3 text-sm text-ink-500 underline underline-offset-2" onClick={() => update({ ...EMPTY, view: f.view })}>Clear filters</button>}
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
            <p className="empty-box">Tap <b>♡ Save</b> on any run and it shows up here. Saved on this device only, no account needed.</p>
          )}</div>}
        </div>
      </section>

      {/* Past runs, for reference */}
      {past.length > 0 && (
        <section id="past" className="wrap mt-14" aria-labelledby="past-h">
          <details className="past-box">
            <summary><span id="past-h" className="font-bold">Completed runs</span> <span className="text-ink-500">({past.length}) · for reference</span></summary>
            <ul className="mt-3 divide-y divide-line">
              {past.map((r) => (
                <li key={r.slug}><Link href={runHref(r.slug)} className="flex flex-wrap justify-between gap-2 py-3 text-ink-600 hover:text-ink-900">
                  <span className="font-semibold">{r.title}</span><span>{dayParts(r.date).day} {dayParts(r.date).month} {dayParts(r.date).year}{placeLabel(r) ? ` · ${placeLabel(r)}` : ""}</span>
                </Link></li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {/* 4. One quiet ad, then organizers */}
      <div className="wrap mt-14"><AdSlot size="inline" /></div>
      <section className="wrap mt-8">
        <div className="organizer-cta">
          <div><p className="text-lg font-bold">Organising a run?</p><p className="text-ink-500">List it free. We review every event before it goes live.</p></div>
          <Link href="/submit" className="btn-primary">Submit an event</Link>
        </div>
      </section>
    </>
  );
}

const Empty = ({ onClear, cat }: { onClear: () => void; cat?: string }) => (
  <div className="empty-box">{cat ? `No ${cat} runs announced yet. We'll list them as soon as organisers confirm distances.` : "No runs match."} <button className="underline underline-offset-2" onClick={onClear}>Show all runs</button></div>
);

/* ---------- Featured poster ---------- */

const POSTER_BG = ["#1d4ed8", "#c2410c", "#0f766e", "#be185d", "#4338ca", "#15803d"];

function Poster({ run, now }: { run: Run; now: Date }) {
  const d = dayParts(run.date);
  const photo = photoFor(run, 700);
  const bg = POSTER_BG[run.slug.length % POSTER_BG.length];
  return (
    <Link href={runHref(run.slug)} className="poster" style={{ background: bg }}>
      {!photo.generic && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.src} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      )}
      <span className="poster-shade" />
      <span className="poster-when">{relativeDay(run.date, now)}</span>
      <span className="poster-body">
        <span className="poster-date">{d.day} {d.month}</span>
        <span className="poster-title">{run.title}</span>
        <span className="poster-place">{placeLabel(run) ?? "Venue to be announced"}</span>
      </span>
    </Link>
  );
}

/* ---------- Cards ---------- */

type ListProps = { runs: Run[]; now: Date; distanceOf: (r: Run) => number | null };

function CardList({ runs, now, distanceOf, flat }: ListProps & { flat: boolean }) {
  const groups = flat ? [{ key: "all", label: "", items: runs }] : groupByMonth(runs);
  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g.key}>
          {g.label && <h3 className="month-head">{g.label}</h3>}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((r) => <li key={r.slug}><RunCard run={r} now={now} away={distanceOf(r)} /></li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RunCard({ run, now, away }: { run: Run; now: Date; away: number | null }) {
  const d = dayParts(run.date);
  const rel = relativeDay(run.date, now);
  const { has, toggle } = useMyRuns();
  const on = has(run.slug);
  return (
    <Link href={runHref(run.slug)} className="run-card2 group">
      <span className="rc-date"><span className="rc-day">{d.day}</span><span className="rc-mon">{d.month}</span><span className="rc-dow">{d.weekday}</span></span>
      <span className="min-w-0 flex-1">
        <span className="rc-when">{rel}</span>
        <span className="rc-title">{run.title}</span>
        <span className="rc-meta">
          {placeLabel(run) ?? "Venue not announced"}
          {away !== null && <> · <b>{formatDistance(away)}</b></>}
        </span>
        <span className="rc-tags">
          <span className="rc-tag">{SHORT_KIND[run.kind]}</span>
          {run.distances.slice(0, 3).map((x) => <span key={x} className="rc-tag">{x}</span>)}
          <button className={`save-btn ml-auto ${on ? "is-on" : ""}`} aria-pressed={on} aria-label={on ? `Remove ${run.title} from saved` : `Save ${run.title}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(run.slug); }}>
        {on ? "♥" : "♡"}<span className="sr-only sm:not-sr-only"> {on ? "Saved" : "Save"}</span>
      </button>
        </span>
      </span>

    </Link>
  );
}
