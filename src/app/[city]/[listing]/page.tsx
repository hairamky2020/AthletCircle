import type { Metadata } from "next";
import Link from "next/link";
import { RUNS, SCOPE, scopeParams, listingHref } from "@/data/events";
import { formatLong, groupByMonth, isPast, placeLabel, runHref } from "@/lib/runs";

export const dynamicParams = false;
export const generateStaticParams = () => [scopeParams()];

const title = `${SCOPE.sportName} events in ${SCOPE.cityName}`;
export const metadata: Metadata = {
  title,
  description: `Every ${SCOPE.sportName.toLowerCase()} event in ${SCOPE.cityName}: dates, areas and official links, checked by AthletCircle.`,
  alternates: { canonical: listingHref() },
};

export default function ListingPage() {
  const now = new Date();
  const upcoming = RUNS.filter((r) => !isPast(r, now));
  const past = RUNS.filter((r) => isPast(r, now)).reverse();
  return (
    <div className="wrap pt-10">
      <nav className="text-sm text-ink-500" aria-label="Breadcrumb"><Link href="/" className="hover:text-ink-900">Home</Link> / {SCOPE.cityName} / {SCOPE.sportName}</nav>
      <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-600">{upcoming.length} upcoming. Details we haven&apos;t confirmed show as Not Announced; always check with the organiser.</p>
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
    </div>
  );
}
