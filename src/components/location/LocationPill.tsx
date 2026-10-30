"use client";

import { useLocation } from "./LocationProvider";

export function LocationPill() {
  const { location, ready, openPicker } = useLocation();
  return (
    <button onClick={openPicker} className="inline-flex max-w-[200px] items-center gap-1.5 text-sm text-ink-700 hover:text-ink-900"
      aria-label={location ? `Location: ${location.label}. Change` : "Set your location"}>
      <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden className="shrink-0"><path d="M6 13.5S1 8.6 1 5.5a5 5 0 0 1 10 0c0 3.1-5 8-5 8Z" fill="none" stroke="currentColor" strokeWidth="1.4"/><circle cx="6" cy="5.5" r="1.6" fill="currentColor"/></svg>
      <span className="truncate">{!ready ? "…" : location ? location.label : "Set your location"}</span>
    </button>
  );
}
