import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allStates, getPlace, children, placeHref } from "@/data/locations";
import { upcoming, countBy } from "@/data/events";
import { getSport } from "@/data/sports";
import { PageHero, LandingEvents } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const dynamicParams = false;
export const generateStaticParams = () => allStates().map((s) => ({ state: s.path.split("/")[1] }));

const data = (state: string) => {
  const place = getPlace(`in/${state}`);
  if (!place || place.type !== "state") return null;
  const events = upcoming().filter((e) => e.statePath === place.path);
  return { place, events };
};

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const d = data((await params).state);
  if (!d) return {};
  return {
    title: `Sports events in ${d.place.name}`,
    description: `Upcoming runs, rides, tournaments and sports competitions in ${d.place.name}, by city and sport.`,
    alternates: { canonical: `/${d.place.path}/` },
    robots: d.events.length < 3 ? { index: false, follow: true } : undefined,
  };
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const d = data((await params).state);
  if (!d) notFound();
  const { place, events } = d;
  const cities = children(place.path, "city");
  const cityCounts = countBy(events, (e) => e.cityPath);
  const sportCounts = [...countBy(events, (e) => e.rootSport).entries()].sort((a, b) => b[1] - a[1]);
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs items={[{ name: place.name }]} />} title={`Sports events in ${place.name}`}
        intro={`${events.length} upcoming event${events.length === 1 ? "" : "s"} across ${place.name}.`}>
        {cities.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {cities.map((c) => <Link key={c.path} href={`${placeHref(c.path)}/`} className="chip">{c.name} <span className="text-ink-400">{cityCounts.get(c.path) ?? 0}</span></Link>)}
          </div>
        )}
        {sportCounts.length > 0 && (
          <p className="mt-4 text-sm text-ink-600">Sports: {sportCounts.map(([s, n], i) => <span key={s}>{i > 0 && " · "}{getSport(s)!.name} ({n})</span>)}</p>
        )}
      </PageHero>
      <div className="container-page mt-8"><LandingEvents events={events} from={`state-${place.path}`} /></div>
    </>
  );
}
