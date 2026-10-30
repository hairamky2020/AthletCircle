"use client";

import Link from "next/link";
import type { EventSummary } from "@/lib/event-types";
import { formatEventDate } from "@/lib/dates";
import { formatDistance, haversineMetres } from "@/lib/geo";
import { registrationStatus } from "@/lib/registration";
import { statusInput } from "@/lib/search";
import { formatPrice } from "@/lib/format";
import { useLocation } from "@/components/location/LocationProvider";
import { StatusBadge, DemoBadge } from "./StatusBadge";

/** Event card. Distance is computed in the browser from the visitor's chosen location (straight-line). */
export function EventCard({ e, distanceM, compact = false, from }: { e: EventSummary; distanceM?: number | null; compact?: boolean; from?: string }) {
  const { location } = useLocation();
  const d = distanceM ?? (location ? haversineMetres(location, e) : null);
  const status = registrationStatus(statusInput(e));
  const price = formatPrice(e);
  const canRegister = (status === "open" || status === "closing_soon") && e.registrationUrl;

  return (
    <article className={`group relative flex flex-col rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition hover:border-ink-200 hover:shadow-md ${compact ? "w-[280px] shrink-0 sm:w-[300px]" : ""}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg" style={{ background: e.colour + "1a", border: `2px solid ${e.colour}` }} aria-hidden>{e.icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: e.colour }}>{e.sportName}</span>
        <span className="ml-auto flex gap-1">{e.demo && <DemoBadge />}{e.featured && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">Featured</span>}</span>
      </div>
      <h3 className="text-base font-bold leading-snug">
        <Link href={`/events/${e.slug}/`} className="after:absolute after:inset-0 hover:text-brand-600">{e.title}</Link>
      </h3>
      <p className="mt-1 text-sm text-ink-600">{formatEventDate(new Date(e.start), e.end ? new Date(e.end) : null)}</p>
      <p className="text-sm text-ink-500">{e.venueName}{e.localityName && !e.venueName.includes(e.localityName) ? `, ${e.localityName}` : ""} · {e.cityName}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {d != null && (
          <span className="text-sm font-semibold text-ink-900" title="Straight-line distance from your chosen location">
            {formatDistance(d)} away <span className="font-normal text-ink-500">(straight-line)</span>
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 pt-1">
        <StatusBadge status={status} closes={e.regCloses} />
        {price && <span className="text-sm text-ink-600">{price}</span>}
        {canRegister && (
          <a href={e.registrationUrl!} target="_blank" rel="noopener nofollow" data-from={from}
            className="relative z-10 ml-auto rounded-lg px-2 py-1 text-sm font-semibold text-brand-600 hover:bg-brand-50">
            Register ↗
          </a>
        )}
      </div>
    </article>
  );
}
