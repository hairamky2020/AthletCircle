"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Run } from "@/data/schema";
import { useLocation } from "@/components/location/LocationProvider";
import { LazyMap } from "@/components/map/LazyMap";
import { formatDistance, haversineMetres, type LatLng } from "@/lib/geo";
import { groupByMonth, isPast, monthKey, placeLabel, relativeDay, runHref, dayParts } from "@/lib/runs";
import { DateBlock } from "./DateBlock";
import { CalendarGrid } from "./CalendarGrid";
import type { View } from "./ViewTabs";

type Filters = { q: string; month: string; area: string; near: boolean };
const EMPTY: Filters = { q: "", month: "", area: "", near: false };
const NO_PLACE = "not-announced";

function readUrl(): Filters {
  const p = new URLSearchParams(window.location.search);
  return { q: p.get("q") ?? "", month: p.get("month") ?? "", area: p.get("area") ?? "", near: p.get("sort") === "nearest" };
}
function writeUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.month) p.set("month", f.month);
  if (f.area) p.set("area", f.area);
  if (f.near) p.set("sort", "nearest");
  const qs = p.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

const areaKey = (r: Run) => (r.area ? r.area.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : NO_PLACE);

/**
 * One component for all four views so filters behave the same everywhere.
 * Server render uses the build date; the browser re-checks with today's date so finished runs drop off.
 */
export function RunsExplorer({ runs, view, builtAt }: { runs: Run[]; view: View; builtAt: string }) {
  const [now, setNow] = useState(() => new Date(builtAt));
  const [f, setF] = useState<Filters>(EMPTY);
  const { location, openPicker } = useLocation();

  useEffect(() => { setNow(new Date()); setF(readUrl()); }, []);
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
      (view === "calendar" || !f.month || monthKey(r.date) === f.month) &&
      (!f.area || areaKey(r) === f.area));
    if (f.near && origin) list = [...list].sort((a, b) => (distanceOf(a) ?? Infinity) - (distanceOf(b) ?? Infinity));
    return list;
  }, [upcoming, f, view, origin?.lat, origin?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = f.q || f.month || f.area || f.near;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-3 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <input type="search" value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder="Search runs or areas" aria-label="Search runs or areas"
            className="field w-full sm:w-64" />
          <select value={f.area} onChange={(e) => update({ area: e.target.value })} aria-label="Area" className="field min-w-0 flex-1 sm:flex-none">
            <option value="">All areas</option>
            {areas.map((a) => <option key={a.key} value={a.key}>{a.label} ({a.count})</option>)}
          </select>
          {view !== "map" && view !== "calendar" && (
            <button className="chip" aria-pressed={f.near && !!origin} onClick={() => (origin ? update({ near: !f.near }) : (update({ near: true }), openPicker()))}>
              Nearest to me
            </button>
          )}
          {active && <button onClick={() => update(EMPTY)} className="text-sm text-ink-500 underline underline-offset-2 hover:text-ink-900">Clear</button>}
        </div>
        {view !== "calendar" && months.length > 1 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Month">
            <button className="chip" aria-pressed={!f.month} onClick={() => update({ month: "" })}>All months</button>
            {months.map((m) => (
              <button key={m.key} className="chip" aria-pressed={f.month === m.key} onClick={() => update({ month: f.month === m.key ? "" : m.key })}>
                {dayParts(`${m.key}-01`).month} ’{m.key.slice(2, 4)}
                <span className="font-mono text-xs opacity-60">· {m.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mb-3 text-sm text-ink-500" aria-live="polite">
        {shown.length === 0 ? "No runs match." : `${shown.length} ${shown.length === 1 ? "run" : "runs"}`}
        {f.near && origin && shown.length > 0 && <> · nearest to {location!.label} first</>}
      </p>

      {view === "months" && <MonthsView runs={shown} now={now} distanceOf={distanceOf} sorted={f.near && !!origin} />}
      {view === "list" && <ListView runs={shown} now={now} distanceOf={distanceOf} />}
      {view === "calendar" && <CalendarGrid runs={shown} today={now} initialMonth={f.month || months[0]?.key} />}
      {view === "map" && <MapView runs={shown} origin={origin} />}
    </div>
  );
}

type RowProps = { runs: Run[]; now: Date; distanceOf: (r: Run) => number | null };

function Away({ m }: { m: number | null }) {
  if (m === null) return null;
  return <span title="Straight-line distance to the area, not road distance">{formatDistance(m)} away</span>;
}

function MonthsView({ runs, now, distanceOf, sorted }: RowProps & { sorted: boolean }) {
  if (!runs.length) return null;
  // When sorted by distance, a single list reads better than month groups.
  const groups = sorted ? [{ key: "all", label: "", items: runs }] : groupByMonth(runs);
  return (
    <div className="space-y-12">
      {groups.map((g) => (
        <section key={g.key} aria-label={g.label || "Runs"}>
          {g.label && (
            <h2 className="mb-1 flex items-baseline justify-between border-b border-ink-900 pb-2">
              <span className="text-2xl font-bold tracking-tight">{g.label}</span>
              <span className="font-mono text-xs text-ink-500">{g.items.length} {g.items.length === 1 ? "run" : "runs"}</span>
            </h2>
          )}
          <ul>
            {g.items.map((r) => (
              <li key={r.slug} className="border-b border-line">
                <Link href={runHref(r.slug)} className="group flex items-center gap-4 py-4">
                  <DateBlock date={r.date} />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold leading-snug group-hover:text-brand-600">
                      {r.title}
                      {r.featured && <span className="ml-2 align-middle font-mono text-[10px] uppercase tracking-wider text-brand-600">Featured</span>}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-500">
                      {placeLabel(r) ?? "Venue not announced"}
                      {distanceOf(r) !== null && <> · <Away m={distanceOf(r)} /></>}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-sm text-ink-500 sm:block">{relativeDay(r.date, now)}</span>
                  <span className="shrink-0 text-ink-300 group-hover:text-ink-900" aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ListView({ runs, now, distanceOf }: RowProps) {
  if (!runs.length) return null;
  return (
    <div className="border-t border-ink-900">
      <div className="hidden grid-cols-[120px_1fr_200px_110px] gap-4 border-b border-line py-2 font-mono text-[11px] uppercase tracking-wider text-ink-500 md:grid">
        <span>Date</span><span>Run</span><span>Area</span><span className="text-right">When</span>
      </div>
      <ul>
        {runs.map((r) => {
          const d = dayParts(r.date);
          return (
            <li key={r.slug} className="border-b border-line">
              <Link href={runHref(r.slug)} className="grid grid-cols-[88px_1fr] gap-x-4 gap-y-0.5 py-3 hover:bg-ink-50 md:grid-cols-[120px_1fr_200px_110px] md:items-center">
                <span className="font-mono text-sm text-ink-700">{d.weekday} {String(d.day).padStart(2, "0")} {d.month}{d.year !== now.getFullYear() ? ` ’${String(d.year).slice(2)}` : ""}</span>
                <span className="font-semibold">{r.title}</span>
                <span className="col-start-2 text-sm text-ink-500 md:col-start-auto">
                  {placeLabel(r) ?? "Not announced"}{distanceOf(r) !== null && <> · <Away m={distanceOf(r)} /></>}
                </span>
                <span className="col-start-2 text-sm text-ink-500 md:col-start-auto md:text-right">{relativeDay(r.date, now)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MapView({ runs, origin }: { runs: Run[]; origin: LatLng | null }) {
  const mapped = runs.filter((r) => r.location);
  const unmapped = runs.filter((r) => !r.location);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <LazyMap runs={mapped} origin={origin} height="h-[60vh] min-h-[380px]" />
        <p className="mt-2 text-xs text-ink-500">Pins mark the announced area, not the exact start line. Numbers show several runs in one area.</p>
      </div>
      <aside>
        <h2 className="eyebrow mb-2">On the map ({mapped.length})</h2>
        <ul className="mb-6 border-t border-line text-sm">
          {mapped.map((r) => (
            <li key={r.slug} className="border-b border-line py-2">
              <Link href={runHref(r.slug)} className="hover:text-brand-600"><span className="mr-2 font-mono text-xs text-ink-500">{dayParts(r.date).day} {dayParts(r.date).month}</span>{r.title}</Link>
              <span className="block pl-[52px] text-xs text-ink-500">{r.area}</span>
            </li>
          ))}
        </ul>
        {unmapped.length > 0 && (
          <>
            <h2 className="eyebrow mb-2">Venue not announced yet ({unmapped.length})</h2>
            <ul className="border-t border-line text-sm">
              {unmapped.map((r) => (
                <li key={r.slug} className="border-b border-line py-2">
                  <Link href={runHref(r.slug)} className="hover:text-brand-600"><span className="mr-2 font-mono text-xs text-ink-500">{dayParts(r.date).day} {dayParts(r.date).month}</span>{r.title}</Link>
                  {r.area && <span className="block pl-[52px] text-xs text-ink-500">{r.area}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  );
}
