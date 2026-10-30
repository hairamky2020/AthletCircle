// Import events from a CSV (Excel → Save as CSV) into content/events.json.
// Usage: npm run import:csv -- path/to/events.csv [--dry-run]
// Columns: see content/templates/events-template.csv. Rows are upserted by slug (title + year).
// Each row is validated; invalid rows are reported and skipped. Nothing is published unless
// verified=true AND pin_verified=true.
import { readFileSync, writeFileSync } from "node:fs";
import Papa from "papaparse";
import { eventSchema, type EventInput } from "../src/data/schema";
import { getSport } from "../src/data/sports";
import { getPlace, allCities } from "../src/data/locations";

const [file] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dry = process.argv.includes("--dry-run");
if (!file) { console.error("Usage: npm run import:csv -- events.csv [--dry-run]"); process.exit(1); }

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const n = (s?: string) => (s && s.trim() !== "" ? Number(s) : undefined);
const b = (s?: string) => /^(true|yes|y|1)$/i.test((s ?? "").trim());
const t = (s?: string) => (s && s.trim() ? s.trim() : undefined);
const dt = (d?: string, time?: string) => (t(d) ? `${d!.trim()}T${t(time) ?? "06:00"}:00+05:30` : undefined);

function cityPath(v: string): string {
  const s = v.trim();
  if (getPlace(s)) return s;
  const hit = allCities().find((c) => c.name.toLowerCase() === s.toLowerCase() || c.aliases.some((a) => a.toLowerCase() === s.toLowerCase()));
  return hit?.path ?? s;
}

const rows = Papa.parse<Record<string, string>>(readFileSync(file, "utf8"), { header: true, skipEmptyLines: true }).data;
const path = "content/events.json";
const existing = JSON.parse(readFileSync(path, "utf8")) as EventInput[];
const bySlug = new Map(existing.map((e) => [e.slug, e]));
let ok = 0;
const problems: string[] = [];

rows.forEach((r, i) => {
  const city = cityPath(r.city ?? "");
  const rec = {
    slug: t(r.slug) ?? slugify(`${r.title} ${(r.start_date ?? "").slice(0, 4)}`),
    title: t(r.title),
    sport: t(r.sport),
    summary: t(r.summary),
    description: t(r.description),
    start: dt(r.start_date, r.start_time),
    end: t(r.end_date) || t(r.end_time) ? dt(r.end_date || r.start_date, r.end_time || "23:00") : undefined,
    status: t(r.status) ?? "scheduled",
    venue: {
      name: t(r.venue_name), address: t(r.address), city, locality: t(r.locality), pincode: t(r.pincode),
      lat: n(r.lat), lng: n(r.lng), pinVerified: b(r.pin_verified),
    },
    organiser: t(r.organiser),
    level: t(r.level) ?? "open",
    format: t(r.format),
    ageMin: n(r.age_min), ageMax: n(r.age_max),
    isFree: b(r.is_free),
    priceMin: n(r.price_min), priceMax: n(r.price_max),
    registrationOpens: dt(r.reg_opens, "00:00"),
    registrationCloses: dt(r.reg_closes, "23:59"),
    registrationUrl: t(r.registration_url),
    websiteUrl: t(r.website_url),
    contactEmail: t(r.contact_email),
    contactPhone: t(r.contact_phone),
    categories: (r.categories ?? "").split(";").map((c) => c.trim()).filter(Boolean).map((c) => {
      const [name, dist, fee] = c.split(":");
      return { name: name.trim(), distanceM: n(dist), fee: n(fee) };
    }),
    featured: b(r.featured),
    verification: { verified: b(r.verified), lastVerified: t(r.last_verified), sources: (r.sources ?? "").split(/[\s;]+/).filter(Boolean) },
    added: new Date().toISOString().slice(0, 10),
  };
  const res = eventSchema.safeParse(rec);
  const extra: string[] = [];
  if (rec.sport && !getSport(rec.sport)) extra.push(`unknown sport "${rec.sport}"`);
  if (!getPlace(city)) extra.push(`unknown city "${r.city}"`);
  if (!res.success || extra.length) {
    problems.push(`row ${i + 2} (${r.title ?? "?"}): ${[...(res.success ? [] : res.error.issues.map((x) => `${x.path.join(".")} ${x.message}`)), ...extra].join("; ")}`);
    return;
  }
  const prev = bySlug.get(rec.slug);
  bySlug.set(rec.slug, { ...(prev ?? {}), ...(rec as EventInput), added: prev?.added ?? rec.added });
  ok++;
});

console.log(`${ok} row(s) valid, ${problems.length} skipped`);
problems.forEach((p) => console.log("  ✗ " + p));
if (!dry && ok) {
  writeFileSync(path, JSON.stringify([...bySlug.values()], null, 2) + "\n");
  console.log(`wrote ${path} (${bySlug.size} events)`);
}
