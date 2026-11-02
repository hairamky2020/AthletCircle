import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RUNS, SCOPE, scopeParams, listingHref } from "@/data/events";
import { TOPICS, getTopic } from "@/lib/topics";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import { formatLong, groupByMonth, isPast, placeLabel, runHref } from "@/lib/runs";

export const dynamicParams = false;
export const generateStaticParams = () => TOPICS.map((t) => ({ city: scopeParams().city, listing: t.slug }));

type P = { params: Promise<{ city: string; listing: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const t = getTopic((await params).listing)!;
  const href = `/${scopeParams().city}/${t.slug}`;
  return { title: { absolute: t.title }, description: t.description, alternates: { canonical: href }, openGraph: { title: t.title, description: t.description, url: href } };
}

export default async function ListingPage({ params }: P) {
  const t = getTopic((await params).listing);
  if (!t) notFound();
  const now = new Date();
  const title = t.h1;
  const upcoming = RUNS.filter((r) => !isPast(r, now) && t.match(r, now));
  const isMain = t.slug === "running-events";
  const faqLd = t.faqs.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: t.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) } : null;
  const listLd = { "@context": "https://schema.org", "@type": "ItemList", name: title, itemListElement: upcoming.map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}${runHref(r.slug)}`, name: r.title })) };
  const past = isMain ? RUNS.filter((r) => isPast(r, now)).reverse() : [];
  return (
    <div className="wrap pt-10">
      <nav className="text-sm text-ink-500" aria-label="Breadcrumb"><Link href="/" className="hover:text-ink-900">Home</Link> / {SCOPE.cityName} / {SCOPE.sportName}</nav>
      <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
      <JsonLd data={listLd} />{faqLd && <JsonLd data={faqLd} />}
      <p className="mt-3 max-w-2xl text-lg text-ink-600">{t.intro}</p>
      <p className="mt-2 text-ink-500">{upcoming.length} upcoming. Details we haven&apos;t confirmed show as Not Announced; always check with the organiser.</p>
      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Browse runs">{TOPICS.filter((x) => x.slug !== t.slug).map((x) => <Link key={x.slug} href={`/${scopeParams().city}/${x.slug}`} className="badge">{x.h1.replace(" in Hyderabad", "").replace(" this month", " this month")}</Link>)}</nav>
      {upcoming.length === 0 && <p className="mt-8 rounded-2xl border border-line bg-white p-5">No upcoming runs in this list right now. <Link href={listingHref()} className="link">See all running events in Hyderabad</Link>.</p>}
      {groupByMonth(upcoming).map(({ key, label, items: runs }) => (
        <section key={key} className="mt-10">
          <h2 className="text-xl font-bold">{label}</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {runs.map((r) => (
              <li key={r.slug}><Link href={runHref(r.slug)} className="flex flex-wrap justify-between gap-2 px-5 py-4 hover:bg-ink-50">
                <span className="font-semibold">{r.title}</span>
                <span className="text-ink-500">{formatLong(r.date)}{placeLabel(r) ? ` · ${placeLabel(r)}` : ""}</span>
              </Link></li>
            ))}
          </ul>
        </section>
      ))}
      {past.length > 0 && <section className="mt-12"><h2 className="text-xl font-bold text-ink-500">Past events</h2>
        <ul className="mt-3 text-ink-500">{past.map((r) => <li key={r.slug}><Link href={runHref(r.slug)} className="hover:text-ink-900">{r.title} · {formatLong(r.date)}</Link></li>)}</ul></section>}
      {t.faqs.length > 0 && <section className="mt-12"><h2 className="text-xl font-bold">Questions runners ask</h2>
        <div className="mt-3 space-y-2">{t.faqs.map(([q, a]) => <details key={q} className="rounded-xl border border-line bg-white p-4"><summary className="font-semibold">{q}</summary><p className="mt-2 text-ink-600">{a}</p></details>)}</div></section>}
    </div>
  );
}
