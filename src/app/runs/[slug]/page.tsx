import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RUNS, getRun, otherRuns } from "@/data/events";
import { JsonLd } from "@/components/JsonLd";
import { DateBlock } from "@/components/runs/DateBlock";
import { AddToCalendar } from "@/components/runs/AddToCalendar";
import { RegisterToggle } from "@/components/runs/RegisterToggle";
import { DistanceFromYou } from "@/components/runs/DistanceFromYou";
import { LazyMap } from "@/components/map/LazyMap";
import { formatLong, formatShort, placeLabel, webSearchUrl, runHref, monthKey, formatMonth } from "@/lib/runs";
import { directionsUrl } from "@/lib/geo";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => RUNS.map((r) => ({ slug: r.slug }));

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const run = getRun((await params).slug);
  if (!run) return {};
  const where = placeLabel(run) ? `${placeLabel(run)}, Hyderabad` : "Hyderabad";
  return {
    title: `${run.title} · ${formatShort(run.date)}`,
    description: `${run.title} on ${formatLong(run.date)} in ${where}. Date, location and how to register.`,
    alternates: { canonical: runHref(run.slug) },
  };
}

const NOT_YET = <span className="text-ink-400">Not announced yet</span>;

export default async function RunPage({ params }: Params) {
  const run = getRun((await params).slug);
  if (!run) notFound();
  const place = placeLabel(run);
  const url = `${SITE.url}${runHref(run.slug)}`;
  const others = otherRuns(run);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: run.title,
    sport: "Running",
    startDate: run.startTime ? `${run.date}T${run.startTime}:00+05:30` : run.date,
    ...(run.endDate ? { endDate: run.endDate } : {}),
    eventStatus: `https://schema.org/Event${run.status === "cancelled" ? "Cancelled" : run.status === "postponed" ? "Postponed" : "Scheduled"}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: run.venue ?? (place ? `${place}, Hyderabad` : "Hyderabad"),
      address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressRegion: "Telangana", addressCountry: "IN" },
      ...(run.location?.precision === "venue" ? { geo: { "@type": "GeoCoordinates", latitude: run.location.lat, longitude: run.location.lng } } : {}),
    },
    url,
  };

  return (
    <div className="wrap pt-8">
      <JsonLd data={jsonLd} />
      <nav className="text-sm text-ink-500" aria-label="Breadcrumb">
        <Link href="/#upcoming" className="hover:text-ink-900">Runs</Link>
        <span className="mx-2">/</span>
        <Link href={`/?month=${monthKey(run.date)}#upcoming`} className="hover:text-ink-900">{formatMonth(monthKey(run.date))}</Link>
      </nav>

      {run.status !== "scheduled" && (
        <p className="mt-6 border-l-4 border-brand-500 bg-brand-50 px-4 py-3 font-semibold text-brand-700">
          This run has been {run.status}. Check with the organiser for updates.
        </p>
      )}

      <header className="mt-6 flex gap-6 rounded-3xl bg-white p-6 shadow-[0_10px_30px_-18px_rgba(12,12,10,.25)] md:p-10">
        <DateBlock date={run.date} size="lg" />
        <div className="min-w-0">
          {run.featured && <p className="eyebrow !text-brand-600">Featured</p>}
          <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">{run.title}</h1>
          <p className="mt-2 text-lg text-ink-600">{place ? `${place}, Hyderabad` : "Hyderabad · venue not announced yet"}</p>
          <div className="mt-5"><RegisterToggle slug={run.slug} size="lg" /></div>
        </div>
      </header>

      <div className="grid gap-12 py-8 lg:grid-cols-[1fr_320px]">
        <div>
          <dl className="grid grid-cols-[130px_1fr] gap-y-3 text-[16px]">
            <dt className="text-ink-500">Date</dt><dd>{formatLong(run.date)}{run.endDate && ` to ${formatLong(run.endDate)}`}</dd>
            <dt className="text-ink-500">Start time</dt><dd>{run.startTime ?? NOT_YET}</dd>
            <dt className="text-ink-500">Where</dt><dd>{run.venue ?? run.area ?? NOT_YET}</dd>
            <dt className="text-ink-500">Distances</dt><dd>{run.distances.length ? run.distances.join(", ") : NOT_YET}</dd>
            <dt className="text-ink-500">Registration</dt>
            <dd>{run.registrationUrl ? <a href={run.registrationUrl} target="_blank" rel="noopener nofollow" className="link font-semibold">Official registration page ↗</a> : <>No official link yet. <a href={webSearchUrl(run)} target="_blank" rel="noopener" className="link">Search the web ↗</a></>}</dd>
            {run.websiteUrl && <><dt className="text-ink-500">Website</dt><dd><a href={run.websiteUrl} target="_blank" rel="noopener" className="link">{new URL(run.websiteUrl).hostname} ↗</a></dd></>}
          </dl>
          {run.note && <p className="mt-6 border-l-2 border-line pl-4 text-sm text-ink-600">{run.note}</p>}

          {run.location && (
            <section className="mt-10">
              <LazyMap runs={[run]} zoom={run.location.precision === "area" ? 13 : 15} height="h-[340px]" />
              <p className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-ink-500">
                <span>{run.location.precision === "area" ? `The pin marks ${run.area}, not the exact start point.` : "The pin marks the venue."}</span>
                <a href={directionsUrl(run.location)} target="_blank" rel="noopener" className="link">Directions in Google Maps ↗</a>
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-8 text-[15px]">
          {run.location && (
            <section>
              <h2 className="eyebrow mb-2">How far</h2>
              <DistanceFromYou to={run.location} precision={run.location.precision} />
            </section>
          )}
          <section>
            <h2 className="eyebrow mb-2">Add to calendar</h2>
            <AddToCalendar slug={run.slug} title={run.title} date={run.date} endDate={run.endDate} place={place ? `${place}, Hyderabad` : "Hyderabad"} url={url} />
          </section>
          <section>
            <h2 className="eyebrow mb-2">Know more about this run?</h2>
            <p className="text-ink-600">Send us the start time, distances or the official link and we’ll add them. <a href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Details for ${run.title}`)}`} className="link">Email us</a></p>
          </section>
          <p className="text-xs text-ink-400">Always confirm details with the organiser before you travel.</p>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="border-t border-line pt-8">
          <h2 className="eyebrow mb-3">Around the same time</h2>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {others.map((o) => (
              <li key={o.slug} className="border-b border-line">
                <Link href={runHref(o.slug)} className="flex gap-4 py-3 hover:text-brand-600">
                  <span className="w-24 shrink-0 font-mono text-sm text-ink-500">{formatShort(o.date)}</span>
                  <span className="font-semibold">{o.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
