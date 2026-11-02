import type { MetadataRoute } from "next";
import { listingHref } from "@/data/events";
import { RUNS } from "@/data/events";
import { SITE } from "@/lib/site";
import { TOPICS } from "@/lib/topics";
import { runHref } from "@/lib/runs";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", listingHref(), "/submit", "/cities", "/about", "/privacy", "/terms", "/disclaimer"].map((p) => ({ url: `${SITE.url}${p === "/" ? "" : p}`, changeFrequency: "daily" as const }));
  const topics = TOPICS.filter((t) => t.slug !== "running-events").map((t) => ({ url: `${SITE.url}/hyderabad/${t.slug}`, changeFrequency: "daily" as const }));
  return [...pages, ...topics, ...RUNS.map((r) => ({ url: `${SITE.url}${runHref(r.slug)}`, lastModified: r.added, changeFrequency: "weekly" as const }))];
}
