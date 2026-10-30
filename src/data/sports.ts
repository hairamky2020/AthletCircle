import { sports as taxonomy } from "./taxonomy";

export type SchemaField = { type: "string" | "number" | "integer" | "boolean" | "array"; title?: string; enum?: string[]; items?: { enum?: string[] } };
export type Sport = {
  slug: string;
  name: string;
  icon: string;
  colour: string;
  family: "outdoor" | "indoor" | "other";
  parent: string | null;               // parent slug for subcategories
  schema: { properties?: Record<string, SchemaField> };
  order: number;
};

export const SPORTS: Sport[] = taxonomy.flatMap((s, i) => [
  { slug: s.slug, name: s.name, icon: s.icon, colour: s.colour, family: s.family, parent: null, schema: (s.schema ?? {}) as Sport["schema"], order: i },
  ...(s.children ?? []).map((c, j) => ({
    slug: c.slug, name: c.name, icon: s.icon, colour: s.colour, family: s.family, parent: s.slug, schema: {}, order: i + (j + 1) / 100,
  })),
]);

const bySlug = new Map(SPORTS.map((s) => [s.slug, s]));

export const getSport = (slug: string) => bySlug.get(slug) ?? null;
export const topSports = () => SPORTS.filter((s) => !s.parent);
export const childSports = (slug: string) => SPORTS.filter((s) => s.parent === slug);

/** Top-level sport for any slug. */
export function rootSport(slug: string): Sport | null {
  let s = getSport(slug);
  while (s?.parent) s = getSport(s.parent);
  return s;
}

/** A sport and all its descendants. */
export function sportTree(slug: string): Set<string> {
  const out = new Set<string>([slug]);
  for (const s of SPORTS) if (s.parent && out.has(s.parent)) out.add(s.slug);
  return out;
}

/** Subcategories use their parent's attribute schema. */
export function schemaFor(slug: string): Sport["schema"] {
  const s = getSport(slug);
  if (s?.schema?.properties) return s.schema;
  return rootSport(slug)?.schema ?? {};
}

/** URL for a sport page: /sports/running or /sports/running/marathon */
export function sportHref(slug: string) {
  const s = getSport(slug);
  return s?.parent ? `/sports/${s.parent}/${s.slug}` : `/sports/${slug}`;
}
