import type { Metadata } from "next";
import Link from "next/link";
import { ORGANISERS, eventsByOrganiser, PUBLIC_EVENTS } from "@/data/events";
import { rootSport } from "@/data/sports";
import { PageHero } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DemoBadge } from "@/components/events/StatusBadge";

export const metadata: Metadata = {
  title: "Sports event organisers in India",
  description: "Directory of sports event organisers: running race organisers, tournament hosts, clubs and associations, with their upcoming events.",
  alternates: { canonical: "/organisers/" },
};

export default function Organisers() {
  const list = ORGANISERS.map((o) => {
    const ev = eventsByOrganiser(o.slug);
    const sports = [...new Set(PUBLIC_EVENTS.filter((e) => e.organiser === o.slug).map((e) => rootSport(e.sport)!.name))];
    return { o, upcoming: ev.upcoming.length, past: ev.past.length, sports };
  }).sort((a, b) => Number(b.o.verified) - Number(a.o.verified) || b.upcoming - a.upcoming || a.o.name.localeCompare(b.o.name));
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs items={[{ name: "Organisers" }]} />} title="Event organisers"
        intro="The clubs, companies and associations behind the events we list." />
      <div className="container-page mt-8">
        {list.length === 0 ? <p className="text-ink-600">No organisers listed yet.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(({ o, upcoming, past, sports }) => (
              <Link key={o.slug} href={`/organisers/${o.slug}/`} className="rounded-2xl border border-ink-100 bg-white p-5 hover:border-ink-300">
                <div className="flex items-center gap-3">
                  {o.logo ? <img src={o.logo} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-full bg-ink-900 text-lg font-bold text-white">{o.name.charAt(0)}</span>}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{o.name}</p>
                    <p className="text-sm text-ink-500">{upcoming} upcoming · {past} past</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {o.demo && <DemoBadge />}
                  {o.verified && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">Verified organiser</span>}
                  {sports.map((s) => <span key={s} className="rounded-full bg-ink-50 px-2 py-0.5 text-xs text-ink-600">{s}</span>)}
                </div>
              </Link>
            ))}
          </div>
        )}
        <p className="mt-8 text-sm text-ink-600">Are you an organiser? <Link href="/list-your-event/" className="font-semibold text-brand-600">List your events free</Link>.</p>
      </div>
    </>
  );
}
