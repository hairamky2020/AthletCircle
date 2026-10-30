import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PLACES, getPlace } from "@/data/locations";
import { upcoming } from "@/data/events";
import { haversineMetres } from "@/lib/geo";
import { PageHero, LandingEvents } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const RADIUS_KM = 10;
export const dynamicParams = false;
export const generateStaticParams = () => PLACES.filter((p) => p.type === "locality").map((p) => { const [, state, city, locality] = p.path.split("/"); return { state, city, locality }; });

const data = (state: string, city: string, locality: string) => {
  const place = getPlace(`in/${state}/${city}/${locality}`);
  if (!place || place.type !== "locality") return null;
  const centre = { lat: place.lat!, lng: place.lng! };
  // Radius from the locality centre, not address matching, so nearby venues across a boundary count.
  const events = upcoming()
    .map((e) => ({ e, d: haversineMetres(centre, e) }))
    .filter((x) => x.d <= RADIUS_KM * 1000)
    .sort((a, b) => a.d - b.d)
    .map((x) => x.e);
  return { place, city: getPlace(`in/${state}/${city}`)!, state: getPlace(`in/${state}`)!, events, centre };
};

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string; locality: string }> }): Promise<Metadata> {
  const { state, city, locality } = await params;
  const d = data(state, city, locality);
  if (!d) return {};
  return {
    title: `Sports events near ${d.place.name}, ${d.city.name}`,
    description: `Upcoming sports events within ${RADIUS_KM} KM of ${d.place.name}, ${d.city.name}: runs, tournaments and more with distances and registration links.`,
    alternates: { canonical: `/${d.city.path}/area/${locality}/` },
    robots: d.events.length < 3 ? { index: false, follow: true } : undefined,
  };
}

export default async function LocalityPage({ params }: { params: Promise<{ state: string; city: string; locality: string }> }) {
  const { state, city, locality } = await params;
  const d = data(state, city, locality);
  if (!d) notFound();
  return (
    <>
      <PageHero
        eyebrow={<Breadcrumbs items={[{ name: d.state.name, href: `/${d.state.path}/` }, { name: d.city.name, href: `/${d.city.path}/` }, { name: d.place.name }]} />}
        title={`Sports events near ${d.place.name}`}
        intro={<>{d.events.length} upcoming event{d.events.length === 1 ? "" : "s"} within {RADIUS_KM} KM of {d.place.name}{d.place.pincodes?.length ? ` (PIN ${d.place.pincodes.join(", ")})` : ""}. <Link className="font-semibold text-brand-600" href={`/search/?near=${encodeURIComponent(d.place.name)}&lat=${d.centre.lat}&lng=${d.centre.lng}&radius=25&view=map`}>Widen the search</Link></>} />
      <div className="container-page mt-8">
        <LandingEvents events={d.events} center={d.centre} zoom={12} from="locality" />
      </div>
    </>
  );
}
