import type { Metadata } from "next";
import Link from "next/link";
import { topSports, childSports } from "@/data/sports";
import { upcoming, countBy } from "@/data/events";
import { PageHero } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "All sports",
  description: "Browse upcoming events for running, cycling, triathlon, football, cricket, badminton, chess and 30+ more sports across India.",
  alternates: { canonical: "/sports/" },
};

const FAMILY = { outdoor: "Outdoor sports", indoor: "Indoor sports", other: "Fitness and other sports" } as const;

export default function SportsIndex() {
  const counts = countBy(upcoming(), (e) => e.rootSport);
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs items={[{ name: "Sports" }]} />} title="All sports" intro="Every sport we cover. Pick one to see upcoming events, cities and the map." />
      <div className="container-page mt-8 space-y-10">
        {(Object.keys(FAMILY) as (keyof typeof FAMILY)[]).map((fam) => (
          <section key={fam}>
            <h2 className="text-xl font-bold">{FAMILY[fam]}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topSports().filter((s) => s.family === fam).map((s) => (
                <Link key={s.slug} href={`/sports/${s.slug}/`} className="flex gap-3 rounded-2xl border border-ink-100 bg-white p-4 hover:border-ink-300">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl" style={{ background: s.colour + "1a" }} aria-hidden>{s.icon}</span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{s.name}</span>
                    <span className="text-sm text-ink-500">{counts.get(s.slug) ?? 0} upcoming</span>
                    {childSports(s.slug).length > 0 && <span className="block truncate text-xs text-ink-400">{childSports(s.slug).map((c) => c.name).join(" · ")}</span>}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
