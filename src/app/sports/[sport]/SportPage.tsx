import Link from "next/link";
import { getSport, childSports, sportTree, sportHref, type Sport } from "@/data/sports";
import { upcoming, countBy } from "@/data/events";
import { getPlace } from "@/data/locations";
import { PageHero, LandingEvents } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export function sportPageData(slug: string) {
  const sport = getSport(slug);
  if (!sport) return null;
  const tree = sportTree(slug);
  const events = upcoming().filter((e) => tree.has(e.sport));
  return { sport, events };
}

export function SportPage({ sport, events }: { sport: Sport; events: ReturnType<typeof upcoming> }) {
  const parent = sport.parent ? getSport(sport.parent) : null;
  const subs = childSports(parent ? parent.slug : sport.slug);
  const cities = [...countBy(events, (e) => e.cityPath).entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  return (
    <>
      <PageHero
        eyebrow={<Breadcrumbs items={[{ name: "Sports", href: "/sports/" }, ...(parent ? [{ name: parent.name, href: `/sports/${parent.slug}/` }] : []), { name: sport.name }]} />}
        title={`${sport.name} events in India`}
        intro={`${events.length} upcoming ${sport.name.toLowerCase()} event${events.length === 1 ? "" : "s"} across India: dates, venues, distance from you and official registration links.`}>
        {subs.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4">
            <Link href={`/sports/${parent?.slug ?? sport.slug}/`} className={`chip ${!parent ? "is-active" : ""}`}>All {(parent ?? sport).name}</Link>
            {subs.map((c) => <Link key={c.slug} href={sportHref(c.slug)} className={`chip ${c.slug === sport.slug ? "is-active" : ""}`}>{c.name}</Link>)}
          </div>
        )}
        {cities.length > 0 && (
          <p className="mt-4 text-sm text-ink-600">By city:{" "}
            {cities.map(([p, n], i) => {
              const c = getPlace(p)!;
              return <span key={p}>{i > 0 && " · "}<Link className="font-semibold text-brand-600 hover:underline" href={`/${c.path}/${parent?.slug ?? sport.slug}/`}>{c.name}</Link> ({n})</span>;
            })}
          </p>
        )}
      </PageHero>
      <div className="container-page mt-8">
        <LandingEvents events={events} from={`sport-${sport.slug}`} />
        <p className="mt-6 text-sm text-ink-500">Looking for something closer? <Link className="font-semibold text-brand-600" href={`/near-me/`}>See {sport.name.toLowerCase()} near me</Link> or <Link className="font-semibold text-brand-600" href={`/map/?sport=${sport.slug}`}>open the map</Link>.</p>
      </div>
    </>
  );
}
