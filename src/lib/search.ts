// Pure search/filter/sort over event summaries. Runs in the browser (search, map, near me)
// and on the server (landing pages), so results match everywhere.
import type { EventSummary } from "./event-types";
import { haversineMetres, type LatLng } from "./geo";
import { presetRange, istDayStart, addDays, type DatePreset } from "./dates";
import { registrationStatus } from "./registration";

export type Filters = {
  q?: string;
  sports?: Set<string>;          // sport tree (slug + descendants)
  city?: string;                 // city path
  state?: string;                // state path
  origin?: LatLng;
  radiusKm?: number;
  when?: DatePreset;
  from?: string;                 // YYYY-MM-DD
  to?: string;
  free?: boolean;
  open?: boolean;                // registration open now
  level?: string;
  age?: number;
  sort?: "nearest" | "date" | "recent" | "closing";
};

export type Hit = EventSummary & { distanceM: number | null };

export function searchEvents(all: EventSummary[], f: Filters, now = new Date()): Hit[] {
  let from = now.getTime();
  let to: number | null = null;
  if (f.from || f.to) {
    from = f.from ? istDayStart(f.from).getTime() : from;
    to = f.to ? istDayStart(addDays(f.to, 1)).getTime() : null;
  } else if (f.when) {
    const r = presetRange(f.when, now);
    from = r.from.getTime();
    to = r.to?.getTime() ?? null;
  }
  const q = f.q?.trim().toLowerCase();
  const out: Hit[] = [];
  for (const e of all) {
    const start = Date.parse(e.start);
    const end = Date.parse(e.end ?? e.start);
    if (end < from) continue;
    if (to != null && start >= to) continue;
    if (f.sports && !f.sports.has(e.sport)) continue;
    if (f.city && e.cityPath !== f.city) continue;
    if (f.state && e.statePath !== f.state) continue;
    if (f.free === true && !e.isFree) continue;
    if (f.level && e.level !== f.level) continue;
    if (f.age != null && ((e.ageMin != null && e.ageMin > f.age) || (e.ageMax != null && e.ageMax < f.age))) continue;
    if (f.open) {
      const s = registrationStatus(statusInput(e), now);
      if (s !== "open" && s !== "closing_soon") continue;
    }
    if (q) {
      const hay = `${e.title} ${e.sportName} ${e.cityName} ${e.localityName ?? ""} ${e.venueName} ${e.organiserName ?? ""}`.toLowerCase();
      if (!q.split(/\s+/).every((w) => hay.includes(w))) continue;
    }
    let distanceM: number | null = null;
    if (f.origin) {
      distanceM = haversineMetres(f.origin, e);
      if (f.radiusKm != null && distanceM > f.radiusKm * 1000) continue;
    }
    out.push({ ...e, distanceM });
  }
  const sort = f.sort ?? (f.origin ? "nearest" : "date");
  const byDate = (a: Hit, b: Hit) => Date.parse(a.start) - Date.parse(b.start);
  if (sort === "nearest" && f.origin) out.sort((a, b) => a.distanceM! - b.distanceM! || byDate(a, b));
  else if (sort === "recent") out.sort((a, b) => (b.added ?? "").localeCompare(a.added ?? "") || byDate(a, b));
  else if (sort === "closing") {
    const key = (e: Hit) => {
      const s = registrationStatus(statusInput(e), now);
      return (s === "open" || s === "closing_soon") && e.regCloses ? Date.parse(e.regCloses) : Infinity;
    };
    out.sort((a, b) => key(a) - key(b) || byDate(a, b));
  } else out.sort(byDate);
  return out;
}

export function statusInput(e: EventSummary) {
  return {
    state: e.status === "scheduled" ? "published" : e.status,
    regOpensAt: e.regOpens ? new Date(e.regOpens) : null,
    regClosesAt: e.regCloses ? new Date(e.regCloses) : null,
    startAt: new Date(e.end ?? e.start),
    registrationUrl: e.registrationUrl,
  };
}
