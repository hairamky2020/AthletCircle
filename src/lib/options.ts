import { SPORTS } from "@/data/sports";
import { allCities } from "@/data/locations";

/** Small option lists passed to client components. */
export const sportOptions = () => SPORTS.map((s) => ({ slug: s.slug, name: s.name, icon: s.icon, parent: s.parent }));
export const cityOptions = () => allCities().map((c) => ({ path: c.path, name: c.name })).sort((a, b) => a.name.localeCompare(b.name));
