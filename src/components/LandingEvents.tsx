import Link from "next/link";
import type { EventSummary } from "@/lib/event-types";
import { LiveEventList } from "@/components/events/LiveEventList";
import { LazyMap } from "@/components/map/LazyMap";
import type { LatLng } from "@/lib/geo";

/** Events block used by sport, city, state and locality pages: map + live list. */
export function LandingEvents({ events, center, zoom, emptyHint, from }: {
  events: EventSummary[]; center?: LatLng; zoom?: number; emptyHint?: React.ReactNode; from: string;
}) {
  if (!events.length) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-ink-100">
        <p className="font-semibold">No upcoming events listed here yet.</p>
        <p className="mt-1 text-sm text-ink-600">{emptyHint ?? <>Know of one? <Link className="font-semibold text-brand-600" href="/list-your-event/">List it free</Link>.</>}</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <LazyMap events={events} center={center} zoom={zoom} fitToEvents={!center} height="h-[300px] sm:h-[380px]" />
      <LiveEventList events={events} limit={60} from={from}
        empty={<p className="rounded-2xl bg-white p-6 text-ink-600 ring-1 ring-ink-100">These events have now taken place. <Link className="font-semibold text-brand-600" href="/calendar/">See the calendar</Link>.</p>} />
    </div>
  );
}

export function PageHero({ eyebrow, title, intro, children }: { eyebrow?: React.ReactNode; title: string; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="container-page py-8">
        {eyebrow}
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-3xl text-ink-600">{intro}</p>}
        {children}
      </div>
    </div>
  );
}
