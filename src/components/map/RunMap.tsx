"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Run } from "@/data/schema";
import { SITE } from "@/lib/site";
import { sportColour } from "@/lib/brand";
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

/** Event map on Leaflet + OpenStreetMap tiles (free, no API key). Markers use each sport's accent colour. */
export function RunMap({ runs, origin, className, zoom = 12 }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const you = useRef<L.Marker | null>(null);
  const originRef = useRef(origin);
  originRef.current = origin;

  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { center: [17.385, 78.4867], zoom: 10, scrollWheelZoom: false, zoomControl: true });
    L.tileLayer(SITE.tileUrl, { maxZoom: 19, attribution: SITE.tileAttribution }).addTo(map);
    layer.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layer.current) return;
    layer.current.clearLayers();
    const groups = groupByPlace(runs);
    for (const g of groups) {
      const n = g.runs.length;
      const icon = L.divIcon({
        className: "",
        html: `<button class="rc-marker" style="--mk:${sportColour(g.runs[0].sport)}" aria-label="${esc(g.runs.map((r) => r.title).join(", "))}">${n > 1 ? n : ""}</button>`,
        iconSize: [26, 26], iconAnchor: [13, 13],
      });
      const m = L.marker([g.at.lat, g.at.lng], { icon, zIndexOffset: 100 });
      m.bindPopup(() => popupHtml(g.runs, originRef.current), { maxWidth: 300, className: "rc-popup" });
      layer.current.addLayer(m);
    }
    if (groups.length === 1) map.setView([groups[0].at.lat, groups[0].at.lng], zoom);
    else if (groups.length > 1) map.fitBounds(L.latLngBounds(groups.map((g) => [g.at.lat, g.at.lng] as [number, number])), { padding: [40, 40], maxZoom: 13 });
  }, [runs, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    you.current?.remove();
    you.current = null;
    if (origin) {
      you.current = L.marker([origin.lat, origin.lng], {
        icon: L.divIcon({ className: "", html: `<div class="rc-you" title="Your location (approximate)"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
        zIndexOffset: -100, interactive: false, keyboard: false,
      }).addTo(map);
    }
  }, [origin?.lat, origin?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className={className ?? "h-[420px] w-full"} role="region" aria-label="Map of events" />;
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
