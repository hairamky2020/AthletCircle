"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Run } from "@/data/schema";
import { istDate } from "@/lib/dates";
import { dayParts, monthKey, placeLabel, relativeDay, runHref } from "@/lib/runs";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const monthName = (key: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", month: "long" }).format(new Date(`${key}-01T00:00:00Z`));
const monthShort = (key: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", month: "short" }).format(new Date(`${key}-01T00:00:00Z`));

/**
 * Race-day calendar: a month strip to jump between months, a poster-sized month with a mini grid
 * where race days light up, and the month's race days as big date tiles.
 */
export function CalendarGrid({ runs, today, initialMonth }: { runs: Run[]; today: Date; initialMonth?: string }) {
  const todayKey = istDate(today);
  const months = [...new Set(runs.map((r) => monthKey(r.date)))].sort();
  const [month, setMonth] = useState(initialMonth ?? months[0] ?? todayKey.slice(0, 7));
  useEffect(() => { if (initialMonth) setMonth(initialMonth); }, [initialMonth]);

  const [y, m] = month.split("-").map(Number);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const byDay = new Map<string, Run[]>();
  for (const r of runs) byDay.set(r.date, [...(byDay.get(r.date) ?? []), r]);
  const raceDays = [...byDay.keys()].filter((d) => monthKey(d) === month).sort();
  const count = raceDays.reduce((n, d) => n + byDay.get(d)!.length, 0);
  const idx = months.indexOf(month);

  return (
    <div className="cal">
      {/* Month strip */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="tablist" aria-label="Months">
        {months.map((k) => {
          const n = runs.filter((r) => monthKey(r.date) === k).length;
          return (
            <button key={k} role="tab" aria-selected={k === month} onClick={() => setMonth(k)} className="cal-month">
              <span className="text-lg font-black italic uppercase leading-none">{monthShort(k)}</span>
              <span className="text-[11px] font-semibold opacity-70">’{k.slice(2, 4)} · {n} {n === 1 ? "run" : "runs"}</span>
            </button>
          );
        })}
      </div>

      <div className="cal-stage">
        {/* Poster side */}
        <div className="cal-poster">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-white/70">{y}</p>
          <h3 className="cal-poster-month">{monthName(month)}</h3>
          <p className="mt-2 text-white/85"><span className="text-4xl font-black italic">{count}</span> {count === 1 ? "run" : "runs"} on {raceDays.length} race {raceDays.length === 1 ? "day" : "days"}</p>
          <div className="mt-6 grid grid-cols-7 gap-1.5 text-center" role="grid" aria-label={`${monthName(month)} ${y}`}>
            {WEEKDAYS.map((d, i) => <span key={i} className="text-[10px] font-bold text-white/50">{d}</span>)}
            {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
            {Array.from({ length: days }, (_, i) => {
              const key = `${month}-${String(i + 1).padStart(2, "0")}`;
              const n = byDay.get(key)?.length ?? 0;
              return (
                <a key={key} href={n ? `#day-${key}` : undefined} aria-label={n ? `${i + 1}: ${n} runs` : undefined}
                  className={`cal-dot ${n ? "has-runs" : ""} ${key === todayKey ? "is-today" : ""}`}
                  onClick={(e) => { if (!n) return; e.preventDefault(); document.getElementById(`day-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
                  {i + 1}{n > 1 && <sup>{n}</sup>}
                </a>
              );
            })}
          </div>
          <div className="mt-6 flex gap-2">
            <button className="cal-nav" disabled={idx <= 0} onClick={() => setMonth(months[idx - 1])} aria-label="Previous month">←</button>
            <button className="cal-nav" disabled={idx < 0 || idx >= months.length - 1} onClick={() => setMonth(months[idx + 1])} aria-label="Next month">→</button>
          </div>
        </div>

        {/* Race days */}
        <ol className="cal-days">
          {raceDays.length === 0 && <li className="p-6 text-ink-500">No runs this month.</li>}
          {raceDays.map((d) => {
            const p = dayParts(d);
            const list = byDay.get(d)!;
            return (
              <li key={d} id={`day-${d}`} className="cal-day">
                <div className="cal-day-date">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-500">{p.weekday}</span>
                  <span className="text-5xl font-black italic leading-none tracking-tighter">{p.day}</span>
                  <span className="mt-1 text-[11px] font-semibold text-ink-500">{relativeDay(d, today)}</span>
                </div>
                <ul className="flex-1 space-y-2">
                  {list.map((r) => (
                    <li key={r.slug}>
                      <Link href={runHref(r.slug)} className="cal-run group">
                        <span className="min-w-0">
                          <span className="block truncate font-extrabold">{r.title}</span>
                          <span className="block truncate text-xs text-ink-500">{placeLabel(r) ?? "Venue not announced"}</span>
                        </span>
                        <span className="cal-run-arrow" aria-hidden>→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
