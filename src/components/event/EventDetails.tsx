// Reusable event details template for every sport. Sport-specific fields come from the sport's field schema.
import Link from "next/link";
import { RUNS } from "@/data/events";
import { FACILITIES } from "@/data/details";
import { getSport, rootSport } from "@/data/sports";
import type { Run } from "@/data/schema";
import { JsonLd } from "@/components/JsonLd";
import { Tracker } from "@/components/Tracker";
import { RunArt, runTheme } from "@/components/RunArt";
import { Countdown } from "@/components/event/Countdown";
import { feeFrom } from "@/lib/fees";
import { AddToCalendar } from "@/components/runs/AddToCalendar";
import { RegisterToggle } from "@/components/runs/RegisterToggle";
import { DistanceFromYou } from "@/components/runs/DistanceFromYou";
import { LazyMap } from "@/components/map/LazyMap";
import { EventCard } from "@/components/EventCard";
import { SportIcon } from "@/components/SportIcon";
import { Icon, IconTile } from "@/components/event/Icons";
import { ShareBar } from "@/components/event/ShareBar";
import { formatLong, placeLabel, webSearchUrl, runHref, isPast, dayParts, KINDS } from "@/lib/runs";
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



/** Short label for the category ring: "21.1K", "5K", or the first word. */
const ringOf = (name: string, distance?: string) => (distance ?? name).match(/\d+(?:\.\d)?\s?K/i)?.[0].replace(/\s/, "").toUpperCase() ?? name.split(/\s/)[0].slice(0, 4);

function registration(run: Run, now: Date) {
  if (run.status === "cancelled") return { label: "Event cancelled", tone: "err" as const };
  if (run.status === "postponed") return { label: "Event postponed", tone: "warn" as const };
  if (isPast(run, now)) return { label: "Event completed", tone: "muted" as const };
  if (run.registrationUrl) return { label: "Official registration link available", tone: "ok" as const };
  return { label: "Not Announced", tone: "warn" as const };
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
  const similar = similarPool.filter((r) => r.slug !== run.slug && rootSport(r.sport)?.slug === root?.slug && !isPast(r, now))
    .sort((a, b) => Math.abs(Date.parse(a.date) - Date.parse(run.date)) - Math.abs(Date.parse(b.date) - Date.parse(run.date))).slice(0, 3)
    .sort((a, b) => a.date.localeCompare(b.date));
  const updated = run.updated ?? run.added;
  const kindLabel = KINDS[run.kind as keyof typeof KINDS]?.label;
  const theme = runTheme(run);
  const waves = d.categories.filter((c) => c.startTime).map((c) => ({ name: c.name, startTime: c.startTime! })).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const firstStart = run.startTime ?? waves[0]?.startTime;
  const closes = run.note?.match(/closes (?:around )?(\d{1,2}(?:[–-]\d{1,2})? \w{3}(?: \d{4})?)/i)?.[1] ?? null;
  const expo = run.note?.match(/expo on ([^.]+)/i)?.[1] ?? null;
  const fromFee = feeFrom(run)?.replace(/^From /, "") ?? null;
  const shortVenue = (run.venue ?? run.area ?? "").split(",")[0];
  const blob = JSON.stringify(d.categories).toLowerCase();
  const badges = [
    run.distances.length ? `${run.distances.length} categories` : null,
    /\btimed/.test(blob.replace(/not timed/g, "")) ? "Timed runs" : null,
    /kid|family|fun|walk/.test(blob) ? "Family friendly" : null,
    expo ? "Expo day before" : null,
    d.prizes.length ? "Prize money" : null,
  ].filter((x): x is string => !!x);

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

      {/* Hero: themed by the run name */}
      <section className={`ed-hero2 theme-${theme}`}>
        <div className="wrap ed-hero2-in">
          <nav className="ed-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span>/</span><Link href="/#upcoming">{sportName} events</Link><span>/</span><span aria-current="page">{run.title}</span>
          </nav>
          <div className="ed-chips">
            <span className="ed-sport"><SportIcon sport={root?.slug ?? run.sport} className="h-4 w-4" />{sportName}</span>
            {kindLabel && <span className="ed-chip">{kindLabel}</span>}
            {run.status !== "scheduled" && <span className="ed-chip ed-chip-alert">{run.status === "cancelled" ? "Cancelled" : "Postponed"}</span>}
          </div>
          <h1>{run.title}</h1>
          <p className="ed-where">{d.organizer.name && <>Organised by <b>{d.organizer.name}</b> · </>}{run.venue ?? (place ? placeFull : "Hyderabad · venue not announced yet")}</p>
          {badges.length > 0 && <ul className="ed-badges">{badges.map((b) => <li key={b}>{b}</li>)}</ul>}
          <div className="ed-hero-actions">
            <div data-track="save"><RegisterToggle slug={run.slug} size="lg" /></div>
            <ShareBar slug={run.slug} title={run.title} when={formatLong(run.date)} url={url} />
          </div>
          <Tracker slug={run.slug} />
        </div>
        <div className="ed-hero2-art" aria-hidden="true"><RunArt run={run} className="ed-art2" /></div>
      </section>

      <div className="wrap ed-body ed-body2">
        <div className="ed-main">
          {run.status !== "scheduled" && <p className="ed-alert" role="status">This event has been {run.status}. Check with the organizer for updates.</p>}

          {/* Fact tiles */}
          <dl className="ed-tiles">
            <div><IconTile name="calendar" tone="orange" size="sm" /><dt>Date</dt><dd><b>{day.day} {day.month}</b><span>{formatLong(run.date)}</span></dd></div>
            <div><IconTile name="clock" tone="blue" size="sm" /><dt>Start time</dt><dd>{firstStart ? <><b>{fmtTime(firstStart)}</b><span>{waves.length > 1 ? `First wave (${waves[0].name})` : d.reportingTime ? `Report by ${fmtTime(d.reportingTime)}` : "Start time"}</span></> : <Missing />}</dd></div>
            <div><IconTile name="pin" tone="blue" size="sm" /><dt>Venue</dt><dd>{run.venue || run.area ? <><b>{shortVenue}</b><span>{run.venue && run.area ? run.area : "Hyderabad"}</span></> : <Missing />}</dd></div>
            <div><IconTile name="link" tone="navy" size="sm" /><dt>Registration</dt><dd>{closes ? <><b className="ed-urgent">Closes {closes}</b><span>{run.registrationUrl ? "Official link available" : "Link not announced"}</span></> : <><b className={`reg-${reg.tone}`}>{reg.tone === "ok" ? "Open" : reg.label}</b><span>{reg.tone === "ok" ? "Closing date not announced" : ""}</span></>}</dd></div>
          </dl>

          {/* Race morning: expo, reporting and wave starts, only when announced */}
          {(expo || waves.length > 1 || d.reportingTime) && (
            <section className="ed-card" aria-labelledby="morning-h">
              <h2 id="morning-h" className="ed-h2">Race morning</h2>
              <ol className="ed-waves">
                {expo && <li className="is-expo"><b>Expo &amp; bib collection</b><span>{expo}</span></li>}
                {d.reportingTime && <li><b>{fmtTime(d.reportingTime)}</b><span>Reporting time</span></li>}
                {(waves.length ? waves : run.startTime ? [{ name: "Flag-off", startTime: run.startTime }] : []).map((w) => <li key={w.name + w.startTime}><b>{fmtTime(w.startTime)}</b><span>{w.name} flag-off</span></li>)}
              </ol>
            </section>
          )}

          {/* Categories & fees */}
          <section id="essentials" className="ed-card scroll-mt-28" aria-labelledby="cat-h">
            <h2 id="cat-h" className="ed-h2">Run categories &amp; fees</h2>
            {d.categories.length || run.distances.length ? (
              <table className="ed-tbl">
                <thead><tr><th>Category</th><th>Details</th><th>Fee</th></tr></thead>
                <tbody>{(d.categories.length ? d.categories : run.distances.map((x) => ({ name: x } as (typeof d.categories)[number]))).map((c, i) => (
                  <tr key={c.name + i}>
                    <td><span className="ed-ring">{ringOf(c.name, c.distance)}</span>{c.name}</td>
                    <td className="ed-tbl-sub">{[c.note, c.ageGroup, c.startTime && `Starts ${fmtTime(c.startTime)}`, c.cutoff && `Cut-off ${c.cutoff}`].filter(Boolean).join(" · ") || "–"}</td>
                    <td>{c.fee ?? (fromFee ? `From ${fromFee}` : <Missing />)}</td>
                  </tr>))}</tbody>
              </table>
            ) : <p className="ed-empty"><Missing /> Categories and fees haven’t been announced yet.</p>}
            {fromFee && !d.categories.some((c) => c.fee) && <p className="ed-small mt-3">Fee listed from {fromFee}. Per-category fees are on the official page.</p>}
          </section>

          {/* What's included */}
          <section id="more" className="ed-card" aria-labelledby="inc-h">
            <h2 id="inc-h" className="ed-h2">What’s included</h2>
            {d.facilities.length ? <ul className="ed-inc">{d.facilities.map((f) => <li key={f}><IconTile name={f} tone="orange" size="sm" />{FACILITIES[f]}</li>)}</ul>
              : <p className="ed-empty"><Missing /> The organiser hasn’t listed what’s included yet. Check the official page before registering.</p>}
          </section>

          {/* Prize money: only when announced */}
          {(d.prizes.length > 0 || d.awards.length > 0) && (
            <section className="ed-card" aria-labelledby="prize-h">
              <h2 id="prize-h" className="ed-h2">Prize money &amp; awards</h2>
              {d.prizes.length > 0 && <><ul className="ed-medals">{d.prizes[0].places.map((pl, i) => <li key={pl.place}><span>{["🥇", "🥈", "🥉"][i] ?? pl.place}</span>{pl.award}</li>)}</ul>
                <p className="ed-small mt-2">{d.prizes.length > 1 ? `${d.prizes.map((p) => p.category).join(", ")}` : d.prizes[0].category}{d.prizes[0].note ? ` · ${d.prizes[0].note}` : ""}</p></>}
              {d.awards.length > 0 && <ul className="ed-pills mt-3">{d.awards.map((a) => <li key={a}><Icon name="medal" className="h-4 w-4" />{a}</li>)}</ul>}
            </section>
          )}

          {/* Venue & map */}
          <section className="ed-card" aria-labelledby="venue-h">
            <h2 id="venue-h" className="ed-h2">Venue &amp; location</h2>
            <p className="ed-venue"><b>{run.venue ?? run.area ?? <Missing />}</b>{run.venue && run.area && run.venue !== run.area && <span> · {run.area}</span>}<span> · Hyderabad, Telangana</span></p>
            {run.location ? (
              <div className="mt-4">
                <LazyMap runs={[run]} zoom={run.location.precision === "area" ? 13 : 15} height="h-[260px]" />
                <div className="ed-map-foot">
                  <span>{run.location.precision === "area" ? `The pin marks ${run.area}, not the exact start point.` : "The pin marks the venue."}</span>
                  <a href={directionsUrl(run.location)} target="_blank" rel="noopener" className="link">Get directions ↗</a>
                </div>
                <div className="mt-2"><DistanceFromYou to={run.location} precision={run.location.precision} /></div>
              </div>
            ) : <p className="ed-small mt-2">Map pin will appear once the venue is announced.</p>}
          </section>

          {/* Organiser */}
          <section className="ed-card" aria-labelledby="org-h">
            <h2 id="org-h" className="ed-h2">Organiser</h2>
            {d.organizer.name ? (
              <div className="ed-org">
                <div className="ed-org-avatar" aria-hidden="true">{d.organizer.name.slice(0, 1)}</div>
                <div className="min-w-0"><h4>{d.organizer.name}</h4>
                  <ul className="ed-org-links">
                    {d.organizer.email && <li><Icon name="mail" className="h-4 w-4" /><a href={`mailto:${d.organizer.email}`} className="link">{d.organizer.email}</a></li>}
                    {d.organizer.phone && <li><Icon name="phone" className="h-4 w-4" /><a href={`tel:${d.organizer.phone.replace(/\s/g, "")}`} className="link">{d.organizer.phone}</a></li>}
                    {d.organizer.website && <li><Icon name="globe" className="h-4 w-4" /><a href={d.organizer.website} target="_blank" rel="noopener" className="link">{new URL(d.organizer.website).hostname} ↗</a></li>}
                    {!d.organizer.email && !d.organizer.phone && !d.organizer.website && <li className="ed-small">Contact not provided</li>}
                  </ul>
                </div>
              </div>
            ) : <p className="ed-empty"><Missing /> Organiser not announced.</p>}
          </section>

          <div className="ed-meta">
            <p><Icon name="history" className="h-4 w-4" />Last updated <b>{formatLong(updated)}</b> · Source: {run.source}</p>
            <p className="mt-2">Event details can change. Please confirm with the official organiser before registering or travelling. Spotted something wrong? <a className="link" href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Details for ${run.title}`)}`}>Tell us</a>.</p>
          </div>
        </div>

        {/* Sticky registration panel */}
        <aside className="ed-side" aria-label="Registration" id="registration">
          <div className="ed-panel">
            {!isPast(run, now) && run.status === "scheduled" && <><p className="ed-panel-label">Race starts in</p><Countdown iso={`${run.date}T${firstStart ?? "06:00"}:00+05:30`} /></>}
            <p className="ed-panel-fee">{fromFee ? <>From {fromFee}</> : <span className="text-base">Fee: <Missing /></span>}</p>
            <p className={`ed-reg-status ${closes ? "ed-urgent" : `reg-${reg.tone}`}`}><span className="dot" />{closes ? `Registration closes ${closes}` : reg.label}</p>
            <RegisterCta big />
            <div className="mt-3" data-track="calendar_add"><AddToCalendar slug={run.slug} title={run.title} date={run.date} endDate={run.endDate} place={placeFull} url={url} /></div>
            {!run.registrationUrl && run.status === "scheduled" && !isPast(run, now) && <p className="ed-small mt-3">No official registration link yet. <a href={webSearchUrl(run)} target="_blank" rel="noopener" className="link">Search the web ↗</a></p>}
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
