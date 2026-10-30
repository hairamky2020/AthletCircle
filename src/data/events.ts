// Event repository. Today it reads content/events.json at build time; later it can be swapped for an
// API or database without changing pages (they only use these functions).
import raw from "../../content/events.json";
import { eventSchema, type Run } from "./schema";
import { getSport } from "./sports";
import { getPlace } from "./locations";

function load(): Run[] {
  const errors: string[] = [];
  const runs: Run[] = [];
  (raw as unknown[]).forEach((item, i) => {
    const r = eventSchema.safeParse(item);
    if (!r.success) {
      errors.push(`content/events.json #${i} (${(item as { slug?: string })?.slug ?? "?"}): ${r.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`);
      return;
    }
    const e = r.data;
    if (!getSport(e.sport)) errors.push(`${e.slug}: unknown sport "${e.sport}"`);
    if (!getPlace(e.city)) errors.push(`${e.slug}: unknown city "${e.city}"`);
    if (e.endDate && e.endDate < e.date) errors.push(`${e.slug}: endDate is before date`);
    runs.push(e);
  });
  const seen = new Set<string>();
  for (const e of runs) {
    if (seen.has(e.slug)) errors.push(`duplicate slug "${e.slug}"`);
    seen.add(e.slug);
  }
  if (errors.length) throw new Error("Invalid event data:\n" + errors.join("\n"));
  return runs.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

/** Phase 1 scope: running events in Hyderabad. */
export const SCOPE = { sport: "running", city: "in/telangana/hyderabad", cityName: "Hyderabad" };

export const RUNS: Run[] = load().filter((e) => e.sport === SCOPE.sport && e.city === SCOPE.city);

export const getRun = (slug: string) => RUNS.find((e) => e.slug === slug) ?? null;

/** Other runs on the same day, then the nearest dates. */
export function otherRuns(run: Run, limit = 4) {
  const day = (d: string) => Date.parse(d) / 864e5;
  return RUNS.filter((r) => r.slug !== run.slug)
    .sort((a, b) => Math.abs(day(a.date) - day(run.date)) - Math.abs(day(b.date) - day(run.date)))
    .slice(0, limit)
    .sort((a, b) => a.date.localeCompare(b.date));
}
