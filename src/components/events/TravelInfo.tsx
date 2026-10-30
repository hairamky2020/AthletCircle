"use client";

import { useEffect, useState } from "react";
import { useLocation } from "@/components/location/LocationProvider";
import { formatDistance, formatDuration, haversineMetres, directionsUrl, type LatLng } from "@/lib/geo";
import { SITE } from "@/lib/site";

type Route = { distanceM: number; durationS: number };
const TTL = 24 * 36e5;

/**
 * Distance from the visitor's chosen location: straight-line always; road distance and car time
 * only when the free OSRM (OpenStreetMap) routing service returns a route. Never estimated.
 */
export function TravelInfo({ slug, venue }: { slug: string; venue: LatLng & { name: string } }) {
  const { location, openPicker } = useLocation();
  const [route, setRoute] = useState<Route | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "none">("idle");

  useEffect(() => {
    setRoute(null);
    if (!location || !SITE.routingUrl) return;
    const o = { lat: +location.lat.toFixed(3), lng: +location.lng.toFixed(3) }; // ~100 m precision is enough for routing
    const key = `ac.route.${slug}.${o.lat},${o.lng}`;
    try {
      const cached = JSON.parse(localStorage.getItem(key) ?? "null");
      if (cached && Date.now() - cached.t < TTL) { setRoute(cached.r); return; }
    } catch {}
    const ctrl = new AbortController();
    setState("loading");
    fetch(`${SITE.routingUrl}/route/v1/driving/${o.lng},${o.lat};${venue.lng},${venue.lat}?overview=false&alternatives=false`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { code: string; routes?: { distance: number; duration: number }[] }) => {
        const r0 = d.code === "Ok" ? d.routes?.[0] : undefined;
        if (!r0) { setState("none"); return; }
        const r = { distanceM: r0.distance, durationS: r0.duration };
        setRoute(r); setState("idle");
        try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), r })); } catch {}
      })
      .catch(() => { if (!ctrl.signal.aborted) setState("none"); });
    return () => ctrl.abort();
  }, [location, slug, venue.lat, venue.lng]);

  const straight = location ? haversineMetres(location, venue) : null;

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-ink-100">
      <p className="text-sm font-semibold text-ink-500">How far is it?</p>
      {straight == null ? (
        <p className="mt-1 text-sm">
          <button onClick={openPicker} className="font-semibold text-brand-600 hover:underline">Set your location</button> to see the distance and travel time.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          <li><strong className="text-lg">{formatDistance(straight)}</strong> <span className="text-sm text-ink-500">away (straight-line) from {location!.label}</span></li>
          {route && (
            <>
              <li><strong>{formatDistance(route.distanceM)}</strong> <span className="text-sm text-ink-500">by road</span></li>
              <li><strong>{formatDuration(route.durationS)}</strong> <span className="text-sm text-ink-500">by car, without live traffic</span></li>
            </>
          )}
          {state === "loading" && <li className="text-sm text-ink-400">Checking road distance…</li>}
          {state === "none" && !route && <li className="text-sm text-ink-500">Road distance isn&apos;t available right now; showing straight-line distance only.</li>}
        </ul>
      )}
      <a href={directionsUrl(venue)} target="_blank" rel="noopener" className="btn btn-ghost mt-3 w-full !py-2 text-sm">🧭 Get directions</a>
      {route && <p className="mt-2 text-[11px] text-ink-400">Road distance: OSRM, © OpenStreetMap contributors</p>}
    </div>
  );
}
