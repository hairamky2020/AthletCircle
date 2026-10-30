"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Run } from "@/data/schema";
import { istDate } from "@/lib/dates";
import { formatMonth, monthKey, runHref } from "@/lib/runs";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const shiftMonth = (key: string, by: number) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
};

/** Month grid, Monday first. Weekends are shaded since most runs fall on them. */
export function CalendarGrid({ runs, today, initialMonth }: { runs: Run[]; today: Date; initialMonth?: string }) {
  const todayKey = istDate(today);
  const [month, setMonth] = useState(initialMonth ?? todayKey.slice(0, 7));
  useEffect(() => { if (initialMonth) setMonth(initialMonth); }, [initialMonth]);

  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7) cells.push(null);

  const byDay = new Map<string, Run[]>();
  for (const r of runs) byDay.set(r.date, [...(byDay.get(r.date) ?? []), r]);
  const inMonth = runs.filter((r) => monthKey(r.date) === month);
  const months = [...new Set(runs.map((r) => monthKey(r.date)))].sort();
  const canPrev = months.some((k) => k < month);
  const canNext = months.some((k) => k > month);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between border-b border-ink-900 pb-2">
        <h2 className="text-2xl font-bold tracking-tight">{formatMonth(month)}</h2>
        <div className="flex items-center gap-2">
          <span className="mr-2 font-mono text-xs text-ink-500">{inMonth.length} {inMonth.length === 1 ? "run" : "runs"}</span>
          <button className="btn btn-ghost !px-3 !py-1" onClick={() => setMonth(shiftMonth(month, -1))} disabled={!canPrev} aria-label="Previous month">←</button>
          <button className="btn btn-ghost !px-3 !py-1" onClick={() => setMonth(shiftMonth(month, 1))} disabled={!canNext} aria-label="Next month">→</button>
        </div>
      </div>

      {/* Grid on wider screens */}
      <div className="hidden grid-cols-7 border-l border-t border-line md:grid" role="grid" aria-label={formatMonth(month)}>
        {WEEKDAYS.map((d) => <div key={d} className="border-b border-r border-line px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-500">{d}</div>)}
        {cells.map((day, i) => {
          const list = day ? byDay.get(day) ?? [] : [];
          const weekend = i % 7 >= 5;
          return (
            <div key={i} className={`min-h-[104px] border-b border-r border-line p-1.5 ${weekend ? "bg-ink-50" : "bg-white/40"} ${day === todayKey ? "outline outline-2 -outline-offset-2 outline-brand-500" : ""}`}>
              {day && <span className={`text-xs ${list.length ? "font-bold" : "text-ink-400"}`}>{Number(day.slice(8))}</span>}
              <ul className="mt-1 space-y-1">
                {list.map((r) => (
                  <li key={r.slug}>
                    <Link href={runHref(r.slug)} className="block rounded-sm bg-ink-900 px-1.5 py-1 text-[12px] leading-tight text-white hover:bg-brand-600">{r.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Agenda on phones */}
      <ul className="md:hidden">
        {inMonth.length === 0 && <li className="py-6 text-sm text-ink-500">No runs this month.</li>}
        {inMonth.map((r) => (
          <li key={r.slug} className="border-b border-line">
            <Link href={runHref(r.slug)} className="flex gap-4 py-3">
              <span className="w-16 shrink-0 font-mono text-sm text-ink-500">{new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", weekday: "short", day: "numeric" }).format(new Date(`${r.date}T00:00:00Z`))}</span>
              <span className="font-semibold">{r.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
