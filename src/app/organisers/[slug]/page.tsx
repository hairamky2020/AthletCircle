import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ORGANISERS, getOrganiser, eventsByOrganiser } from "@/data/events";
import { PageHero } from "@/components/LandingEvents";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LiveEventList } from "@/components/events/LiveEventList";
import { EventCard } from "@/components/events/EventCard";
import { DemoBadge } from "@/components/events/StatusBadge";
import { JsonLd } from "@/components/JsonLd";

export const dynamicParams = false;
export const generateStaticParams = () => ORGANISERS.map((o) => ({ slug: o.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const o = getOrganiser((await params).slug);
  if (!o) return {};
  return {
    title: `${o.name}: upcoming events`,
    description: o.description ?? `Upcoming and past sports events organised by ${o.name}.`,
    alternates: { canonical: `/organisers/${o.slug}/` },
    robots: o.demo ? { index: false, follow: true } : undefined,
  };
}

export default async function OrganiserPage({ params }: { params: Promise<{ slug: string }> }) {
  const o = getOrganiser((await params).slug);
  if (!o) notFound();
  const ev = eventsByOrganiser(o.slug);
  return (
    <>
      {!o.demo && <JsonLd data={{ "@context": "https://schema.org", "@type": "SportsOrganization", name: o.name, url: o.website, logo: o.logo, sameAs: Object.values(o.social) }} />}
      <PageHero eyebrow={<Breadcrumbs items={[{ name: "Organisers", href: "/organisers/" }, { name: o.name }]} />} title={o.name} intro={o.description}>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          {o.demo && <DemoBadge />}
          {o.verified && <span className="rounded-full bg-green-50 px-2 py-0.5 font-semibold text-green-700">Verified organiser</span>}
          {o.website && <a className="font-semibold text-brand-600 hover:underline" href={o.website} target="_blank" rel="noopener nofollow">Website ↗</a>}
          {o.email && <a className="text-brand-600 hover:underline" href={`mailto:${o.email}`}>{o.email}</a>}
          {o.phone && <a className="text-brand-600 hover:underline" href={`tel:${o.phone.replace(/\s/g, "")}`}>{o.phone}</a>}
          {Object.entries(o.social).map(([k, v]) => <a key={k} className="capitalize text-brand-600 hover:underline" href={v} target="_blank" rel="noopener nofollow">{k}</a>)}
        </div>
      </PageHero>
      <div className="container-page mt-8 space-y-10">
        <section>
          <h2 className="text-xl font-bold">Upcoming events</h2>
          <div className="mt-4"><LiveEventList events={ev.upcoming} limit={60} from="organiser" empty={<p className="text-ink-600">No upcoming events listed.</p>} /></div>
        </section>
        {ev.past.length > 0 && (
          <section>
            <h2 className="text-xl font-bold">Past events</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ev.past.slice(0, 12).map((e) => <EventCard key={e.slug} e={e} />)}</div>
          </section>
        )}
      </div>
    </>
  );
}
