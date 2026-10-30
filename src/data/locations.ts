import { states, localities } from "./gazetteer";
import { haversineMetres, type LatLng } from "@/lib/geo";

export type Place = {
  type: "country" | "state" | "city" | "locality" | "pincode";
  name: string;
  path: string;          // in/telangana/hyderabad/gachibowli ; pincodes use the locality path
  parentName?: string;
  lat?: number;
  lng?: number;
  aliases: string[];
  launch?: boolean;
  pincodes?: string[];
};

const places: Place[] = [{ type: "country", name: "India", path: "in", lat: 22.3511, lng: 78.6677, aliases: [] }];
for (const st of states) {
  const stPath = `in/${st.slug}`;
  const cities = st.cities ?? [];
  const centre = cities.length
    ? { lat: cities.reduce((a, c) => a + c.lat, 0) / cities.length, lng: cities.reduce((a, c) => a + c.lng, 0) / cities.length }
    : {};
  places.push({ type: "state", name: st.name, path: stPath, parentName: "India", aliases: [], ...centre });
  for (const c of cities) {
    const cPath = `${stPath}/${c.slug}`;
    places.push({ type: "city", name: c.name, path: cPath, parentName: st.name, lat: c.lat, lng: c.lng, aliases: c.aliases ?? [], launch: c.launch });
    for (const l of localities[cPath] ?? []) {
      places.push({ type: "locality", name: l.name, path: `${cPath}/${l.slug}`, parentName: c.name, lat: l.lat, lng: l.lng, aliases: l.aliases ?? [], pincodes: l.pincodes });
    }
  }
}

const byPath = new Map(places.map((p) => [p.path, p]));

export const PLACES = places;
export const getPlace = (path: string) => byPath.get(path) ?? null;
export const children = (path: string, type?: Place["type"]) =>
  places.filter((p) => p.path.startsWith(path + "/") && p.path.split("/").length === path.split("/").length + 1 && (!type || p.type === type));
export const launchCities = () => places.filter((p) => p.launch);
export const allCities = () => places.filter((p) => p.type === "city");
export const allStates = () => places.filter((p) => p.type === "state");

/** Breadcrumb chain, root first. */
export function chain(path: string): Place[] {
  const parts = path.split("/");
  return parts.map((_, i) => byPath.get(parts.slice(0, i + 1).join("/"))).filter(Boolean) as Place[];
}

export type PlaceHit = { label: string; sublabel: string; lat: number; lng: number; path: string; type: Place["type"] };

/** Search the built-in gazetteer: localities, cities, states, aliases and PIN codes. */
export function searchPlaces(q: string, limit = 8): PlaceHit[] {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return [];
  const hits: (PlaceHit & { score: number })[] = [];
  for (const p of places) {
    if (p.lat == null || p.lng == null || p.type === "country") continue;
    if (/^\d{3,6}$/.test(term)) {
      const pin = p.pincodes?.find((x) => x.startsWith(term));
      if (pin) hits.push({ label: `${pin} · ${p.name}`, sublabel: p.parentName ?? "", lat: p.lat, lng: p.lng, path: p.path, type: "pincode", score: pin === term ? 3 : 1 });
      continue;
    }
    const names = [p.name, ...p.aliases].map((n) => n.toLowerCase());
    let score = 0;
    for (const n of names) {
      if (n === term) score = Math.max(score, 4);
      else if (n.startsWith(term)) score = Math.max(score, 3);
      else if (n.split(/[\s-]+/).some((w) => w.startsWith(term))) score = Math.max(score, 2);
      else if (term.length >= 4 && n.includes(term)) score = Math.max(score, 1);
    }
    if (!score) continue;
    const sub = p.type === "locality" ? `${p.parentName}` : p.type === "city" ? `${p.parentName}` : "State";
    hits.push({ label: p.name, sublabel: sub, lat: p.lat, lng: p.lng, path: p.path, type: p.type, score: score + (p.launch ? 0.5 : 0) + (p.type === "city" ? 0.2 : 0) });
  }
  return hits.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label)).slice(0, limit).map(({ score: _s, ...h }) => h);
}

/** Nearest locality (≤ 6 km) or city (≤ 60 km): used to label a GPS position without any API. */
export function nearestPlace(p: LatLng): { name: string; cityPath: string | null } | null {
  let best: { place: Place; d: number } | null = null;
  for (const type of ["locality", "city"] as const) {
    const max = type === "locality" ? 6000 : 60000;
    for (const pl of places) {
      if (pl.type !== type || pl.lat == null || pl.lng == null) continue;
      const d = haversineMetres(p, { lat: pl.lat, lng: pl.lng });
      if (d <= max && (!best || d < best.d)) best = { place: pl, d };
    }
    if (best) break;
  }
  if (!best) return null;
  const cityPath = best.place.type === "city" ? best.place.path : best.place.path.split("/").slice(0, 3).join("/");
  return { name: best.place.name, cityPath };
}

export function placeHref(path: string) {
  const parts = path.split("/");
  if (parts.length === 4) return `/${parts.slice(0, 3).join("/")}/area/${parts[3]}`;
  return `/${path}`;
}
