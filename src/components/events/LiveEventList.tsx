"use client";

import { useEffect, useState } from "react";
import type { EventSummary } from "@/lib/event-types";
import { searchEvents, type Filters } from "@/lib/search";
import { EventCard } from "./EventCard";

/**
 * Renders a list from build-time data, then re-filters with the visitor's clock after load so
 * past events disappear and "this weekend" stays correct between site rebuilds.
 */
export function LiveEventList({ events, filters = {}, limit = 12, layout = "grid", empty, from }: {
  events: EventSummary[]; filters?: Omit<Filters, "sports" | "origin"> & { sport?: string[] }; limit?: number;
  layout?: "grid" | "row"; empty?: React.ReactNode; from?: string;
}) {
  const [list, setList] = useState(events.slice(0, limit));
  useEffect(() => {
    const f: Filters = { ...filters, sports: filters.sport ? new Set(filters.sport) : undefined };
    setList(searchEvents(events, f, new Date()).slice(0, limit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, limit, JSON.stringify(filters)]);

  if (!list.length) return <>{empty ?? null}</>;
  if (layout === "row") {
    return (
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {list.map((e) => <div key={e.slug} className="snap-start"><EventCard e={e} compact from={from} /></div>)}
      </div>
    );
  }
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((e) => <EventCard key={e.slug} e={e} from={from} />)}</div>;
}
