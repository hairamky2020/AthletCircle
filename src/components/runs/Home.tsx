"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Run } from "@/data/schema";
import { useLocation } from "@/components/location/LocationProvider";
import { LazyMap } from "@/components/map/LazyMap";
import { formatDistance, haversineMetres, type LatLng } from "@/lib/geo";
import { useMyRuns } from "@/lib/myRuns";
import { dayParts, formatMonth, formatShort, groupByMonth, isPast, monthKey, placeLabel, relativeDay, runHref, KINDS, type Kind } from "@/lib/runs";
import { CalendarGrid } from "./CalendarGrid";
import { RegisterToggle } from "./RegisterToggle";
import { Banner } from "./Banner";
import { AdSlot } from "./AdSlot";
import { KindIcon } from "./KindIcon";

type Filters = { q: string; month: string; area: string; near: boolean; kind: string };
const EMPTY: Filters = { q: "", month: "", area: "", near: false, kind: "" };
const NO_PLACE = "not-announced";
const areaKey = (r: Run) => (r.area ? r.area.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : NO_PLACE);

export const SECTIONS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "list", label: "List" },
  { id: "calendar", label: "Calendar" },
  { id: "map", label: "Map" },
  { id: "my-runs", label: "My runs" },
] as const;

function readUrl(): Filters {
  const p = new URLSearchParams(window.location.search);
  return { q: p.get("q") ?? "", month: p.get("month") ?? "", area: p.get("area") ?? "", near: p.get("sort") === "nearest", kind: p.get("type") ?? "" };
}
function writeUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.month) p.set("month", f.month);
  if (f.area) p.set("area", f.area);
  if (f.near) p.set("sort", "nearest");
  if (f.kind) p.set("type", f.kind);
  const qs = p.toString();
  window.history.replaceState(null, "", (qs ? `?${qs}` : window.location.pathname) + window.location.hash);
}

/**
 * The whole run guide on one page: hero with the next start line, a sticky menu that scrolls
 * between sections, and every view (upcoming, list, calendar, map, my runs) stacked below.
 */
export function Home({ runs, builtAt }: { runs: Run[]; builtAt: string }) {
  const [now, setNow] = useState(() => new Date(builtAt));
  const [f, setF] = useState<Filters>(EMPTY);
  const { location, openPicker } = useLocation();
  const mine = useMyRuns();

  useEffect(() => {
    setNow(new Date());
    setF(readUrl());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const update = (patch: Partial<Filters>) => setF((cur) => { const next = { ...cur, ...patch }; writeUrl(next); return next; });

  const upcoming = useMemo(() => runs.filter((r) => !isPast(r, now)), [runs, now]);
  const months = useMemo(() => groupByMonth(upcoming).map((g) => ({ key: g.key, count: g.items.length })), [upcoming]);
  const areas = useMemo(() => {
    const m = new Map<string, { key: string; label: string; count: number }>();
    for (const r of upcoming) {
      const k = areaKey(r);
      const cur = m.get(k) ?? { key: k, label: r.area ?? "Venue not announced", count: 0 };
      cur.count++;
      m.set(k, cur);
    }
    return [...m.values()].sort((a, b) => (a.key === NO_PLACE ? 1 : b.key === NO_PLACE ? -1 : b.count - a.count || a.label.localeCompare(b.label)));
  }, [upcoming]);

  const origin: LatLng | null = location ? { lat: location.lat, lng: location.lng } : null;
  const distanceOf = (r: Run) => (origin && r.location ? haversineMetres(origin, r.location) : null);

  const shown = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    let list = upcoming.filter((r) =>
      (!q || `${r.title} ${r.area ?? ""} ${r.venue ?? ""}`.toLowerCase().includes(q)) &&
      (!f.month || monthKey(r.date) === f.month) &&
      (!f.area || areaKey(r) === f.area) &&
      (!f.kind || r.kind === f.kind));
    if (f.near && origin) list = [...list].sort((a, b) => (distanceOf(a) ?? Infinity) - (distanceOf(b) ?? Infinity));
    return list;
  }, [upcoming, f, origin?.lat, origin?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const myRuns = runs.filter((r) => mine.has(r.slug));
  const next = upcoming[0];
  const active = Boolean(f.q || f.month || f.area || f.near || f.kind);
  const featured = upcoming.filter((r) => r.featured);
  const areaCount = new Set(upcoming.filter((r) => r.area).map(areaKey)).size;

  return (
    <>
      <div className="wrap pt-6 md:pt-8"><Banner runs={featured.length ? featured : upcoming.slice(0, 3)} now={now} /></div>
      <div className="wrap mt-4"><AdSlot size="leaderboard" /></div>
      <Intro next={next} now={now} total={upcoming.length} months={months.length} areas={areaCount} />
      <div className="wrap">
        <Section id="categories" kicker="" title="Event categories" note="Tap a category to filter every section below.">
          <Categories runs={upcoming} active={f.kind} onPick={(k) => { update({ kind: f.kind === k ? "" : k }); document.getElementById("upcoming")?.scrollIntoView({ behavior: "smooth" }); }} />
        </Section>
      </div>

      <SectionNav myCount={myRuns.length} />

      <div className="wrap">
        {/* Filters apply to every section below */}
        <div className="filters" role="search">
          <div className="relative flex-1 sm:max-w-xs">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="16" height="16" viewBox="0 0 16 16" aria-hidden><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="m11 11 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            <input type="search" value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder="Search runs or areas" aria-label="Search runs or areas" className="field w-full !pl-9" />
          </div>
          <select value={f.month} onChange={(e) => update({ month: e.target.value })} aria-label="Month" className="field">
            <option value="">Any month</option>
            {months.map((m) => <option key={m.key} value={m.key}>{formatMonth(m.key)} ({m.count})</option>)}
          </select>
          <select value={f.area} onChange={(e) => update({ area: e.target.value })} aria-label="Area" className="field">
            <option value="">All areas</option>
            {areas.map((a) => <option key={a.key} value={a.key}>{a.label} ({a.count})</option>)}
          </select>
          {f.kind && <button className="chip" aria-pressed onClick={() => update({ kind: "" })}>{KINDS[f.kind as Kind].label} ✕</button>}
          <button className="chip" aria-pressed={f.near && !!origin} onClick={() => (origin ? update({ near: !f.near }) : (update({ near: true }), openPicker()))}>
            <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden><path d="M6 13.5S1 8.6 1 5.5a5 5 0 0 1 10 0c0 3.1-5 8-5 8Z" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
            Nearest to me
          </button>
          {active && <button onClick={() => update(EMPTY)} className="text-sm font-medium text-ink-500 underline underline-offset-2 hover:text-ink-900">Clear</button>}
          <p className="w-full text-sm text-ink-500 sm:ml-auto sm:w-auto" aria-live="polite">
            {shown.length} of {upcoming.length} runs{f.near && origin ? ` · nearest to ${location!.label}` : ""}
          </p>
        </div>

        <Section id="upcoming" kicker="01" title="Upcoming runs" note="Grouped by month. Tap a run for details.">
          {shown.length === 0 ? <Empty /> : <Upcoming runs={shown} now={now} distanceOf={distanceOf} flat={f.near && !!origin} />}
        </Section>

        <div className="mt-14"><AdSlot size="inline" /></div>

        <Section id="list" kicker="02" title="All runs at a glance" note="The whole season in one table.">
          {shown.length === 0 ? <Empty /> : <ListTable runs={shown} now={now} distanceOf={distanceOf} />}
        </Section>

        <Section id="calendar" kicker="03" title="Calendar" note="Weekends are shaded. Most runs are on Sundays.">
          <CalendarGrid runs={shown} today={now} initialMonth={f.month || months[0]?.key} />
        </Section>

        <div className="mt-14"><AdSlot size="inline" /></div>

        <Section id="map" kicker="04" title="Map" note="Pins mark the announced area, not the exact start line.">
          <MapBlock runs={shown} origin={origin} />
        </Section>

        <Section id="my-runs" kicker="05" title="My runs" note="Runs you’ve marked as registered. Saved on this device only.">
          <MyRuns runs={myRuns} now={now} />
        </Section>
      </div>
    </>
  );
}

function useCountdown(date: string | undefined, now: Date) {
  if (!date) return null;
  // Runs start early; count down to 6:00 AM IST on race day as a sensible target.
  const target = Date.parse(`${date}T06:00:00+05:30`);
  const ms = Math.max(0, target - now.getTime());
  return { d: Math.floor(ms / 864e5), h: Math.floor((ms % 864e5) / 36e5), m: Math.floor((ms % 36e5) / 6e4) };
}

function Intro({ next, now, total, months, areas }: { next?: Run; now: Date; total: number; months: number; areas: number }) {
  const cd = useCountdown(next?.date, now);
  return (
    <section className="wrap mt-6 grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <div className="intro-card">
        <p className="intro-kicker">Hyderabad running calendar</p>
        <h1 className="intro-title">Find your next <span className="text-brand-500">start line.</span></h1>
        <dl className="mt-5 flex gap-8">
          {[[total, "upcoming runs"], [months, "months"], [areas, "areas"]].map(([n, l]) => (
            <div key={l as string}><dt className="sr-only">{l}</dt><dd><span className="block text-3xl font-black italic tracking-tight">{n}</span><span className="text-sm text-ink-500">{l}</span></dd></div>
          ))}
        </dl>
      </div>
      {next && cd && (
        <Link href={runHref(next.slug)} className="countdown-card group">
          <p className="intro-kicker !text-white/80">Next start line</p>
          <p className="mt-1 truncate text-2xl font-black italic uppercase tracking-tight">{next.title}</p>
          <p className="text-sm text-white/80">{formatShort(next.date)} · {placeLabel(next) ?? "Venue TBA"}</p>
          <div className="mt-4 grid grid-cols-3 gap-2" aria-label={`Starts ${relativeDay(next.date, now).toLowerCase()}`}>
            {[[cd.d, "days"], [cd.h, "hrs"], [cd.m, "min"]].map(([n, l]) => (
              <div key={l as string} className="rounded-xl bg-white/15 py-2 text-center">
                <span className="block text-3xl font-black italic tabular-nums">{String(n).padStart(2, "0")}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/75">{l}</span>
              </div>
            ))}
          </div>
        </Link>
      )}
    </section>
  );
}

function Categories({ runs, active, onPick }: { runs: Run[]; active: string; onPick: (k: Kind) => void }) {
  const kinds = (Object.keys(KINDS) as Kind[]).map((k) => ({ k, n: runs.filter((r) => r.kind === k).length })).filter((x) => x.n > 0);
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {kinds.map(({ k, n }) => (
        <li key={k}>
          <button onClick={() => onPick(k)} aria-pressed={active === k} className="cat-card">
            <span className="cat-icon"><KindIcon kind={k} /></span>
            <span className="mt-auto block text-[15px] font-bold leading-tight">{KINDS[k].label}</span>
            <span className="block text-xs text-ink-500">{n} {n === 1 ? "run" : "runs"} · {KINDS[k].blurb}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Sticky menu with scroll-spy ---------- */

function SectionNav({ myCount }: { myCount: number }) {
  const [active, setActive] = useState<string>("upcoming");
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id);
    }, { rootMargin: "-30% 0px -60% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
    setActive(id);
  };
  return (
    <div className="section-nav">
      <nav className="wrap no-scrollbar flex gap-1 overflow-x-auto py-2.5" aria-label="Sections">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} onClick={go(s.id)} aria-current={active === s.id ? "true" : undefined} className="seg">
            {s.label}
            {s.id === "my-runs" && myCount > 0 && <span className="seg-badge">{myCount}</span>}
          </a>
        ))}
      </nav>
    </div>
  );
}

function Section({ id, kicker, title, note, children }: { id: string; kicker: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 pt-14 md:pt-20" aria-labelledby={`${id}-h`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <h2 id={`${id}-h`} className="section-title flex items-baseline gap-3">
          {kicker && <span className="font-mono text-sm font-medium not-italic text-brand-500">{kicker}</span>}{title}
        </h2>
        <p className="text-sm text-ink-500">{note}</p>
      </div>
      {children}
    </section>
  );
}

const Empty = () => <p className="rounded-2xl border border-dashed border-ink-200 p-8 text-center text-ink-500">No runs match these filters.</p>;

/* ---------- Upcoming (cards by month) ---------- */

type ListProps = { runs: Run[]; now: Date; distanceOf: (r: Run) => number | null };

function Upcoming({ runs, now, distanceOf, flat }: ListProps & { flat: boolean }) {
  const groups = flat ? [{ key: "all", label: "", items: runs }] : groupByMonth(runs);
  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <div key={g.key}>
          {g.label && (
            <h3 className="mb-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-[.14em] text-ink-500">
              {g.label}<span className="h-px flex-1 bg-ink-200" /><span className="font-mono text-xs normal-case tracking-normal">{g.items.length} {g.items.length === 1 ? "run" : "runs"}</span>
            </h3>
          )}
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
  const soon = rel === "Today" || rel === "Tomorrow" || /^In [1-6] days$/.test(rel);
  return (
    <Link href={runHref(run.slug)} className={`run-card group ${run.featured ? "is-featured" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="date-chip">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{d.weekday}</span>
          <span className="text-2xl font-black leading-none">{d.day}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{d.month}</span>
        </div>
        <span className={`rel-badge ${soon ? "is-soon" : ""}`}>{rel}</span>
      </div>
      <p className="mt-4 text-xl font-extrabold leading-snug tracking-tight">{run.title}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm opacity-70">
        <svg width="11" height="13" viewBox="0 0 12 14" aria-hidden><path d="M6 13.5S1 8.6 1 5.5a5 5 0 0 1 10 0c0 3.1-5 8-5 8Z" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
        {placeLabel(run) ?? "Venue not announced"}
        {away !== null && <span title="Straight-line distance to the area"> · {formatDistance(away)} away</span>}
      </p>
      <div className="mt-auto flex items-center justify-between pt-5">
        <RegisterToggle slug={run.slug} />
        <span className="arrow" aria-hidden>→</span>
      </div>
      {run.featured && <span className="featured-tag">Featured</span>}
    </Link>
  );
}

/* ---------- List ---------- */

function ListTable({ runs, now, distanceOf }: ListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
      <div className="hidden grid-cols-[130px_1fr_220px_120px_150px] gap-4 border-b border-ink-100 bg-ink-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-500 md:grid">
        <span>Date</span><span>Run</span><span>Area</span><span>When</span><span className="text-right">My runs</span>
      </div>
      <ul className="divide-y divide-ink-100">
        {runs.map((r) => {
          const d = dayParts(r.date);
          return (
            <li key={r.slug}>
              <Link href={runHref(r.slug)} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-ink-50 md:grid-cols-[130px_1fr_220px_120px_150px]">
                <span className="col-span-2 font-mono text-xs text-ink-500 md:col-span-1 md:text-sm md:text-ink-700">{d.weekday} {String(d.day).padStart(2, "0")} {d.month} ’{String(d.year).slice(2)}</span>
                <span className="font-bold">{r.title}{r.featured && <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wider text-brand-500">Featured</span>}</span>
                <span className="hidden text-sm text-ink-500 md:block">{placeLabel(r) ?? "Not announced"}{distanceOf(r) !== null && ` · ${formatDistance(distanceOf(r)!)}`}</span>
                <span className="hidden text-sm text-ink-500 md:block">{relativeDay(r.date, now)}</span>
                <span className="row-span-2 justify-self-end md:row-span-1"><RegisterToggle slug={r.slug} /></span>
                <span className="text-sm text-ink-500 md:hidden">{placeLabel(r) ?? "Venue not announced"} · {relativeDay(r.date, now)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Map ---------- */

function MapBlock({ runs, origin }: { runs: Run[]; origin: LatLng | null }) {
  const mapped = runs.filter((r) => r.location);
  const unmapped = runs.filter((r) => !r.location);
  const Item = ({ r }: { r: Run }) => (
    <li><Link href={runHref(r.slug)} className="flex gap-3 py-2 hover:text-brand-600">
      <span className="w-12 shrink-0 font-mono text-xs leading-5 text-ink-500">{dayParts(r.date).day} {dayParts(r.date).month}</span>
      <span><span className="font-semibold">{r.title}</span>{r.area && <span className="block text-xs text-ink-500">{r.area}</span>}</span>
    </Link></li>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <LazyMap runs={mapped} origin={origin} height="h-[62vh] min-h-[380px]" />
      <aside className="rounded-2xl border border-ink-200 bg-white p-5 text-sm lg:max-h-[62vh] lg:overflow-auto">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">On the map · {mapped.length}</h3>
        <ul className="mb-5 mt-1 divide-y divide-ink-100">{mapped.map((r) => <Item key={r.slug} r={r} />)}</ul>
        {unmapped.length > 0 && <>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Venue not announced yet · {unmapped.length}</h3>
          <ul className="mt-1 divide-y divide-ink-100">{unmapped.map((r) => <Item key={r.slug} r={r} />)}</ul>
        </>}
      </aside>
    </div>
  );
}

/* ---------- My runs ---------- */

function MyRuns({ runs, now }: { runs: Run[]; now: Date }) {
  if (!runs.length) {
    return (
      <div className="my-empty">
        <p className="text-xl font-extrabold tracking-tight">Your race season lives here.</p>
        <p className="mx-auto mt-2 max-w-md text-ink-500">Tap <span className="font-semibold text-ink-900">“I’m registered”</span> on any run and it shows up here with a countdown. Nothing to sign up for.</p>
        <a href="#upcoming" className="btn btn-primary mt-5">Browse runs</a>
      </div>
    );
  }
  const upcoming = runs.filter((r) => !isPast(r, now));
  const done = runs.filter((r) => isPast(r, now));
  return (
    <div className="space-y-6">
      <ol className="relative space-y-3 border-l-2 border-ink-900 pl-6">
        {upcoming.map((r) => (
          <li key={r.slug} className="relative">
            <span className="absolute -left-[33px] top-5 h-4 w-4 rounded-full border-2 border-ink-900 bg-volt" aria-hidden />
            <Link href={runHref(r.slug)} className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-ink-950 p-5 text-white hover:bg-ink-900">
              <span className="font-mono text-sm text-volt">{formatShort(r.date)}</span>
              <span className="flex-1 text-lg font-extrabold">{r.title}</span>
              <span className="text-sm text-white/60">{relativeDay(r.date, now)}</span>
              <RegisterToggle slug={r.slug} />
            </Link>
          </li>
        ))}
      </ol>
      {done.length > 0 && <p className="text-sm text-ink-500">Finished: {done.map((r) => r.title).join(", ")}</p>}
    </div>
  );
}
