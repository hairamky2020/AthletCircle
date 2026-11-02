/** Free-text search: turns "any 10k runs in december under 800 for kids" into filters. Runs fully in the browser; no AI service. */
import type { Run } from "@/data/schema";

const STOP = new Set("i im i'm want wanna to know show me find looking for look any some all the a an of in on at near around hyderabad hyd run runs running race races event events marathons is are there what which please can you do have give list upcoming with and or my this that".split(" "));
const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
export type Parsed = { words: string[]; dist: string[]; month?: number; weekend?: boolean; nextMonth?: boolean; maxFee?: number; kids?: boolean; cause?: boolean; trail?: boolean; timed?: boolean; summary: string[] };

export function parseQuery(q: string, now: Date): Parsed {
  let s = " " + q.toLowerCase().replace(/[,?!.]/g, " ") + " ";
  const p: Parsed = { words: [], dist: [], summary: [] };
  const take = (re: RegExp) => { const m = s.match(re); if (m) s = s.replace(re, " "); return m; };
  const fee = take(/(?:under|below|less than|within|upto|up to|max|<)\s*(?:rs\.?|₹|inr)?\s*(\d{2,5})/);
  if (fee) { p.maxFee = +fee[1]; p.summary.push(`fee up to ₹${p.maxFee}`); }
  if (take(/\b(half marathon|half|21(?:\.1)?\s?k(?:m)?)\b/)) p.dist.push("21.1K");
  if (take(/\b(full marathon|42(?:\.2)?\s?k(?:m)?)\b/)) p.dist.push("42.2K");
  for (const m of s.matchAll(/\b(\d{1,2})\s?k(?:m|ms)?\b/g)) p.dist.push(m[1] + "K");
  s = s.replace(/\b\d{1,2}\s?k(?:m|ms)?\b/g, " ");
  if (p.dist.length) p.summary.push(p.dist.join(" / "));
  if (take(/\b(trail|ultra|forest|off ?road)\b/)) { p.trail = true; p.summary.push("trail & ultra"); }
  if (take(/\b(kids?|children|child|family|families)\b/)) { p.kids = true; p.summary.push("family friendly"); }
  if (take(/\b(charity|cause|awareness|fundrais\w*)\b/)) { p.cause = true; p.summary.push("for a cause"); }
  if (take(/\b(timed|pb|personal best)\b/)) { p.timed = true; p.summary.push("timed"); }
  if (take(/\b(this )?(weekend|sunday|saturday)\b/)) { p.weekend = true; p.summary.push("this weekend"); }
  if (take(/\bnext month\b/)) { p.nextMonth = true; p.month = (now.getMonth() + 1) % 12; p.summary.push(MONTHS[p.month].replace(/^./, (c) => c.toUpperCase())); }
  else if (take(/\bthis month\b/)) { p.month = now.getMonth(); p.summary.push(MONTHS[p.month].replace(/^./, (c) => c.toUpperCase())); }
  else { const m = take(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/); if (m) { p.month = MONTHS.indexOf(m[1]); p.summary.push(m[0].trim().replace(/^./, (c) => c.toUpperCase())); } }
  p.words = s.split(/\s+/).filter((w) => w && !STOP.has(w) && w.length > 1);
  return p;
}

const feeMin = (r: Run) => {
  const n = (r.details?.categories ?? []).map((c) => c.fee?.match(/₹\s?([\d,]+)/)?.[1]).filter(Boolean).map((x) => +x!.replace(/,/g, ""));
  if (n.length) return Math.min(...n);
  const m = r.details?.overview?.match(/from ₹\s?([\d,]+)/); return m ? +m[1].replace(/,/g, "") : null;
};
const blob = (r: Run) => JSON.stringify([r.title, r.area, r.venue, r.note, r.details?.overview, r.details?.categories, r.details?.eligibility]).toLowerCase();

export function matchesParsed(r: Run, p: Parsed, inWeekend: (d: string) => boolean): boolean {
  const b = blob(r);
  if (p.words.length && !p.words.every((w) => b.includes(w))) return false;
  if (p.dist.length && !p.dist.some((d) => r.distances.includes(d))) return false;
  if (p.month != null && new Date(r.date + "T00:00:00").getMonth() !== p.month) return false;
  if (p.weekend && !inWeekend(r.date)) return false;
  if (p.maxFee != null) { const f = feeMin(r); if (f == null || f > p.maxFee) return false; }
  if (p.trail && !(r.kind === "ultra" || /trail|ultra|forest/.test(b))) return false;
  if (p.kids && !/kid|family|fun run|children|walk/.test(b)) return false;
  if (p.cause && !(r.kind === "cause" || /cause|charity|awareness|health|society|against/.test(b))) return false;
  if (p.timed && !/timed/.test(b.replace(/not timed/g, ""))) return false;
  return true;
}
