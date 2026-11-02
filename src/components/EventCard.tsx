"use client";

import Link from "next/link";
import type { Run } from "@/data/schema";
import { useMyRuns } from "@/lib/myRuns";
import { sportColour } from "@/lib/brand";
import { photoFor } from "@/lib/images";
import { formatDistance } from "@/lib/geo";
import { dayParts, placeLabel, relativeDay, runHref } from "@/lib/runs";
import { getSport } from "@/data/sports";
import { getPlace } from "@/data/locations";
import { SportIcon } from "./SportIcon";

const NA = <span className="na">Not Announced</span>;

/** The one event card used for every sport. Unknown details always read "Not Announced". */
export function EventCard({ run, now, away, featured = false }: { run: Run; now: Date; away?: number | null; featured?: boolean }) {
  const d = dayParts(run.date);
  const sport = getSport(run.sport)?.name ?? run.sport;
  const city = getPlace(run.city)?.name ?? "";
  const photo = photoFor(run, 700);
  const { has, toggle } = useMyRuns();
  const on = has(run.slug);
  const status = run.status !== "scheduled"
    ? { label: run.status === "cancelled" ? "Cancelled" : "Postponed", c: "var(--color-error)" }
    : run.registrationUrl ? { label: "Registration link available", c: "var(--color-success)" }
    : { label: "Registration: Not Announced", c: "var(--color-muted)" };

  return (
    <article className="ev-card" style={{ "--sport": sportColour(run.sport) } as React.CSSProperties}>
      <div className="ev-banner">
        {!photo.generic && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.src} alt={photo.caption} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        )}
        {photo.generic && <SportIcon sport={run.sport} className="ev-banner-ic" />}
        <span className="ev-date" aria-label={`${d.weekday} ${d.day} ${d.month} ${d.year}`}><b>{d.day}</b><span>{d.month}</span></span>
        <span className="ev-sport">{sport}</span>
        {featured && <span className="ev-feat">Featured</span>}
      </div>
      <div className="ev-body">
        <p className="label">{relativeDay(run.date, now)} · {d.weekday}, {d.day} {d.month} {d.year}</p>
        <h3 className="ev-title"><Link href={runHref(run.slug)} className="hover:text-blue">{run.title}</Link></h3>
        <p className="ev-meta">{run.venue ?? placeLabel(run) ?? "Venue Not Announced"}{city ? `, ${city}` : ""}{away != null && <> · <b className="text-navy">{formatDistance(away)}</b> straight-line</>}</p>
        <div className="ev-cats" aria-label="Categories">
          {run.distances.length ? run.distances.map((x) => <span key={x} className="badge">{x}</span>) : <span className="badge">Categories Not Announced</span>}
        </div>
        <dl className="ev-facts">
          <dt>Fee</dt><dd>{NA}</dd>
          <dt>Prize</dt><dd>{NA}</dd>
        </dl>
        <div className="ev-foot">
          <span className="ev-status" style={{ "--st": status.c } as React.CSSProperties}>{status.label}</span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Link href={runHref(run.slug)} className="btn-secondary flex-1">View Details</Link>
          <button className={`save-btn ${on ? "is-on" : ""}`} aria-pressed={on} aria-label={on ? `Remove ${run.title} from saved` : `Save ${run.title}`} onClick={() => toggle(run.slug)}>
            {on ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </article>
  );
}
