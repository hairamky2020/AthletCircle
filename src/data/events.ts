// Event repository for the static site. Today it reads content/*.json at build time; later it can be
// swapped for an API or database without changing pages (they only use these functions).
import rawEvents from "../../content/events.json";
import rawOrganisers from "../../content/organisers.json";
import { eventSchema, organiserSchema, type EventRecord, type OrganiserRecord } from "./schema";
import { demoEventRecords, demoOrganiserRecords } from "./demo";
import { getSport, rootSport, sportTree } from "./sports";
import { getPlace } from "./locations";
import type { EventSummary } from "@/lib/event-types";

export const SHOW_DEMO = process.env.NEXT_PUBLIC_SHOW_DEMO !== "false";

function load(): { events: EventRecord[]; organisers: OrganiserRecord[] } {
  const errors: string[] = [];
  const events: EventRecord[] = [];
  const input = [...(rawEvents as unknown[]), ...(SHOW_DEMO ? demoEventRecords() : [])];
  input.forEach((raw, i) => {
    const r = eventSchema.safeParse(raw);
    if (!r.success) {
      errors.push(`content/events.json #${i} (${(raw as { slug?: string })?.slug ?? "?"}): ${r.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`);
      return;
    }
    const e = r.data;
    if (!getSport(e.sport)) errors.push(`${e.slug}: unknown sport "${e.sport}"`);
    if (!getPlace(e.venue.city)) errors.push(`${e.slug}: unknown city "${e.venue.city}"`);
    if (e.venue.locality && !getPlace(`${e.venue.city}/${e.venue.locality}`)) errors.push(`${e.slug}: unknown locality "${e.venue.locality}"`);
    if (e.end && Date.parse(e.end) < Date.parse(e.start)) errors.push(`${e.slug}: end is before start`);
    events.push(e);
  });
  const slugs = new Set<string>();
  for (const e of events) {
    if (slugs.has(e.slug)) errors.push(`duplicate slug "${e.slug}"`);
    slugs.add(e.slug);
  }
  const organisers = [...(rawOrganisers as unknown[]), ...(SHOW_DEMO ? demoOrganiserRecords() : [])].map((o, i) => {
    const r = organiserSchema.safeParse(o);
    if (!r.success) errors.push(`content/organisers.json #${i}: ${r.error.message}`);
    return r.data!;
  }).filter(Boolean);
  if (errors.length) throw new Error("Invalid event data:\n" + errors.join("\n"));
  return { events, organisers };
}

const data = load();

/** Public = verified, pin confirmed. Unverified records stay in the file but are never shown. */
export const isPublic = (e: EventRecord) => e.verification.verified && e.venue.pinVerified;

export const ALL_EVENTS = data.events;
export const PUBLIC_EVENTS = data.events.filter(isPublic).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
export const ORGANISERS = data.organisers;

const orgBySlug = new Map(ORGANISERS.map((o) => [o.slug, o]));
export const getOrganiser = (slug: string) => orgBySlug.get(slug) ?? null;

export function toSummary(e: EventRecord): EventSummary {
  const sport = getSport(e.sport)!;
  const root = rootSport(e.sport)!;
  const city = getPlace(e.venue.city)!;
  const loc = e.venue.locality ? getPlace(`${e.venue.city}/${e.venue.locality}`) : null;
  return {
    slug: e.slug, title: e.title, sport: e.sport, sportName: sport.name, rootSport: root.slug, icon: sport.icon, colour: sport.colour,
    start: e.start, end: e.end ?? null, status: e.status,
    venueName: e.venue.name, localityName: loc?.name ?? null, cityPath: city.path, cityName: city.name,
    statePath: city.path.split("/").slice(0, 2).join("/"),
    lat: e.venue.lat, lng: e.venue.lng,
    regOpens: e.registrationOpens ?? null, regCloses: e.registrationCloses ?? null, registrationUrl: e.registrationUrl ?? null,
    isFree: e.isFree, priceMin: e.priceMin ?? null, priceMax: e.priceMax ?? null,
    featured: e.featured, demo: e.demo, level: e.level, ageMin: e.ageMin ?? null, ageMax: e.ageMax ?? null,
    organiserName: e.organiser ? orgBySlug.get(e.organiser)?.name ?? null : null,
    lastVerified: e.verification.lastVerified ?? null, added: e.added ?? null,
  };
}

export const PUBLIC_SUMMARIES: EventSummary[] = PUBLIC_EVENTS.map(toSummary);

const endOf = (e: { start: string; end?: string | null }) => Date.parse(e.end ?? e.start);

/** Upcoming (or ongoing) public events. */
export const upcoming = (now = Date.now()) => PUBLIC_SUMMARIES.filter((e) => endOf(e) >= now);

export function getEvent(slug: string) {
  return PUBLIC_EVENTS.find((e) => e.slug === slug) ?? null;
}

export function relatedEvents(e: EventRecord, limit = 6, now = Date.now()) {
  const tree = sportTree(rootSport(e.sport)!.slug);
  const here = { lat: e.venue.lat, lng: e.venue.lng };
  return upcoming(now)
    .filter((x) => x.slug !== e.slug && tree.has(x.sport) && x.status === "scheduled")
    .sort((a, b) => dist(a, here) - dist(b, here))
    .slice(0, limit);
}

function dist(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dx = (a.lng - b.lng) * Math.cos((a.lat * Math.PI) / 180);
  const dy = a.lat - b.lat;
  return dx * dx + dy * dy;
}

export function eventsByOrganiser(slug: string, now = Date.now()) {
  const all = PUBLIC_EVENTS.filter((e) => e.organiser === slug).map(toSummary);
  return { upcoming: all.filter((e) => endOf(e) >= now), past: all.filter((e) => endOf(e) < now).reverse() };
}

export function countBy<K extends string>(list: EventSummary[], key: (e: EventSummary) => K) {
  const m = new Map<K, number>();
  for (const e of list) m.set(key(e), (m.get(key(e)) ?? 0) + 1);
  return m;
}
