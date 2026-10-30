import type { EventSummary } from "@/lib/event-types";
import { EventCard } from "./EventCard";

/** Horizontal, scrollable row of cards (mobile-friendly). */
export function EventRow({ events, from }: { events: EventSummary[]; from?: string }) {
  if (!events.length) return null;
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
      {events.map((e) => <div key={e.slug} className="snap-start"><EventCard e={e} compact from={from} /></div>)}
    </div>
  );
}
