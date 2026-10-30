import type { MetadataRoute } from "next";
import { RUNS } from "@/data/events";
import { SITE } from "@/lib/site";
import { runHref } from "@/lib/runs";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/list", "/calendar", "/map", "/add-a-run", "/about"].map((p) => ({ url: `${SITE.url}${p === "/" ? "" : p}`, changeFrequency: "daily" as const }));
  return [...pages, ...RUNS.map((r) => ({ url: `${SITE.url}${runHref(r.slug)}`, lastModified: r.added, changeFrequency: "weekly" as const }))];
}
