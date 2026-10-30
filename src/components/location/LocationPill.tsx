"use client";

import { useLocation } from "./LocationProvider";

export function LocationPill({ compact = false }: { compact?: boolean }) {
  const { location, ready, openPicker } = useLocation();
  return (
    <button onClick={openPicker} className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-sm hover:border-ink-400"
      aria-label={location ? `Location: ${location.label}. Change` : "Set your location"}>
      <span aria-hidden>📍</span>
      <span className="truncate font-medium">{!ready ? "…" : location ? (compact ? location.label : `Near ${location.label}`) : "Set location"}</span>
      <span className="text-ink-400" aria-hidden>▾</span>
    </button>
  );
}
