"use client";

import Link from "next/link";
import type { Run } from "@/data/schema";
import { useMyRuns } from "@/lib/myRuns";
import { sportColour } from "@/lib/brand";
import { RunArt } from "./RunArt";
import { formatDistance } from "@/lib/geo";
import { dayParts, placeLabel, relativeDay, runHref } from "@/lib/runs";
import { getSport } from "@/data/sports";
import { getPlace } from "@/data/locations";

const NA = <span className="na">Not Announced</span>;

/** The one event card used for every sport. Unknown details always read "Not Announced". */
export function EventCard({ run, now, away, featured = false }: { run: Run; now: Date; away?: number | null; featured?: boolean }) {
  const d = dayParts(run.date);
  const sport = getSport(run.sport)?.name ?? run.sport;
  const city = getPlace(run.city)?.name ?? "";
  const { has, toggle } = useMyRuns();
  const on = has(run.slug);
  const status = run.status !== "scheduled"
    ? { label: run.status === "cancelled" ? "Cancelled" : "Postponed", c: "var(--color-error)" }
    : run.registrationUrl ? { label: "Registration link available", c: "var(--color-success)" }
    : { label: "Registration: Not Announced", c: "var(--color-muted)" };

  return (
    <article className="ev-card" style={{ "--sport": sportColour(run.sport) } as React.CSSProperties}>
      <div className="ev-banner">
        <RunArt run={run} className="ev-art" />
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
          <dt>Fee</dt><dd>{feeFrom(run) ?? NA}</dd>
          <dt>Prize</dt><dd>{prizeText(run) ?? NA}</dd>
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

/** Lowest announced fee, as quoted text; never computed beyond picking the minimum. */
function feeFrom(run: { details?: { categories?: { fee?: string }[]; overview?: string } }): string | null {
  const nums = (run.details?.categories ?? []).map((c) => c.fee?.match(/₹\s?([\d,]+)/)?.[1]).filter(Boolean).map((n) => Number(n!.replace(/,/g, "")));
  if (!nums.length) { const m = run.details?.overview?.match(/from ₹\s?([\d,]+)/); return m ? `From ₹${m[1]}` : null; }
  const min = Math.min(...nums); return `${nums.length > 1 ? "From " : ""}₹${min.toLocaleString("en-IN")}`;
}
function prizeText(run: { details?: { prizes?: { places: { award: string }[] }[]; awards?: string[] } }): string | null {
  const top = run.details?.prizes?.[0]?.places?.[0]?.award; if (top) return `Up to ${top}`;
  return run.details?.awards?.length ? "Awards" : null;
}
