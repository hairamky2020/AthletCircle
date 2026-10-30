import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allCities, getPlace } from "@/data/locations";
import { upcoming } from "@/data/events";
import { LiveEventList } from "@/components/events/LiveEventList";
import { PageHero } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const dynamicParams = false;
export const generateStaticParams = () => allCities().map((c) => { const [, state, city] = c.path.split("/"); return { state, city }; });

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string }> }): Promise<Metadata> {
  const { state, city } = await params;
  const place = getPlace(`in/${state}/${city}`);
  if (!place) return {};
  return {
    title: `Sports events in ${place.name} this weekend`,
    description: `Runs, rides, tournaments and sports events happening in ${place.name} this weekend.`,
    alternates: { canonical: `/${place.path}/this-weekend/` },
  };
}

export default async function CityWeekend({ params }: { params: Promise<{ state: string; city: string }> }) {
  const { state, city } = await params;
  const place = getPlace(`in/${state}/${city}`);
  if (!place) notFound();
  const st = getPlace(`in/${state}`)!;
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs items={[{ name: st.name, href: `/${st.path}/` }, { name: place.name, href: `/${place.path}/` }, { name: "This weekend" }]} />}
        title={`${place.name} this weekend`} intro="Saturday and Sunday events in and around the city." />
      <div className="container-page mt-8">
        <LiveEventList events={upcoming().filter((e) => e.cityPath === place.path)} filters={{ when: "weekend" }} limit={100} from="city-weekend"
          empty={<p className="rounded-2xl bg-white p-6 text-ink-600 ring-1 ring-ink-100">Nothing listed for this weekend in {place.name}. <Link className="font-semibold text-brand-600" href={`/${place.path}/`}>See all upcoming events</Link>.</p>} />
      </div>
    </>
  );
}
