// Reusable event details template for every sport. Sport-specific fields come from the sport's field schema.
import Link from "next/link";
import type { ReactNode } from "react";
import { RUNS } from "@/data/events";
import { FACILITIES, type SectionKey } from "@/data/details";
import { getSport, rootSport } from "@/data/sports";
import type { Run } from "@/data/schema";
import { JsonLd } from "@/components/JsonLd";
import { Tracker } from "@/components/Tracker";
import { PlacePhoto } from "@/components/runs/PlacePhoto";
import { photoFor } from "@/lib/images";
import { AddToCalendar } from "@/components/runs/AddToCalendar";
import { RegisterToggle } from "@/components/runs/RegisterToggle";
import { DistanceFromYou } from "@/components/runs/DistanceFromYou";
import { LazyMap } from "@/components/map/LazyMap";
import { EventCard } from "@/components/EventCard";
import { SportIcon } from "@/components/SportIcon";
import { Icon, IconTile } from "@/components/event/Icons";
import { ShareBar } from "@/components/event/ShareBar";
import { formatLong, formatShort, placeLabel, webSearchUrl, runHref, isPast, dayParts, KINDS } from "@/lib/runs";
import { directionsUrl } from "@/lib/geo";
import { sportColour } from "@/lib/brand";
import { SITE } from "@/lib/site";


/** Shown wherever a detail hasn't been announced. Never guessed. */
const Missing = ({ label = "Not Announced" }: { label?: "Not Announced" | "Not Provided" | "To Be Confirmed" | "Not Applicable" }) =>
  <span className="na">{label}</span>;

const fmtTime = (t?: string) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return t;
  return `${((h + 11) % 12) + 1}:${String(m ?? 0).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

function Source({ k, run }: { k: SectionKey; run: Run }) {
  if (run.details.verified.includes(k)) return <span className="src src-verified"><Icon name="shield" className="h-3.5 w-3.5" />Verified by AthletCircle</span>;
  return <span className="src">{run.provenance === "organizer" ? "From the organizer" : "From public announcements"}</span>;
}

function Section({ id, k, icon, tone = "blue", title, run, children }: { id: string; k: SectionKey; icon: string; tone?: "blue" | "orange" | "green" | "navy"; title: string; run: Run; children: ReactNode }) {
  const na = run.details.notApplicable.includes(k);
  return (
    <section id={id} className="ed-sec scroll-mt-36" aria-labelledby={`${id}-h`}>
      <header className="ed-sec-head">
        <IconTile name={icon} tone={tone} />
        <h2 id={`${id}-h`}>{title}</h2>
        <Source k={k} run={run} />
      </header>
      {na ? <p className="ed-empty"><Missing label="Not Applicable" /></p> : children}
    </section>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <div className="ed-empty"><Missing />{children ? <span> · {children}</span> : null}</div>;

function registration(run: Run, now: Date) {
  if (run.status === "cancelled") return { label: "Event cancelled", tone: "err" as const };
  if (run.status === "postponed") return { label: "Event postponed", tone: "warn" as const };
  if (isPast(run, now)) return { label: "Event completed", tone: "muted" as const };
  if (run.registrationUrl) return { label: "Official registration link available", tone: "ok" as const };
  return { label: "Not Announced", tone: "warn" as const };
}

function sportFieldValue(v: unknown) {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : null;
  return String(v);
}

const NAV = [
  ["overview", "Overview"], ["when", "Date & time"], ["venue", "Venue"], ["categories", "Categories & fees"], ["prizes", "Prizes"],
  ["schedule", "Schedule"], ["facilities", "Facilities"], ["rules", "Eligibility & rules"], ["organizer", "Organizer"], ["gallery", "Gallery"], ["faqs", "FAQs"],
] as const;

export function EventDetails({ run, now = new Date(), similarPool = RUNS }: { run: Run; now?: Date; similarPool?: Run[] }) {
  const d = run.details;
  const place = placeLabel(run);
  const placeFull = place ? `${place}, Hyderabad` : "Hyderabad";
  const url = `${SITE.url}${runHref(run.slug)}`;
  const sport = getSport(run.sport);
  const root = rootSport(run.sport);
  const sportName = sport?.name ?? run.sport;
  const accent = sportColour(root?.slug ?? run.sport);
  const reg = registration(run, now);
  const day = dayParts(run.date);
  const sportFields = Object.entries((root?.schema.properties ?? {}) as Record<string, { title?: string }>);
  const similar = similarPool.filter((r) => r.slug !== run.slug && rootSport(r.sport)?.slug === root?.slug && !isPast(r, now))
    .sort((a, b) => Math.abs(Date.parse(a.date) - Date.parse(run.date)) - Math.abs(Date.parse(b.date) - Date.parse(run.date))).slice(0, 3)
    .sort((a, b) => a.date.localeCompare(b.date));
  const fees = d.categories.filter((c) => c.fee);
  const feeSummary = fees.length === 0 ? null : fees.length === 1 ? fees[0].fee : `${fees.length} categories · see below`;
  const prizeSummary = d.prizes.length ? `${d.prizes.length} prize ${d.prizes.length === 1 ? "category" : "categories"}` : null;
  const updated = run.updated ?? run.added;
  const kindLabel = KINDS[run.kind as keyof typeof KINDS]?.label;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: run.title,
    sport: sportName,
    startDate: run.startTime ? `${run.date}T${run.startTime}:00+05:30` : run.date,
    ...(run.endDate ? { endDate: run.endDate } : {}),
    ...(d.overview ? { description: d.overview } : {}),
    eventStatus: `https://schema.org/Event${run.status === "cancelled" ? "Cancelled" : run.status === "postponed" ? "Postponed" : "Scheduled"}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: run.venue ?? placeFull,
      address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressRegion: "Telangana", addressCountry: "IN" },
      ...(run.location?.precision === "venue" ? { geo: { "@type": "GeoCoordinates", latitude: run.location.lat, longitude: run.location.lng } } : {}),
    },
    ...(d.organizer.name ? { organizer: { "@type": "Organization", name: d.organizer.name, ...(d.organizer.website ? { url: d.organizer.website } : {}) } } : {}),
    url,
  };

  const RegisterCta = ({ big = false }: { big?: boolean }) =>
    run.registrationUrl && reg.tone === "ok"
      ? <a href={run.registrationUrl} data-track="register_click" target="_blank" rel="noopener nofollow" className={`btn-primary w-full justify-center${big ? " !min-h-12 text-base" : ""}`}>Register on official site ↗</a>
      : <span className="btn-disabled w-full justify-center" aria-disabled="true">{run.status === "scheduled" && !isPast(run, now) ? "Registration link not announced" : reg.label}</span>;

  return (
    <div className="ed" style={{ ["--accent" as string]: accent }}>
      <JsonLd data={jsonLd} />

      {/* 1 · Banner and basics */}
      <section className="ed-hero">
        <div className="wrap">
          <nav className="ed-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span>/</span><Link href="/#upcoming">{sportName} events</Link><span>/</span><span aria-current="page">{run.title}</span>
          </nav>
          <div className="ed-hero-grid">
            <div className="min-w-0">
              <div className="ed-chips">
                <span className="ed-sport"><SportIcon sport={root?.slug ?? run.sport} className="h-4 w-4" />{sportName}</span>
                {kindLabel && <span className="ed-chip">{kindLabel}</span>}
                {run.featured && <span className="ed-chip ed-chip-feat">Featured</span>}
                {run.status !== "scheduled" && <span className="ed-chip ed-chip-alert">{run.status === "cancelled" ? "Cancelled" : "Postponed"}</span>}
              </div>
              <h1>{run.title}</h1>
              <p className="ed-where"><Icon name="pin" className="h-5 w-5" />{place ? placeFull : "Hyderabad · venue not announced yet"}</p>
              <p className="tagline tagline-dark mt-4">Discover. Participate. Achieve.</p>
              <div className="ed-hero-actions">
                <div data-track="save"><RegisterToggle slug={run.slug} size="lg" /></div>
                <ShareBar slug={run.slug} title={run.title} when={formatLong(run.date)} url={url} />
              </div>
            </div>
            <div className="ed-banner">
              <div className="ed-banner-date"><b>{day.day}</b><span>{day.month}</span></div>
              <PlacePhoto photo={photoFor(run)} />
            </div>
          </div>
          <dl className="ed-facts">
            <div><IconTile name="calendar" tone="orange" size="sm" /><dt>Date</dt><dd>{formatLong(run.date)}</dd></div>
            <div><IconTile name="clock" tone="blue" size="sm" /><dt>Start time</dt><dd>{fmtTime(run.startTime) ?? <Missing />}</dd></div>
            <div><IconTile name="ticket" tone="green" size="sm" /><dt>Fee</dt><dd>{feeSummary ?? <Missing />}</dd></div>
            <div><IconTile name="trophy" tone="orange" size="sm" /><dt>Prizes</dt><dd>{prizeSummary ?? <Missing />}</dd></div>
            <div><IconTile name="link" tone="navy" size="sm" /><dt>Registration</dt><dd className={`reg-${reg.tone}`}>{reg.label}</dd></div>
          </dl>
          <Tracker slug={run.slug} />
        </div>
      </section>

      <nav className="ed-nav" aria-label="On this page">
        <ul className="wrap">{NAV.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ul>
      </nav>

      <div className="wrap ed-body">
        <div className="ed-main">
          {run.status !== "scheduled" && <p className="ed-alert" role="status">This event has been {run.status}. Check with the organizer for updates.</p>}

          {/* 8 · Overview */}
          <Section id="overview" k="overview" icon="info" title="Event overview" run={run}>
            {d.overview ? <div className="ed-prose">{d.overview.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
              : <Empty>The organizer hasn’t published a description yet.</Empty>}
            {run.note && <p className="ed-note">{run.note}</p>}
          </Section>

          {/* 2 · Sport-specific */}
          <Section id="sport" k="sport" icon="sliders" tone="green" title={`${root?.name ?? sportName} details`} run={run}>
            {sportFields.length === 0 ? <Empty>{null}</Empty> : (
              <dl className="ed-kv">
                <div><dt>Sport</dt><dd>{sportName}</dd></div>
                {kindLabel && <div><dt>Event type</dt><dd>{kindLabel}</dd></div>}
                {sportFields.map(([key, f]) => <div key={key}><dt>{f.title ?? key}</dt><dd>{sportFieldValue(d.sportFields[key]) ?? <Missing />}</dd></div>)}
              </dl>
            )}
          </Section>

          {/* 3 · Date, time, reporting time */}
          <Section id="when" k="timing" icon="calendar" tone="orange" title="Date and time" run={run}>
            <div className="ed-tiles">
              <div className="ed-tile"><IconTile name="calendar" tone="orange" /><span>Date</span><b>{formatLong(run.date)}{run.endDate && ` – ${formatLong(run.endDate)}`}</b></div>
              <div className="ed-tile"><IconTile name="bell" tone="blue" /><span>Reporting time</span><b>{fmtTime(d.reportingTime) ?? <Missing />}</b></div>
              <div className="ed-tile"><IconTile name="clock" tone="green" /><span>Start time</span><b>{fmtTime(run.startTime) ?? <Missing />}</b></div>
              <div className="ed-tile"><IconTile name="timeline" tone="navy" /><span>Ends</span><b>{fmtTime(d.endTime) ?? <Missing />}</b></div>
            </div>
            <div className="mt-4" data-track="calendar_add"><AddToCalendar slug={run.slug} title={run.title} date={run.date} endDate={run.endDate} place={placeFull} url={url} /></div>
          </Section>

          {/* 4 · Venue and map */}
          <Section id="venue" k="venue" icon="pin" tone="blue" title="Venue and map" run={run}>
            <dl className="ed-kv">
              <div><dt>Venue</dt><dd>{run.venue ?? <Missing />}</dd></div>
              <div><dt>Area</dt><dd>{run.area ?? <Missing />}</dd></div>
              <div><dt>City</dt><dd>Hyderabad</dd></div>
            </dl>
            {run.location ? (
              <div className="mt-4">
                <LazyMap runs={[run]} zoom={run.location.precision === "area" ? 13 : 15} height="h-[320px]" />
                <div className="ed-map-foot">
                  <span>{run.location.precision === "area" ? `The pin marks ${run.area}, not the exact start point.` : "The pin marks the venue."}</span>
                  <a href={directionsUrl(run.location)} target="_blank" rel="noopener" className="link">Get directions ↗</a>
                </div>
                <div className="mt-3"><DistanceFromYou to={run.location} precision={run.location.precision} /></div>
              </div>
            ) : <Empty>Map location not announced yet.</Empty>}
          </Section>

          {/* 5 · Categories and fees */}
          <Section id="categories" k="categories" icon="ticket" tone="green" title="Categories and registration fees" run={run}>
            {d.categories.length ? (
              <div className="ed-cats">
                {d.categories.map((c) => (
                  <article key={c.name} className="ed-cat">
                    <div className="ed-cat-top"><h3>{c.name}</h3><span className="ed-fee">{c.fee ?? <Missing />}</span></div>
                    <dl>
                      {c.distance && <div><dt>Distance</dt><dd>{c.distance}</dd></div>}
                      <div><dt>Start</dt><dd>{fmtTime(c.startTime) ?? <Missing />}</dd></div>
                      {c.cutoff && <div><dt>Cut-off</dt><dd>{c.cutoff}</dd></div>}
                      {c.ageGroup && <div><dt>Age group</dt><dd>{c.ageGroup}</dd></div>}
                      {c.slots && <div><dt>Slots</dt><dd>{c.slots}</dd></div>}
                    </dl>
                    {c.note && <p className="ed-small">{c.note}</p>}
                  </article>
                ))}
              </div>
            ) : run.distances.length ? (
              <div className="ed-cats">{run.distances.map((x) => <article key={x} className="ed-cat"><div className="ed-cat-top"><h3>{x}</h3><span className="ed-fee"><Missing /></span></div></article>)}</div>
            ) : <Empty>Categories and fees will appear here once announced.</Empty>}
          </Section>

          {/* 6 · Prizes and awards */}
          <Section id="prizes" k="prizes" icon="trophy" tone="orange" title="Prize money and awards" run={run}>
            {d.prizes.length || d.awards.length ? (
              <>
                {d.prizes.length > 0 && <div className="ed-prizes">{d.prizes.map((p) => (
                  <article key={p.category} className="ed-prize">
                    <h3><Icon name="trophy" className="h-5 w-5" />{p.category}</h3>
                    <ol>{p.places.map((pl) => <li key={pl.place}><span>{pl.place}</span><b>{pl.award}</b></li>)}</ol>
                    {p.note && <p className="ed-small">{p.note}</p>}
                  </article>
                ))}</div>}
                {d.awards.length > 0 && <ul className="ed-pills mt-4">{d.awards.map((a) => <li key={a}><Icon name="medal" className="h-4 w-4" />{a}</li>)}</ul>}
              </>
            ) : <Empty>Prize money and awards haven’t been announced.</Empty>}
          </Section>

          {/* 7 · Registration */}
          <Section id="registration" k="registration" icon="link" tone="navy" title="Registration" run={run}>
            <div className="ed-reg">
              <p className={`ed-reg-status reg-${reg.tone}`}><span className="dot" />{reg.label}</p>
              {run.registrationUrl && reg.tone === "ok"
                ? <p className="ed-small">Registration happens on the organizer’s official site, not on AthletCircle.</p>
                : run.status === "scheduled" && !isPast(run, now) && <p className="ed-small">No official link yet. <a href={webSearchUrl(run)} target="_blank" rel="noopener" className="link">Search the web ↗</a></p>}
              <div className="max-w-sm"><RegisterCta /></div>
              {run.websiteUrl && <p className="ed-small">Official website: <a href={run.websiteUrl} target="_blank" rel="noopener" className="link">{new URL(run.websiteUrl).hostname} ↗</a></p>}
            </div>
          </Section>

          {/* 9 · Schedule */}
          <Section id="schedule" k="schedule" icon="timeline" tone="blue" title="Event schedule" run={run}>
            {d.schedule.length ? (
              <ol className="ed-timeline">{d.schedule.map((s, i) => (
                <li key={i}><span className="ed-tl-time">{s.date ? `${formatShort(s.date)} · ` : ""}{fmtTime(s.time) ?? "Time TBC"}</span><span className="ed-tl-item">{s.item}</span></li>
              ))}</ol>
            ) : <Empty>The schedule will appear here once published.</Empty>}
          </Section>

          {/* 10 · Facilities */}
          <Section id="facilities" k="facilities" icon="spark" tone="green" title="Participant facilities" run={run}>
            {d.facilities.length ? (
              <ul className="ed-fac">{d.facilities.map((f) => <li key={f}><IconTile name={f} tone="green" size="sm" />{FACILITIES[f]}</li>)}</ul>
            ) : <Empty>Facilities haven’t been announced.</Empty>}
          </Section>

          {/* 11 · Eligibility and rules */}
          <Section id="rules" k="eligibility" icon="rules" tone="navy" title="Eligibility and rules" run={run}>
            {d.eligibility.length || d.rules.length ? (
              <div className="ed-two">
                <div><h3 className="ed-h3">Who can take part</h3>{d.eligibility.length ? <ul className="ed-ticks">{d.eligibility.map((e) => <li key={e}>{e}</li>)}</ul> : <Missing />}</div>
                <div><h3 className="ed-h3">Rules</h3>{d.rules.length ? <ul className="ed-ticks">{d.rules.map((e) => <li key={e}>{e}</li>)}</ul> : <Missing />}</div>
              </div>
            ) : <Empty>Eligibility and rules haven’t been announced.</Empty>}
          </Section>

          {/* 12 · Organizer */}
          <Section id="organizer" k="organizer" icon="user" tone="blue" title="Organizer" run={run}>
            {d.organizer.name ? (
              <div className="ed-org">
                <div className="ed-org-avatar" aria-hidden="true">{d.organizer.name.slice(0, 1)}</div>
                <div className="min-w-0">
                  <h3>{d.organizer.name}</h3>
                  <ul className="ed-org-links">
                    <li><Icon name="mail" className="h-4 w-4" />{d.organizer.email ? <a href={`mailto:${d.organizer.email}`} className="link">{d.organizer.email}</a> : <Missing label="Not Provided" />}</li>
                    <li><Icon name="phone" className="h-4 w-4" />{d.organizer.phone ? <a href={`tel:${d.organizer.phone.replace(/\s/g, "")}`} className="link">{d.organizer.phone}</a> : <Missing label="Not Provided" />}</li>
                    <li><Icon name="globe" className="h-4 w-4" />{d.organizer.website ? <a href={d.organizer.website} target="_blank" rel="noopener" className="link">{new URL(d.organizer.website).hostname} ↗</a> : <Missing label="Not Provided" />}</li>
                  </ul>
                </div>
              </div>
            ) : <Empty>Organizer details haven’t been provided.</Empty>}
          </Section>

          {/* 13 · Gallery and videos */}
          <Section id="gallery" k="gallery" icon="image" tone="orange" title="Gallery and videos" run={run}>
            {d.gallery.length ? (
              <ul className="ed-gallery">{d.gallery.map((g) => (
                <li key={g.url}>
                  {g.type === "image"
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={g.url} alt={g.caption ?? `${run.title} photo`} loading="lazy" />
                    : <a href={g.url} target="_blank" rel="noopener" className="ed-video"><Icon name="play" className="h-10 w-10" /><span>{g.caption ?? "Watch video"}</span></a>}
                  <span className="ed-credit">{g.credit}</span>
                </li>
              ))}</ul>
            ) : <Empty>No photos or videos yet. Organizers can send them to us.</Empty>}
          </Section>

          {/* 14 · FAQs */}
          <Section id="faqs" k="faqs" icon="help" tone="blue" title="Frequently asked questions" run={run}>
            <div className="ed-faqs">
              {d.faqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
              <details><summary>Do I register on AthletCircle?</summary><p>No. AthletCircle lists events. You register on the organizer’s official registration page, linked above when it has been published.</p></details>
              <details><summary>What does “Not Announced” mean?</summary><p>The organizer hasn’t published that detail yet. We show it as “Not Announced” instead of guessing, and update the page when it’s announced.</p></details>
              <details><summary>How far is it from me?</summary><p>Distances on AthletCircle are straight-line (as the crow flies), not road distance. Sharing your location is optional.</p></details>
            </div>
          </Section>

          <div className="ed-meta">
            <p><Icon name="history" className="h-4 w-4" />Last updated <b>{formatLong(updated)}</b> · Source: {run.source}</p>
            {d.history.length > 0 && (
              <details className="mt-2"><summary>Update history</summary>
                <ul>{d.history.map((h, i) => <li key={i}><b>{formatShort(h.date)}</b> · {h.change}</li>)}</ul>
              </details>
            )}
            <p className="mt-2">Event details can change. Please confirm important information with the official event organizer before registering or travelling. Spotted something wrong? <a className="link" href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Details for ${run.title}`)}`}>Tell us</a>.</p>
          </div>
        </div>

        {/* Sticky registration panel (desktop) */}
        <aside className="ed-side" aria-label="Registration">
          <div className="ed-panel">
            <p className="ed-panel-sport"><SportIcon sport={root?.slug ?? run.sport} className="h-4 w-4" />{sportName}</p>
            <p className="ed-panel-title">{run.title}</p>
            <ul className="ed-panel-facts">
              <li><Icon name="calendar" className="h-4 w-4" />{formatLong(run.date)}</li>
              <li><Icon name="clock" className="h-4 w-4" />{fmtTime(run.startTime) ?? <Missing />}</li>
              <li><Icon name="pin" className="h-4 w-4" />{placeFull}</li>
              <li><Icon name="ticket" className="h-4 w-4" />Fee: {feeSummary ?? <Missing />}</li>
            </ul>
            <p className={`ed-reg-status reg-${reg.tone}`}><span className="dot" />{reg.label}</p>
            <RegisterCta big />
            <div className="mt-4 border-t border-border pt-4"><p className="ed-panel-label">Share with friends</p><ShareBar slug={run.slug} title={run.title} when={formatLong(run.date)} url={url} compact /></div>
          </div>
        </aside>
      </div>

      {/* 15 · Similar events */}
      {similar.length > 0 && (
        <section className="wrap ed-similar" aria-labelledby="similar-h">
          <h2 id="similar-h" className="h2">Similar upcoming events</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{similar.map((r) => <li key={r.slug}><EventCard run={r} now={now} /></li>)}</ul>
        </section>
      )}

      {/* Mobile registration CTA */}
      <div className="ed-mobile-cta" role="region" aria-label="Register">
        <div className="min-w-0 flex-1"><p className="ed-m-title">{run.title}</p><p className={`ed-m-status reg-${reg.tone}`}>{reg.label}</p></div>
        {run.registrationUrl && reg.tone === "ok"
          ? <a href={run.registrationUrl} data-track="register_click" target="_blank" rel="noopener nofollow" className="btn-primary">Register ↗</a>
          : <a href="#registration" className="btn-secondary">Details</a>}
        <a href={`https://wa.me/?text=${encodeURIComponent(`${run.title} · ${formatLong(run.date)}\nDetails on AthletCircle: ${url}`)}`} target="_blank" rel="noopener" className="ed-m-wa" aria-label="Share on WhatsApp">
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" /></svg>
        </a>
      </div>
    </div>
  );
}
