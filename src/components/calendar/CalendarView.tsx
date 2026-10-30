"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EventSummary } from "@/lib/event-types";
import { istDate, addDays, formatShortDate } from "@/lib/dates";
import { haversineMetres, formatDistance } from "@/lib/geo";
import { sportTree } from "@/data/sports";
import { useLocation } from "@/components/location/LocationProvider";

type View = "month" | "week" | "list";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Month / week / list calendar with sport, city and "near me" filters, weekends and registration deadlines highlighted. */
export function CalendarView({ events, sports, cities }: {
  events: EventSummary[]; sports: { slug: string; name: string }[]; cities: { path: string; name: string }[];
}) {
  const { location, openPicker } = useLocation();
  const [today, setToday] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null); // any date inside the shown month/week
  const [view, setView] = useState<View>("month");
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [nearKm, setNearKm] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const t = istDate(new Date());
    setToday(t); setCursor(t);
    if (window.matchMedia("(max-width: 640px)").matches) setView("list");
  }, []);

  const filtered = useMemo(() => {
    const tree = sport ? sportTree(sport) : null;
    return events.filter((e) => (!tree || tree.has(e.sport)) && (!city || e.cityPath === city) && (!nearKm || !location || haversineMetres(location, e) <= nearKm * 1000));
  }, [events, sport, city, nearKm, location]);

  // Index events and registration deadlines by IST day (multi-day events appear on each day).
  const byDay = useMemo(() => {
    const m = new Map<string, { events: EventSummary[]; deadlines: EventSummary[] }>();
    const slot = (d: string) => { if (!m.has(d)) m.set(d, { events: [], deadlines: [] }); return m.get(d)!; };
    for (const e of filtered) {
      const s = istDate(new Date(e.start));
      const end = istDate(new Date(e.end ?? e.start));
      for (let d = s, i = 0; d <= end && i < 31; d = addDays(d, 1), i++) slot(d).events.push(e);
      if (e.regCloses && e.status === "scheduled") slot(istDate(new Date(e.regCloses))).deadlines.push(e);
    }
    return m;
  }, [filtered]);

  if (!today || !cursor) return <div className="h-96 animate-pulse rounded-2xl bg-ink-100" />;

  const [y, mo] = cursor.split("-").map(Number);
  const monthStart = `${y}-${String(mo).padStart(2, "0")}-01`;
  const dowIdx = (d: string) => (new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7; // Mon = 0
  const gridStart = addDays(monthStart, -dowIdx(monthStart));
  const weekStart = addDays(cursor, -dowIdx(cursor));
  const days = view === "month" ? Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)) : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const listDays = [...byDay.keys()].filter((d) => d >= today).sort().slice(0, 60);

  const move = (dir: number) => {
    if (view === "week") setCursor(addDays(cursor, 7 * dir));
    else { const d = new Date(Date.UTC(y, mo - 1 + dir, 1)); setCursor(d.toISOString().slice(0, 10)); }
  };
  const label = view === "week" ? `Week of ${formatShortDate(new Date(`${weekStart}T06:30:00Z`))}` : `${MONTHS[mo - 1]} ${y}`;
  const isWeekend = (d: string) => dowIdx(d) >= 5;

  const dayCell = (d: string) => {
    const info = byDay.get(d);
    const inMonth = view === "week" || d.slice(0, 7) === monthStart.slice(0, 7);
    return (
      <button key={d} onClick={() => setSelected(d)} aria-label={`${d}: ${info?.events.length ?? 0} events`}
        className={`flex min-h-[92px] flex-col items-stretch gap-1 border-b border-r border-ink-100 p-1.5 text-left align-top transition hover:bg-ink-50 ${inMonth ? "bg-white" : "bg-ink-50/60 text-ink-400"} ${isWeekend(d) && inMonth ? "bg-brand-50/40" : ""} ${selected === d ? "ring-2 ring-inset ring-ink-900" : ""}`}>
        <span className={`self-start rounded-full px-1.5 text-xs font-semibold ${d === today ? "bg-brand-500 text-white" : ""}`}>{Number(d.slice(8))}</span>
        {info?.events.slice(0, 3).map((e) => (
          <span key={e.slug} className="truncate rounded px-1 py-0.5 text-[11px] font-medium" style={{ background: e.colour + "1f", color: "#1f2a3d" }}>{e.icon} {e.title}</span>
        ))}
        {(info?.events.length ?? 0) > 3 && <span className="text-[11px] text-ink-500">+{info!.events.length - 3} more</span>}
        {(info?.deadlines.length ?? 0) > 0 && <span className="text-[11px] font-semibold text-amber-700">⏰ {info!.deadlines.length} reg. closing</span>}
      </button>
    );
  };

  const dayList = (d: string) => {
    const info = byDay.get(d);
    if (!info) return <p className="text-sm text-ink-500">No events on this day.</p>;
    return (
      <ul className="space-y-2">
        {info.events.map((e) => (
          <li key={e.slug}><Link href={`/events/${e.slug}/`} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-ink-100 hover:ring-ink-300">
            <span className="text-xl" aria-hidden>{e.icon}</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{e.title}</span>
              <span className="text-sm text-ink-500">{e.venueName}, {e.cityName}{location ? ` · ${formatDistance(haversineMetres(location, e))} (straight-line)` : ""}</span></span>
          </Link></li>
        ))}
        {info.deadlines.map((e) => (
          <li key={"d" + e.slug} className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">⏰ Registration closes: <Link className="font-semibold underline" href={`/events/${e.slug}/`}>{e.title}</Link></li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Sport" className="chip !pr-8" value={sport} onChange={(e) => setSport(e.target.value)}>
          <option value="">All sports</option>{sports.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
        <select aria-label="City" className="chip !pr-8" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">All cities</option>{cities.map((c) => <option key={c.path} value={c.path}>{c.name}</option>)}
        </select>
        {location ? (
          <select aria-label="Near me" className="chip !pr-8" value={nearKm} onChange={(e) => setNearKm(Number(e.target.value))}>
            <option value={0}>Any distance</option>{[10, 25, 50, 100, 200].map((r) => <option key={r} value={r}>Within {r} KM of {location.label}</option>)}
          </select>
        ) : <button className="chip" onClick={openPicker}>📍 Near me</button>}
        <div className="ml-auto flex overflow-hidden rounded-lg border border-ink-200 text-sm" role="group" aria-label="Calendar view">
          {(["month", "week", "list"] as View[]).map((v) => (
            <button key={v} className={`px-3 py-1.5 capitalize ${view === v ? "bg-ink-900 text-white" : "bg-white"}`} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
      </div>

      {view !== "list" ? (
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <button className="btn btn-ghost !px-3 !py-1.5" onClick={() => move(-1)} aria-label="Previous">←</button>
              <button className="btn btn-ghost !px-3 !py-1.5 text-sm" onClick={() => { setCursor(today); setSelected(today); }}>Today</button>
              <button className="btn btn-ghost !px-3 !py-1.5" onClick={() => move(1)} aria-label="Next">→</button>
              <h2 className="ml-2 text-lg font-bold">{label}</h2>
            </div>
            <div className="overflow-hidden rounded-2xl border-l border-t border-ink-100">
              <div className="grid grid-cols-7 bg-ink-50 text-center text-xs font-semibold text-ink-500">{DOW.map((d) => <div key={d} className="border-b border-r border-ink-100 py-2">{d}</div>)}</div>
              <div className="grid grid-cols-7">{days.map(dayCell)}</div>
            </div>
            <p className="mt-2 text-xs text-ink-500">Weekends are shaded. ⏰ marks registration deadlines.</p>
          </div>
          <div>
            <h3 className="mb-3 font-bold">{selected ? formatShortDate(new Date(`${selected}T06:30:00Z`)) : "Pick a day"}</h3>
            {selected ? dayList(selected) : <p className="text-sm text-ink-500">Select a date to see its events and deadlines.</p>}
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {listDays.length === 0 && <p className="rounded-2xl bg-white p-6 text-ink-600 ring-1 ring-ink-100">No upcoming events match these filters.</p>}
          {listDays.map((d) => (
            <section key={d}>
              <h3 className={`mb-2 text-sm font-bold uppercase tracking-wide ${isWeekend(d) ? "text-brand-600" : "text-ink-500"}`}>
                {formatShortDate(new Date(`${d}T06:30:00Z`))}{d === today ? " · Today" : isWeekend(d) ? " · Weekend" : ""}
              </h3>
              {dayList(d)}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
