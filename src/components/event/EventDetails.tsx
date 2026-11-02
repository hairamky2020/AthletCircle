// Reusable event details template for every sport. Sport-specific fields come from the sport's field schema.
import Link from "next/link";
import type { ReactNode } from "react";
import { RUNS } from "@/data/events";
import { FACILITIES, type SectionKey } from "@/data/details";
import { getSport, rootSport } from "@/data/sports";
import type { Run } from "@/data/schema";
import { JsonLd } from "@/components/JsonLd";
import { Tracker } from "@/components/Tracker";
import { RunArt } from "@/components/RunArt";
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


function Sub({ k, icon, tone = "blue", title, run, children }: { k: SectionKey; icon: string; tone?: "blue" | "orange" | "green" | "navy"; title: string; run: Run; children: ReactNode }) {
  return (
    <div className="ed-subsec">
      <div className="ed-subsec-head"><IconTile name={icon} tone={tone} size="sm" /><h3>{title}</h3><Source k={k} run={run} /></div>
      {children}
    </div>
  );
}


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
  const filledSport = sportFields.map(([key, f]) => [key, f, sportFieldValue(d.sportFields[key])] as const).filter((x): x is readonly [string, { title?: string }, string] => x[2] !== null);
  const hasMore = Boolean(d.overview || filledSport.length || d.prizes.length || d.awards.length || d.schedule.length || d.facilities.length || d.eligibility.length || d.rules.length || d.organizer.name || d.gallery.length || d.faqs.length);
  const fees = d.categories.filter((c) => c.fee);
  const feeSummary = fees.length === 0 ? null : fees.length === 1 ? fees[0].fee : `${fees.length} categories · see below`;
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
              <RunArt run={run} className="ed-art" />
            </div>
          </div>
          <Tracker slug={run.slug} />
        </div>
      </section>


      <div className="wrap ed-body">
        <div className="ed-main">
          {run.status !== "scheduled" && <p className="ed-alert" role="status">This event has been {run.status}. Check with the organizer for updates.</p>}

          {/* Card 1 · Essentials: the information everyone needs */}
          <section id="essentials" className="ed-card scroll-mt-28" aria-labelledby="ess-h">
            <header className="ed-card-head"><IconTile name="calendar" tone="orange" /><h2 id="ess-h">Event essentials</h2></header>
            <dl className="ed-ess">
              <div><IconTile name="calendar" tone="orange" size="sm" /><dt>Date</dt><dd>{formatLong(run.date)}{run.endDate && ` – ${formatLong(run.endDate)}`}</dd></div>
              <div><IconTile name="clock" tone="blue" size="sm" /><dt>Time</dt><dd>{run.startTime ? <>Starts {fmtTime(run.startTime)}{d.reportingTime && <span className="ed-sub"> · Report by {fmtTime(d.reportingTime)}</span>}</> : <Missing />}</dd></div>
              <div><IconTile name="pin" tone="blue" size="sm" /><dt>Venue</dt><dd>{run.venue ?? (run.area ? <>{run.area}<span className="ed-sub"> · exact venue not announced</span></> : <Missing />)}</dd></div>
              <div><IconTile name="ticket" tone="green" size="sm" /><dt>Categories &amp; fees</dt><dd>
                {d.categories.length ? <ul className="ed-catrow">{d.categories.map((c) => <li key={c.name}><b>{c.name}</b>{c.fee ? <span>{c.fee}</span> : <span className="na">Fee not announced</span>}</li>)}</ul>
                  : run.distances.length ? <>{run.distances.join(" · ")}<span className="ed-sub"> · fees not announced</span></> : <Missing />}
              </dd></div>
              <div><IconTile name="trophy" tone="orange" size="sm" /><dt>Prize money</dt><dd>{d.prizes.length ? d.prizes.map((p) => p.category).join(" · ") : <Missing />}</dd></div>
              <div><IconTile name="link" tone="navy" size="sm" /><dt>Registration</dt><dd className={`reg-${reg.tone}`}>{reg.label}</dd></div>
            </dl>
            <div className="ed-ess-actions">
              {run.registrationUrl && reg.tone === "ok" && <div className="w-full sm:w-auto sm:min-w-64"><RegisterCta /></div>}
              <div data-track="calendar_add"><AddToCalendar slug={run.slug} title={run.title} date={run.date} endDate={run.endDate} place={placeFull} url={url} /></div>
            </div>
            {!run.registrationUrl && run.status === "scheduled" && !isPast(run, now) && <p className="ed-small">No official registration link yet. <a href={webSearchUrl(run)} target="_blank" rel="noopener" className="link">Search the web ↗</a></p>}
            {run.location && (
              <div className="mt-5">
                <LazyMap runs={[run]} zoom={run.location.precision === "area" ? 13 : 15} height="h-[260px]" />
                <div className="ed-map-foot">
                  <span>{run.location.precision === "area" ? `The pin marks ${run.area}, not the exact start point.` : "The pin marks the venue."}</span>
                  <a href={directionsUrl(run.location)} target="_blank" rel="noopener" className="link">Get directions ↗</a>
                </div>
                <div className="mt-2"><DistanceFromYou to={run.location} precision={run.location.precision} /></div>
              </div>
            )}
            <p className="ed-card-src"><Source k="basics" run={run} /></p>
          </section>

          {/* Card 2 · More details: only what has actually been announced */}
          <section id="more" className="ed-card scroll-mt-28" aria-labelledby="more-h">
            <header className="ed-card-head"><IconTile name="info" tone="blue" /><h2 id="more-h">More details</h2></header>
            {!hasMore && <p className="ed-empty-line">The organizer hasn’t shared more details yet. Schedule, prizes, facilities, rules and organizer contact will appear here once announced.</p>}
            {d.overview && <Sub k="overview" icon="info" title="About this event" run={run}><div className="ed-prose">{d.overview.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div></Sub>}
            {run.note && <p className="ed-note">{run.note}</p>}
            {filledSport.length > 0 && <Sub k="sport" icon="sliders" tone="green" title={`${root?.name ?? sportName} details`} run={run}>
              <dl className="ed-kv">{filledSport.map(([key, f, v]) => <div key={key}><dt>{f.title ?? key}</dt><dd>{v}</dd></div>)}</dl>
            </Sub>}
            {d.categories.some((c) => c.cutoff || c.ageGroup || c.startTime || c.distance) && <Sub k="categories" icon="ticket" tone="green" title="Categories" run={run}>
              <div className="ed-cats">{d.categories.map((c) => (
                <article key={c.name} className="ed-cat">
                  <div className="ed-cat-top"><h4>{c.name}</h4>{c.fee && <span className="ed-fee">{c.fee}</span>}</div>
                  <dl>
                    {c.distance && <div><dt>Distance</dt><dd>{c.distance}</dd></div>}
                    {c.startTime && <div><dt>Start</dt><dd>{fmtTime(c.startTime)}</dd></div>}
                    {c.cutoff && <div><dt>Cut-off</dt><dd>{c.cutoff}</dd></div>}
                    {c.ageGroup && <div><dt>Age group</dt><dd>{c.ageGroup}</dd></div>}
                    {c.slots && <div><dt>Slots</dt><dd>{c.slots}</dd></div>}
                  </dl>
                </article>
              ))}</div>
            </Sub>}
            {(d.prizes.length > 0 || d.awards.length > 0) && <Sub k="prizes" icon="trophy" tone="orange" title="Prize money and awards" run={run}>
              {d.prizes.length > 0 && <div className="ed-prizes">{d.prizes.map((p) => (
                <article key={p.category} className="ed-prize">
                  <h4><Icon name="trophy" className="h-5 w-5" />{p.category}</h4>
                  <ol>{p.places.map((pl) => <li key={pl.place}><span>{pl.place}</span><b>{pl.award}</b></li>)}</ol>
                  {p.note && <p className="ed-small">{p.note}</p>}
                </article>
              ))}</div>}
              {d.awards.length > 0 && <ul className="ed-pills mt-3">{d.awards.map((a) => <li key={a}><Icon name="medal" className="h-4 w-4" />{a}</li>)}</ul>}
            </Sub>}
            {d.schedule.length > 0 && <Sub k="schedule" icon="timeline" title="Schedule" run={run}>
              <ol className="ed-timeline">{d.schedule.map((s, i) => (
                <li key={i}><span className="ed-tl-time">{s.date ? `${formatShort(s.date)} · ` : ""}{fmtTime(s.time) ?? "Time TBC"}</span><span className="ed-tl-item">{s.item}</span></li>
              ))}</ol>
            </Sub>}
            {d.facilities.length > 0 && <Sub k="facilities" icon="spark" tone="green" title="Participant facilities" run={run}>
              <ul className="ed-fac">{d.facilities.map((f) => <li key={f}><IconTile name={f} tone="green" size="sm" />{FACILITIES[f]}</li>)}</ul>
            </Sub>}
            {(d.eligibility.length > 0 || d.rules.length > 0) && <Sub k="eligibility" icon="rules" tone="navy" title="Eligibility and rules" run={run}>
              <div className="ed-two">
                {d.eligibility.length > 0 && <div><h4 className="ed-h3">Who can take part</h4><ul className="ed-ticks">{d.eligibility.map((e) => <li key={e}>{e}</li>)}</ul></div>}
                {d.rules.length > 0 && <div><h4 className="ed-h3">Rules</h4><ul className="ed-ticks">{d.rules.map((e) => <li key={e}>{e}</li>)}</ul></div>}
              </div>
            </Sub>}
            {d.organizer.name && <Sub k="organizer" icon="user" title="Organizer" run={run}>
              <div className="ed-org">
                <div className="ed-org-avatar" aria-hidden="true">{d.organizer.name.slice(0, 1)}</div>
                <div className="min-w-0">
                  <h4>{d.organizer.name}</h4>
                  <ul className="ed-org-links">
                    {d.organizer.email && <li><Icon name="mail" className="h-4 w-4" /><a href={`mailto:${d.organizer.email}`} className="link">{d.organizer.email}</a></li>}
                    {d.organizer.phone && <li><Icon name="phone" className="h-4 w-4" /><a href={`tel:${d.organizer.phone.replace(/\s/g, "")}`} className="link">{d.organizer.phone}</a></li>}
                    {d.organizer.website && <li><Icon name="globe" className="h-4 w-4" /><a href={d.organizer.website} target="_blank" rel="noopener" className="link">{new URL(d.organizer.website).hostname} ↗</a></li>}
                  </ul>
                </div>
              </div>
            </Sub>}
            {d.gallery.length > 0 && <Sub k="gallery" icon="image" tone="orange" title="Gallery and videos" run={run}>
              <ul className="ed-gallery">{d.gallery.map((g) => (
                <li key={g.url}>
                  {g.type === "image"
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={g.url} alt={g.caption ?? `${run.title} photo`} loading="lazy" />
                    : <a href={g.url} target="_blank" rel="noopener" className="ed-video"><Icon name="play" className="h-10 w-10" /><span>{g.caption ?? "Watch video"}</span></a>}
                  <span className="ed-credit">{g.credit}</span>
                </li>
              ))}</ul>
            </Sub>}
            <div className="ed-faqs mt-4">
              {d.faqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
              <details><summary>Good to know</summary>
                <ul className="ed-ticks pb-4"><li>You register on the organizer’s official page, not on AthletCircle.</li><li>“Not Announced” means the organizer hasn’t published it yet. We never guess.</li><li>Distances are straight-line, not road distance. Sharing your location is optional.</li></ul>
              </details>
            </div>
          </section>

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
