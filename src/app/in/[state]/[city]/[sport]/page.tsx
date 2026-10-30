import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlace } from "@/data/locations";
import { PUBLIC_SUMMARIES, upcoming } from "@/data/events";
import { getSport, sportTree, childSports } from "@/data/sports";
import { PageHero, LandingEvents } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const dynamicParams = false;
// One page per city × top-level sport that has (or had) a listing; pages with < 3 upcoming events are noindex.
export function generateStaticParams() {
  const seen = new Set<string>();
  for (const e of PUBLIC_SUMMARIES) seen.add(`${e.cityPath}|${e.rootSport}`);
  return [...seen].map((k) => { const [path, sport] = k.split("|"); const [, state, city] = path.split("/"); return { state, city, sport }; });
}

const data = (state: string, city: string, sport: string) => {
  const place = getPlace(`in/${state}/${city}`);
  const sp = getSport(sport);
  if (!place || !sp || sp.parent) return null;
  const tree = sportTree(sport);
  return { place, state: getPlace(`in/${state}`)!, sport: sp, events: upcoming().filter((e) => e.cityPath === place.path && tree.has(e.sport)) };
};

const noun = (s: string) => ({ running: "running events and marathons", cycling: "cycling events", badminton: "badminton tournaments", football: "football tournaments", cricket: "cricket tournaments", chess: "chess tournaments", tennis: "tennis tournaments" }[s]);

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string; sport: string }> }): Promise<Metadata> {
  const { state, city, sport } = await params;
  const d = data(state, city, sport);
  if (!d) return {};
  const what = noun(d.sport.slug) ?? `${d.sport.name.toLowerCase()} events`;
  return {
    title: `${what.charAt(0).toUpperCase() + what.slice(1)} in ${d.place.name}`,
    description: `Upcoming ${what} in ${d.place.name}: dates, venues, categories, fees, distance from you and official registration links.`,
    alternates: { canonical: `/${d.place.path}/${d.sport.slug}/` },
    robots: d.events.length < 3 ? { index: false, follow: true } : undefined,
  };
}

export default async function CitySportPage({ params }: { params: Promise<{ state: string; city: string; sport: string }> }) {
  const { state, city, sport } = await params;
  const d = data(state, city, sport);
  if (!d) notFound();
  const what = noun(d.sport.slug) ?? `${d.sport.name} events`;
  return (
    <>
      <PageHero
        eyebrow={<Breadcrumbs items={[{ name: d.state.name, href: `/${d.state.path}/` }, { name: d.place.name, href: `/${d.place.path}/` }, { name: d.sport.name }]} />}
        title={`${what.charAt(0).toUpperCase() + what.slice(1)} in ${d.place.name}`}
        intro={`${d.events.length} upcoming ${d.sport.name.toLowerCase()} event${d.events.length === 1 ? "" : "s"} in ${d.place.name}.`}>
        {childSports(d.sport.slug).length > 0 && (
          <p className="mt-4 text-sm text-ink-600">Also see: <Link className="font-semibold text-brand-600" href={`/sports/${d.sport.slug}/`}>{d.sport.name} across India</Link> · <Link className="font-semibold text-brand-600" href={`/map/?sport=${d.sport.slug}&city=${d.place.path}`}>map view</Link></p>
        )}
      </PageHero>
      <div className="container-page mt-8">
        <LandingEvents events={d.events} center={{ lat: d.place.lat!, lng: d.place.lng! }} zoom={10} from={`city-sport`} />
      </div>
    </>
  );
}
