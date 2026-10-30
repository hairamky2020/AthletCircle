import type { MetadataRoute } from "next";
import { PUBLIC_EVENTS, ORGANISERS, upcoming } from "@/data/events";
import { SPORTS, sportTree, sportHref } from "@/data/sports";
import { PLACES, placeHref } from "@/data/locations";
import { haversineMetres } from "@/lib/geo";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

// Only pages with real content are listed: thin landing pages (< 3 upcoming events) are left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${SITE.url}${p}`;
  const live = upcoming();
  const out: MetadataRoute.Sitemap = ["/", "/search/", "/map/", "/near-me/", "/calendar/", "/this-weekend/", "/sports/", "/organisers/", "/list-your-event/", "/how-we-verify/", "/about/"]
    .map((p) => ({ url: u(p), changeFrequency: "daily" as const, priority: p === "/" ? 1 : 0.6 }));
  for (const e of PUBLIC_EVENTS) if (!e.demo) out.push({ url: u(`/events/${e.slug}/`), lastModified: e.verification.lastVerified, changeFrequency: "weekly", priority: 0.8 });
  for (const s of SPORTS) {
    const tree = sportTree(s.slug);
    if (live.filter((e) => tree.has(e.sport) && !e.demo).length >= 3) out.push({ url: u(`${sportHref(s.slug)}/`), changeFrequency: "daily", priority: 0.7 });
  }
  for (const p of PLACES) {
    if (p.type === "country") continue;
    const n = p.type === "locality"
      ? live.filter((e) => !e.demo && haversineMetres({ lat: p.lat!, lng: p.lng! }, e) <= 10000).length
      : live.filter((e) => !e.demo && (e.cityPath === p.path || e.statePath === p.path)).length;
    if (n >= 3) out.push({ url: u(`${placeHref(p.path)}/`), changeFrequency: "daily", priority: 0.7 });
  }
  const combos = new Map<string, number>();
  for (const e of live) if (!e.demo) combos.set(`${e.cityPath}/${e.rootSport}`, (combos.get(`${e.cityPath}/${e.rootSport}`) ?? 0) + 1);
  for (const [k, n] of combos) if (n >= 3) out.push({ url: u(`/${k}/`), changeFrequency: "daily", priority: 0.8 });
  for (const o of ORGANISERS) if (!o.demo) out.push({ url: u(`/organisers/${o.slug}/`), changeFrequency: "weekly", priority: 0.5 });
  return out;
}
