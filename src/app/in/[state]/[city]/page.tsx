import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allCities, getPlace, children, placeHref } from "@/data/locations";
import { upcoming, countBy } from "@/data/events";
import { getSport } from "@/data/sports";
import { PageHero, LandingEvents } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const dynamicParams = false;
export const generateStaticParams = () => allCities().map((c) => { const [, state, city] = c.path.split("/"); return { state, city }; });

const data = (state: string, city: string) => {
  const place = getPlace(`in/${state}/${city}`);
  if (!place || place.type !== "city") return null;
  return { place, state: getPlace(`in/${state}`)!, events: upcoming().filter((e) => e.cityPath === place.path) };
};

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string }> }): Promise<Metadata> {
  const { state, city } = await params;
  const d = data(state, city);
  if (!d) return {};
  return {
    title: `Sports events in ${d.place.name}: runs, tournaments and more`,
    description: `Upcoming sports events in ${d.place.name}, ${d.state.name}: marathons, cycling rides, badminton, football and cricket tournaments, with distance and registration links.`,
    alternates: { canonical: `/${d.place.path}/` },
    robots: d.events.length < 3 ? { index: false, follow: true } : undefined,
  };
}

export default async function CityPage({ params }: { params: Promise<{ state: string; city: string }> }) {
  const { state, city } = await params;
  const d = data(state, city);
  if (!d) notFound();
  const { place, events } = d;
  const sports = [...countBy(events, (e) => e.rootSport).entries()].sort((a, b) => b[1] - a[1]);
  const localities = children(place.path, "locality");
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs items={[{ name: d.state.name, href: `/${d.state.path}/` }, { name: place.name }]} />}
        title={`Sports events in ${place.name}`}
        intro={`${events.length} upcoming event${events.length === 1 ? "" : "s"} in and around ${place.name}. Set your location to see how far each one is.`}>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/${place.path}/this-weekend/`} className="chip is-active">This weekend</Link>
          {sports.map(([s, n]) => {
            const sp = getSport(s)!;
            return <Link key={s} href={`/${place.path}/${s}/`} className="chip"><span aria-hidden>{sp.icon}</span>{sp.name} <span className="text-ink-400">{n}</span></Link>;
          })}
        </div>
        {localities.length > 0 && (
          <p className="mt-4 text-sm text-ink-600">Areas:{" "}
            {localities.map((l, i) => <span key={l.path}>{i > 0 && " · "}<Link className="hover:text-ink-900 hover:underline" href={`${placeHref(l.path)}/`}>{l.name}</Link></span>)}
          </p>
        )}
      </PageHero>
      <div className="container-page mt-8">
        <LandingEvents events={events} center={{ lat: place.lat!, lng: place.lng! }} zoom={10} from={`city-${place.path}`} />
      </div>
    </>
  );
}
