// Date and grouping helpers for runs. Run dates are calendar dates in IST (YYYY-MM-DD).
import { istDate } from "./dates";
import type { Run } from "@/data/schema";

const utc = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...o });
const weekdayShort = f({ weekday: "short" });
const weekdayLong = f({ weekday: "long" });
const monthShort = f({ month: "short" });
const monthYear = f({ month: "long", year: "numeric" });
const longDate = f({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDate = f({ weekday: "short", day: "numeric", month: "short" });

export const dayParts = (ymd: string) => ({
  weekday: weekdayShort.format(utc(ymd)),
  weekdayLong: weekdayLong.format(utc(ymd)),
  day: Number(ymd.slice(8, 10)),
  month: monthShort.format(utc(ymd)),
  year: Number(ymd.slice(0, 4)),
});
export const formatLong = (ymd: string) => longDate.format(utc(ymd));
export const formatShort = (ymd: string) => shortDate.format(utc(ymd));
export const monthKey = (ymd: string) => ymd.slice(0, 7);
export const formatMonth = (key: string) => monthYear.format(utc(`${key}-01`));

/** A run stays listed through its last day (IST). */
export const isPast = (run: Pick<Run, "date" | "endDate">, now: Date) => (run.endDate ?? run.date) < istDate(now);

export function groupByMonth<T extends Pick<Run, "date">>(runs: T[]) {
  const groups = new Map<string, T[]>();
  for (const r of runs) {
    const k = monthKey(r.date);
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return [...groups.entries()].map(([key, items]) => ({ key, label: formatMonth(key), items }));
}

/** "Today", "Tomorrow", "In 5 days", "In 3 weeks". */
export function relativeDay(ymd: string, now: Date) {
  const days = Math.round((utc(ymd).getTime() - utc(istDate(now)).getTime()) / 864e5);
  if (days < 0) return "Finished";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `In ${days} days`;
  if (days < 60) return `In ${Math.round(days / 7)} weeks`;
  return `In ${Math.round(days / 30)} months`;
}

export const placeLabel = (r: Pick<Run, "venue" | "area">) => r.venue ?? r.area ?? null;

/** Web search for the run's official page while we don't have a confirmed link. */
export const webSearchUrl = (r: Pick<Run, "title" | "date">) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${r.title} Hyderabad ${r.date.slice(0, 4)} registration`)}`;

export const runHref = (slug: string) => `/runs/${slug}`;

/** Event categories shown on the home page (from each run's "kind"). */
export const KINDS = {
  half: { label: "Half marathons", short: "21.1K", blurb: "The classic 21.1 km" },
  marathon: { label: "Marathons", short: "MARATHON", blurb: "Full distance and multi-distance" },
  ultra: { label: "Ultras", short: "ULTRA", blurb: "Beyond the marathon" },
  theme: { label: "Theme & fun runs", short: "FUN", blurb: "Colour, costumes and festivals" },
  cause: { label: "Runs for a cause", short: "CAUSE", blurb: "Health, safety and charity" },
  community: { label: "Community runs", short: "OPEN", blurb: "Local, friendly, open to all" },
} as const;
export type Kind = keyof typeof KINDS;
