"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Run } from "@/data/schema";
import { SITE } from "@/lib/site";
import { formatDistance, haversineMetres, directionsUrl, type LatLng } from "@/lib/geo";
import { formatShort, runHref, placeLabel } from "@/lib/runs";

type Props = {
  runs: Run[];                 // runs without a location are ignored
  origin?: LatLng | null;      // visitor's chosen location (approximate)
  className?: string;
  zoom?: number;               // used when there is a single place
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Runs at the same spot share one marker; its popup lists them all. */
function groupByPlace(runs: Run[]) {
  const groups = new Map<string, { at: LatLng; runs: Run[] }>();
  for (const r of runs) {
    if (!r.location) continue;
    const k = `${r.location.lat.toFixed(4)},${r.location.lng.toFixed(4)}`;
    const g = groups.get(k) ?? { at: { lat: r.location.lat, lng: r.location.lng }, runs: [] };
    g.runs.push(r);
    groups.set(k, g);
  }
  return [...groups.values()];
}

/** Map of runs on MapLibre GL with free OpenStreetMap vector tiles (OpenFreeMap). */
export function RunMap({ runs, origin, className, zoom = 12 }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const you = useRef<maplibregl.Marker | null>(null);
  const originRef = useRef(origin);
  originRef.current = origin;

  useEffect(() => {
    if (!el.current) return;
    const map = new maplibregl.Map({
      container: el.current,
      style: SITE.mapStyle,
      center: [78.4867, 17.385],
      zoom: 10,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Markers for the current runs; refit when the set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markers.current.forEach((m) => m.remove());
    const groups = groupByPlace(runs);
    markers.current = groups.map((g) => {
      const node = document.createElement("button");
      node.className = "rc-marker";
      node.style.zIndex = "1";
      node.textContent = g.runs.length > 1 ? String(g.runs.length) : "";
      node.setAttribute("aria-label", g.runs.map((r) => r.title).join(", "));
      const popup = new maplibregl.Popup({ offset: 16, maxWidth: "300px" }).setHTML(popupHtml(g.runs, originRef.current));
      popup.on("open", () => popup.setHTML(popupHtml(g.runs, originRef.current)));
      return new maplibregl.Marker({ element: node }).setLngLat([g.at.lng, g.at.lat]).setPopup(popup).addTo(map);
    });
    if (groups.length === 1) map.jumpTo({ center: [groups[0].at.lng, groups[0].at.lat], zoom });
    else if (groups.length > 1) {
      const b = new maplibregl.LngLatBounds();
      groups.forEach((g) => b.extend([g.at.lng, g.at.lat]));
      map.fitBounds(b, { padding: 56, maxZoom: 13, duration: 0 });
    }
  }, [runs, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    you.current?.remove();
    you.current = null;
    if (origin) {
      const node = document.createElement("div");
      node.className = "rc-you";
      node.style.zIndex = "0"; // run pins stay clickable above it
      node.title = "Your chosen location (approximate)";
      you.current = new maplibregl.Marker({ element: node }).setLngLat([origin.lng, origin.lat]).addTo(map);
    }
  }, [origin?.lat, origin?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className={className ?? "h-[420px] w-full"} role="region" aria-label="Map of runs" />;
}

function popupHtml(runs: Run[], origin?: LatLng | null) {
  const first = runs[0].location!;
  const place = placeLabel(runs[0]) ?? "";
  const away = origin ? `<p class="rc-pop-meta">${formatDistance(haversineMetres(origin, first))} away, straight-line</p>` : "";
  const items = runs.map((r) => `
    <li><a href="${runHref(r.slug)}"><span class="rc-pop-date">${esc(formatShort(r.date))}</span>${esc(r.title)}</a></li>`).join("");
  return `
    <div class="rc-pop">
      <p class="rc-pop-place">${esc(place)}</p>
      ${first.precision === "area" ? `<p class="rc-pop-meta">Area pin, not the exact start point</p>` : ""}
      ${away}
      <ul>${items}</ul>
      <a class="rc-pop-dir" href="${directionsUrl(first)}" target="_blank" rel="noopener">Directions ↗</a>
    </div>`;
}
