import Link from "next/link";
import { HeroSearch } from "@/components/HeroSearch";
import { NearMe } from "@/components/events/NearMe";
import { LiveEventList } from "@/components/events/LiveEventList";
import { LazyMap } from "@/components/map/LazyMap";
import { upcoming, countBy, ORGANISERS, SHOW_DEMO } from "@/data/events";
import { topSports, sportTree } from "@/data/sports";
import { launchCities, getPlace, placeHref } from "@/data/locations";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

const TOURNAMENT_SPORTS = ["badminton", "football", "cricket", "chess", "tennis", "table-tennis", "kabaddi", "basketball", "volleyball", "hockey", "carrom", "squash", "martial-arts"];

export default function Home() {
  const events = upcoming();
  const sportCount = countBy(events, (e) => e.rootSport);
  const sports = topSports().map((s) => ({ ...s, count: sportCount.get(s.slug) ?? 0 })).sort((a, b) => b.count - a.count || a.order - b.order);
  const nearSports = sports.filter((s) => s.count > 0).slice(0, 8);
  const cityCount = countBy(events, (e) => e.cityPath);
  const cities = [...cityCount.entries()].sort((a, b) => b[1] - a[1]).map(([p, n]) => ({ place: getPlace(p)!, n }));
  for (const c of launchCities()) if (!cities.find((x) => x.place.path === c.path)) cities.push({ place: c, n: 0 });
  const runningTree = [...sportTree("running")];
  const tournamentTree = TOURNAMENT_SPORTS.flatMap((s) => [...sportTree(s)]);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url,
        potentialAction: { "@type": "SearchAction", target: `${SITE.url}/search/?q={query}`, "query-input": "required name=query" },
      }} />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="container-page relative py-12 sm:py-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-200">India&apos;s all-sports event finder</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Discover sports. <span className="text-brand-500">Find events.</span> Get active.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-200">Runs, rides, tournaments and competitions near you, with distance, dates and the official registration link.</p>
          <div className="mt-8"><HeroSearch /></div>
          <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4">
            {sports.slice(0, 8).map((s) => (
              <Link key={s.slug} href={`/sports/${s.slug}/`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">
                <span aria-hidden>{s.icon}</span>{s.name}
              </Link>
            ))}
          </div>
          {SHOW_DEMO && <p className="mt-6 inline-block rounded-lg bg-purple-500/20 px-3 py-1.5 text-xs text-purple-100">Preview mode: events marked “Demo” are sample data, not real events.</p>}
        </div>
      </section>

      <NearMe events={events} sports={nearSports.map(({ slug, name, icon }) => ({ slug, name, icon }))} />

      <section className="container-page mt-14">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Explore on the map</h2>
            <p className="mt-1 text-ink-600">{events.length} upcoming events across India. Tap a pin for details.</p>
          </div>
          <Link href="/map/" className="btn btn-dark !py-2 text-sm">Open full map</Link>
        </div>
        <div className="mt-4"><LazyMap events={events} fitToEvents height="h-[360px] sm:h-[440px]" /></div>
      </section>

      <section className="container-page mt-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">This weekend</h2>
          <Link href="/this-weekend/" className="text-sm font-semibold text-brand-600 hover:underline">All weekend events →</Link>
        </div>
        <div className="mt-4">
          <LiveEventList events={events} filters={{ when: "weekend" }} layout="row" limit={12} from="home-weekend"
            empty={<p className="rounded-2xl bg-white p-6 text-ink-600 ring-1 ring-ink-100">Nothing listed for this weekend yet. <Link className="font-semibold text-brand-600" href="/calendar/">See the calendar</Link>.</p>} />
        </div>
      </section>

      <section className="container-page mt-14">
        <h2 className="text-2xl font-extrabold tracking-tight">Browse by sport</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {sports.slice(0, 18).map((s) => (
            <Link key={s.slug} href={`/sports/${s.slug}/`} className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 hover:border-ink-300">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl" style={{ background: s.colour + "1a" }} aria-hidden>{s.icon}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{s.name}</span><span className="text-xs text-ink-500">{s.count} upcoming</span></span>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-sm"><Link href="/sports/" className="font-semibold text-brand-600 hover:underline">All {topSports().length} sports →</Link></p>
      </section>

      <section className="container-page mt-14">
        <h2 className="text-2xl font-extrabold tracking-tight">Upcoming by city</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cities.slice(0, 12).map(({ place, n }) => (
            <Link key={place.path} href={`${placeHref(place.path)}/`} className="rounded-2xl bg-gradient-to-br from-ink-800 to-ink-900 p-4 text-white hover:from-ink-700">
              <span className="block font-bold">{place.name}</span>
              <span className="text-sm text-ink-300">{n} event{n === 1 ? "" : "s"}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page mt-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">Popular running events</h2>
          <Link href="/sports/running/" className="text-sm font-semibold text-brand-600 hover:underline">All running →</Link>
        </div>
        <div className="mt-4"><LiveEventList events={events} filters={{ sport: runningTree }} layout="row" limit={10} from="home-running" /></div>
      </section>

      <section className="container-page mt-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight">Upcoming tournaments</h2>
          <Link href="/search/?type=tournaments" className="text-sm font-semibold text-brand-600 hover:underline">More tournaments →</Link>
        </div>
        <div className="mt-4"><LiveEventList events={events} filters={{ sport: tournamentTree }} layout="row" limit={10} from="home-tournaments" /></div>
      </section>

      <section className="container-page mt-14">
        <div className="grid gap-6 rounded-3xl bg-brand-500 p-6 text-white sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Organising a sports event?</h2>
            <p className="mt-2 text-brand-50">List it free. We verify the details, put it on the map and send participants to your official registration page.</p>
            {ORGANISERS.length > 0 && <p className="mt-3 text-sm text-brand-100">{ORGANISERS.length} organisers listed · <Link href="/organisers/" className="underline">Browse organisers</Link></p>}
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/list-your-event/" className="btn bg-white text-brand-700 hover:bg-brand-50">List your event</Link>
            <Link href="/how-we-verify/" className="btn border border-white/40 text-white hover:bg-white/10">How we verify</Link>
          </div>
        </div>
      </section>
    </>
  );
}
