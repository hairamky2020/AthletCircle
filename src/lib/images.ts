import data from "../../content/images.json";
import type { Run } from "@/data/schema";

export type Photo = { src: string; page: string; caption: string; generic: boolean };
type Entry = { file: string; caption: string };

const commons = (e: Entry, generic: boolean, width = 1200): Photo => ({
  src: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(e.file)}?width=${width}`,
  page: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(e.file)}`,
  caption: e.caption,
  generic,
});

/** Photo of the event's place (free licence). Falls back to a city photo, flagged as generic. */
export function photoFor(run: Pick<Run, "slug" | "area">, width?: number): Photo {
  const s = (data.bySlug as Record<string, Entry>)[run.slug];
  if (s) return commons(s, false, width);
  const a = run.area ? (data.byArea as Record<string, Entry>)[run.area] : undefined;
  if (a) return commons(a, false, width);
  return commons(data.city, true, width);
}
