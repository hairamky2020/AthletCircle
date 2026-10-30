import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PUBLIC_EVENTS, getEvent, toSummary, relatedEvents, eventsByOrganiser, getOrganiser } from "@/data/events";
import { getSport, rootSport, schemaFor, sportHref } from "@/data/sports";
import { getPlace, placeHref } from "@/data/locations";
import { formatLongDate, formatTime, formatEventDate, formatShortDate } from "@/lib/dates";
import { registrationStatus } from "@/lib/registration";
import { statusInput } from "@/lib/search";
import { formatPrice, formatCategoryDistance } from "@/lib/format";
import { SITE } from "@/lib/site";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { StatusBadge, DemoBadge } from "@/components/events/StatusBadge";
import { TravelInfo } from "@/components/events/TravelInfo";
import { AddToCalendar } from "@/components/events/AddToCalendar";
import { LiveEventList } from "@/components/events/LiveEventList";
import { LazyMap } from "@/components/map/LazyMap";

export const dynamicParams = false;
export function generateStaticParams() {
  return PUBLIC_EVENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = getEvent((await params).slug);
  if (!e) return {};
  const city = getPlace(e.venue.city)!;
  const date = formatShortDate(new Date(e.start));
  return {
    title: `${e.title}, ${city.name} · ${date}`,
    description: e.summary ?? `${getSport(e.sport)!.name} event in ${city.name} on ${date}. Venue, distance, categories, fees and official registration link.`,
    alternates: { canonical: `/events/${e.slug}/` },
    robots: e.demo ? { index: false, follow: true } : undefined,
    openGraph: { title: e.title, type: "website", images: e.banner ? [e.banner] : undefined },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = getEvent((await params).slug);
  if (!e) notFound();
  const s = toSummary(e);
  const sport = getSport(e.sport)!;
  const root = rootSport(e.sport)!;
  const city = getPlace(e.venue.city)!;
  const state = getPlace(e.venue.city.split("/").slice(0, 2).join("/"))!;
  const locality = e.venue.locality ? getPlace(`${e.venue.city}/${e.venue.locality}`) : null;
  const organiser = e.organiser ? getOrganiser(e.organiser) : null;
  const status = registrationStatus(statusInput(s));
  const price = formatPrice(s);
  const start = new Date(e.start);
  const end = e.end ? new Date(e.end) : null;
  const canRegister = (status === "open" || status === "closing_soon" || status === "not_yet_open" || status === "unknown") && e.registrationUrl;
  const schema = schemaFor(e.sport);
  const attrs = Object.entries(schema.properties ?? {})
    .map(([k, f]) => ({ label: f.title ?? k, value: e.attributes[k] }))
    .filter((a) => a.value !== undefined && a.value !== null && a.value !== "")
    .map((a) => ({ ...a, value: Array.isArray(a.value) ? a.value.join(", ") : typeof a.value === "boolean" ? (a.value ? "Yes" : "No") : String(a.value) }));
  const related = relatedEvents(e, 6);
  const byOrg = organiser ? eventsByOrganiser(organiser.slug).upcoming.filter((x) => x.slug !== e.slug) : [];
  const url = `${SITE.url}/events/${e.slug}/`;
  const address = [e.venue.name, e.venue.address, locality && !e.venue.name.includes(locality.name) ? locality.name : null, city.name, state.name, e.venue.pincode].filter(Boolean).join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: e.title,
    description: e.summary ?? e.description,
    sport: sport.name,
    startDate: e.start,
    ...(e.end ? { endDate: e.end } : {}),
    eventStatus: `https://schema.org/${e.status === "cancelled" ? "EventCancelled" : e.status === "postponed" ? "EventPostponed" : "EventScheduled"}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place", name: e.venue.name,
      address: { "@type": "PostalAddress", streetAddress: e.venue.address, addressLocality: city.name, addressRegion: state.name, postalCode: e.venue.pincode, addressCountry: "IN" },
      geo: { "@type": "GeoCoordinates", latitude: e.venue.lat, longitude: e.venue.lng },
    },
    ...(e.banner ? { image: [e.banner] } : {}),
    ...(organiser ? { organizer: { "@type": "Organization", name: organiser.name, url: organiser.website } } : {}),
    ...(e.registrationUrl ? { offers: {
      "@type": "Offer", url: e.registrationUrl, price: e.isFree ? 0 : e.priceMin, priceCurrency: "INR",
      availability: status === "open" || status === "closing_soon" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      ...(e.registrationOpens ? { validFrom: e.registrationOpens } : {}),
    } } : {}),
    url,
  };

  return (
    <article className="pb-28 sm:pb-10">
      {!e.demo && <JsonLd data={jsonLd} />}
      <div className="border-b border-ink-100 bg-white">
        <div className="container-page py-6">
          <Breadcrumbs items={[
            { name: state.name, href: `/${state.path}/` },
            { name: city.name, href: `${placeHref(city.path)}/` },
            { name: root.name, href: `/${city.path}/${root.slug}/` },
            { name: e.title },
          ]} />
          {e.demo && (
            <p className="mt-4 rounded-xl bg-purple-50 p-3 text-sm text-purple-800 ring-1 ring-purple-200">
              <strong>Demo event.</strong> This is sample data to preview AthletCircle. It is not a real event; the registration link goes to example.com.
            </p>
          )}
          {e.status !== "scheduled" && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800 ring-1 ring-red-200">
              This event has been {e.status}. Check the organiser&apos;s official page for updates.
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link href={sportHref(e.sport)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold" style={{ background: sport.colour + "1a", color: sport.colour }}>
              <span aria-hidden>{sport.icon}</span>{sport.name}
            </Link>
            <StatusBadge status={status} closes={e.registrationCloses} />
            {e.demo && <DemoBadge />}
            {e.verification.verified && e.verification.lastVerified && (
              <span className="text-xs text-ink-500">✓ Verified {formatShortDate(new Date(e.verification.lastVerified))}</span>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{e.title}</h1>
          <p className="mt-2 text-lg text-ink-700">{formatEventDate(start, end)} · {e.venue.name}, {locality?.name && !e.venue.name.includes(locality.name) ? `${locality.name}, ` : ""}{city.name}</p>
          {e.summary && <p className="mt-3 max-w-3xl text-ink-600">{e.summary}</p>}
          <div className="mt-5 hidden flex-wrap items-center gap-3 sm:flex">
            {canRegister ? (
              <a href={e.registrationUrl!} target="_blank" rel="noopener nofollow" className="btn btn-primary px-6 text-base">Register on official site ↗</a>
            ) : (
              <span className="btn bg-ink-100 text-ink-500">{status === "closed" ? "Registration closed" : "Registration not available"}</span>
            )}
            {price && <span className="text-lg font-semibold">{price}</span>}
            {e.registrationCloses && status !== "closed" && <span className="text-sm text-ink-600">Registration closes {formatLongDate(new Date(e.registrationCloses))}</span>}
          </div>
        </div>
      </div>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="details">
            <h2 id="details" className="text-xl font-bold">Event details</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 rounded-2xl bg-white p-5 ring-1 ring-ink-100 sm:grid-cols-2">
              <Detail label="Date">{formatLongDate(start)}{end && formatLongDate(end) !== formatLongDate(start) ? ` to ${formatLongDate(end)}` : ""}</Detail>
              <Detail label="Start time">{formatTime(start)} IST</Detail>
              <Detail label="Venue">{e.venue.name}</Detail>
              <Detail label="Address">{address}</Detail>
              {organiser && <Detail label="Organiser"><Link className="font-semibold text-brand-600 hover:underline" href={`/organisers/${organiser.slug}/`}>{organiser.name}</Link></Detail>}
              {price && <Detail label="Registration fee">{price}</Detail>}
              {e.registrationOpens && <Detail label="Registration opens">{formatLongDate(new Date(e.registrationOpens))}</Detail>}
              {e.registrationCloses && <Detail label="Registration closes">{formatLongDate(new Date(e.registrationCloses))}</Detail>}
              <Detail label="Level">{e.level.charAt(0).toUpperCase() + e.level.slice(1)}</Detail>
              {(e.ageMin != null || e.ageMax != null) && <Detail label="Age eligibility">{e.ageMin != null && e.ageMax != null ? `${e.ageMin} to ${e.ageMax} years` : e.ageMin != null ? `${e.ageMin}+ years` : `Up to ${e.ageMax} years`}</Detail>}
              {e.format && <Detail label="Competition format">{e.format}</Detail>}
              {attrs.map((a) => <Detail key={a.label} label={a.label}>{a.value}</Detail>)}
            </dl>
          </section>

          {e.categories.length > 0 && (
            <section aria-labelledby="cats">
              <h2 id="cats" className="text-xl font-bold">Categories</h2>
              <div className="mt-3 overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-ink-50 text-ink-600"><tr>
                    <th className="px-4 py-2.5 font-semibold">Category</th>
                    {e.categories.some((c) => c.distanceM) && <th className="px-4 py-2.5 font-semibold">Distance</th>}
                    {e.categories.some((c) => c.ageMin != null || c.ageMax != null) && <th className="px-4 py-2.5 font-semibold">Age</th>}
                    {e.categories.some((c) => c.gender) && <th className="px-4 py-2.5 font-semibold">Gender</th>}
                    {e.categories.some((c) => c.fee != null) && <th className="px-4 py-2.5 font-semibold">Fee</th>}
                  </tr></thead>
                  <tbody className="divide-y divide-ink-100">
                    {e.categories.map((c) => (
                      <tr key={c.name}>
                        <td className="px-4 py-2.5 font-medium">{c.name}</td>
                        {e.categories.some((x) => x.distanceM) && <td className="px-4 py-2.5">{c.distanceM ? formatCategoryDistance(c.distanceM) : "–"}</td>}
                        {e.categories.some((x) => x.ageMin != null || x.ageMax != null) && <td className="px-4 py-2.5">{c.ageMin != null && c.ageMax != null ? `${c.ageMin}–${c.ageMax}` : c.ageMin != null ? `${c.ageMin}+` : c.ageMax != null ? `Under ${c.ageMax + 1}` : "Open"}</td>}
                        {e.categories.some((x) => x.gender) && <td className="px-4 py-2.5">{c.gender ?? "Open"}</td>}
                        {e.categories.some((x) => x.fee != null) && <td className="px-4 py-2.5">{c.fee != null ? (c.fee === 0 ? "Free" : `₹${c.fee.toLocaleString("en-IN")}`) : "–"}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {e.description && (
            <section aria-labelledby="about">
              <h2 id="about" className="text-xl font-bold">About this event</h2>
              <div className="mt-3 space-y-3 whitespace-pre-line text-ink-700">{e.description}</div>
            </section>
          )}

          <section aria-labelledby="where">
            <h2 id="where" className="text-xl font-bold">Location</h2>
            <p className="mt-1 text-sm text-ink-600">{address}</p>
            <div className="mt-3"><LazyMap events={[s]} center={{ lat: e.venue.lat, lng: e.venue.lng }} zoom={13} height="h-[320px]" /></div>
          </section>

          <section aria-labelledby="source" className="rounded-2xl bg-ink-50 p-5 text-sm text-ink-600">
            <h2 id="source" className="font-semibold text-ink-900">Where this information comes from</h2>
            <p className="mt-1">
              {e.verification.lastVerified ? `Last verified on ${formatLongDate(new Date(e.verification.lastVerified))}. ` : ""}
              Always confirm details on the official page before you register.
            </p>
            <ul className="mt-2 space-y-1">
              {e.verification.sources.map((u) => <li key={u}><a href={u} target="_blank" rel="noopener nofollow" className="break-all text-brand-600 hover:underline">{u}</a></li>)}
              {e.websiteUrl && !e.verification.sources.includes(e.websiteUrl) && <li><a href={e.websiteUrl} target="_blank" rel="noopener nofollow" className="break-all text-brand-600 hover:underline">Official website</a></li>}
            </ul>
            <p className="mt-3">Spotted something wrong?{" "}
              <a className="font-semibold text-brand-600 hover:underline" href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Correction: ${e.title}`)}&body=${encodeURIComponent(`Event: ${url}\n\nWhat needs correcting:\n`)}`}>Report a correction</a>
            </p>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <TravelInfo slug={e.slug} venue={{ lat: e.venue.lat, lng: e.venue.lng, name: e.venue.name }} />
          <div className="rounded-2xl bg-white p-4 ring-1 ring-ink-100">
            <p className="mb-2 text-sm font-semibold text-ink-500">Add to calendar</p>
            <AddToCalendar ev={{ uid: e.slug, title: e.title, start: e.start, end: e.end ?? new Date(start.getTime() + 3 * 36e5).toISOString(), location: address, url, description: e.summary }} />
          </div>
          {(e.contactEmail || e.contactPhone || Object.keys(e.social).length > 0) && (
            <div className="rounded-2xl bg-white p-4 text-sm ring-1 ring-ink-100">
              <p className="mb-2 font-semibold text-ink-500">Contact the organiser</p>
              {e.contactEmail && <p><a className="text-brand-600 hover:underline" href={`mailto:${e.contactEmail}`}>{e.contactEmail}</a></p>}
              {e.contactPhone && <p><a className="text-brand-600 hover:underline" href={`tel:${e.contactPhone.replace(/\s/g, "")}`}>{e.contactPhone}</a></p>}
              {Object.entries(e.social).map(([k, v]) => <p key={k}><a className="capitalize text-brand-600 hover:underline" href={v} target="_blank" rel="noopener nofollow">{k}</a></p>)}
            </div>
          )}
        </aside>
      </div>

      {byOrg.length > 0 && (
        <section className="container-page mt-12">
          <h2 className="text-xl font-bold">More from {organiser!.name}</h2>
          <div className="mt-4"><LiveEventList events={byOrg} layout="row" limit={8} from="event-organiser" /></div>
        </section>
      )}
      {related.length > 0 && (
        <section className="container-page mt-12">
          <h2 className="text-xl font-bold">Similar {root.name.toLowerCase()} events nearby</h2>
          <div className="mt-4"><LiveEventList events={related} layout="row" limit={6} from="event-related" /></div>
        </section>
      )}

      {/* Mobile: sticky registration bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{price ?? sport.name}</p>
            <StatusBadge status={status} closes={e.registrationCloses} />
          </div>
          {canRegister ? <a href={e.registrationUrl!} target="_blank" rel="noopener nofollow" className="btn btn-primary">Register ↗</a>
            : <span className="btn bg-ink-100 text-ink-500">Closed</span>}
        </div>
      </div>
    </article>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-ink-800">{children}</dd>
    </div>
  );
}
