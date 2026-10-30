"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { EventSummary } from "@/lib/event-types";
import { SITE } from "@/lib/site";
import { formatDistance, haversineMetres, directionsUrl, type LatLng } from "@/lib/geo";
import { formatEventDate } from "@/lib/dates";
import { registrationStatus, STATUS_LABEL } from "@/lib/registration";
import { statusInput } from "@/lib/search";

export type MapBounds = { w: number; s: number; e: number; n: number };

type Props = {
  events: EventSummary[];
  center?: LatLng;
  zoom?: number;
  origin?: LatLng | null;        // visitor location (shown as a soft dot, used for distances)
  radiusKm?: number | null;      // draws a ring around the origin
  fitToEvents?: boolean;
  className?: string;
  onMoveEnd?: (b: MapBounds, centre: LatLng, zoom: number) => void;
  onMarkerClick?: (slug: string) => void;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function circle(c: LatLng, km: number, steps = 72) {
  const coords: [number, number][] = [];
  const dLat = km / 110.574;
  const dLng = km / (111.32 * Math.cos((c.lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    coords.push([c.lng + dLng * Math.cos(t), c.lat + dLat * Math.sin(t)]);
  }
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [coords] } };
}

/**
 * Interactive event map on MapLibre GL with free OpenStreetMap vector tiles (OpenFreeMap).
 * Nearby pins cluster into count bubbles; single events show a round sport-icon marker.
 */
export function EventMap({ events, center, zoom = 10, origin, radiusKm, fitToEvents, className, onMoveEnd, onMarkerClick }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markers = useRef(new Map<string, maplibregl.Marker>());
  const youMarker = useRef<maplibregl.Marker | null>(null);
  const eventsRef = useRef(events);
  const bboxLocked = useRef(false); // after the visitor pans, don't jump the map when results change
  const originRef = useRef(origin);
  const cbRef = useRef({ onMoveEnd, onMarkerClick });
  eventsRef.current = events;
  originRef.current = origin;
  cbRef.current = { onMoveEnd, onMarkerClick };

  // Create the map once.
  useEffect(() => {
    if (!el.current) return;
    const map = new maplibregl.Map({
      container: el.current,
      style: SITE.mapStyle,
      center: center ? [center.lng, center.lat] : [78.9629, 22.5937],
      zoom: center ? zoom : 4,
      attributionControl: { compact: true },
      cooperativeGestures: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("events", { type: "geojson", data: toGeoJSON(eventsRef.current), cluster: true, clusterRadius: 44, clusterMaxZoom: 13 });
      // Invisible layer so the source's tiles load; markers themselves are HTML elements.
      map.addLayer({ id: "events-anchor", type: "circle", source: "events", paint: { "circle-radius": 1, "circle-opacity": 0, "circle-stroke-opacity": 0 } });
      map.addSource("radius", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "radius-fill", type: "fill", source: "radius", paint: { "fill-color": "#ff5a1f", "fill-opacity": 0.06 } });
      map.addLayer({ id: "radius-line", type: "line", source: "radius", paint: { "line-color": "#ff5a1f", "line-width": 1.5, "line-dasharray": [2, 2] } });
      syncMarkers();
      syncRadius();
      if (fitToEvents) fit();
    });
    map.on("dragstart", () => { bboxLocked.current = true; });
    map.on("moveend", () => {
      syncMarkers();
      const b = map.getBounds();
      const c = map.getCenter();
      cbRef.current.onMoveEnd?.({ w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() }, { lat: c.lat, lng: c.lng }, map.getZoom());
    });
    map.on("sourcedata", (ev) => { if (ev.sourceId === "events" && ev.isSourceLoaded) syncMarkers(); });

    function syncMarkers() {
      if (!map.getSource("events")) return;
      const seen = new Set<string>();
      for (const f of map.querySourceFeatures("events")) {
        const p = f.properties as Record<string, unknown>;
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        const id = p.cluster ? `c${p.cluster_id}` : String(p.slug);
        if (seen.has(id)) continue;
        seen.add(id);
        if (markers.current.has(id)) continue;
        const node = document.createElement("button");
        if (p.cluster) {
          const n = Number(p.point_count);
          const size = n < 10 ? 34 : n < 50 ? 42 : 50;
          node.className = "ac-cluster";
          node.style.width = node.style.height = `${size}px`;
          node.textContent = String(n);
          node.setAttribute("aria-label", `${n} events here, zoom in`);
          node.onclick = async () => {
            const z = await (map.getSource("events") as GeoJSONSource).getClusterExpansionZoom(Number(p.cluster_id));
            map.easeTo({ center: coords, zoom: z + 0.5 });
          };
        } else {
          node.className = `ac-marker${p.status !== "scheduled" ? " is-off" : ""}`;
          node.style.setProperty("--marker", String(p.colour));
          node.textContent = String(p.icon);
          node.setAttribute("aria-label", String(p.title));
          node.onclick = (e) => { e.stopPropagation(); openPopup(String(p.slug), coords); };
        }
        markers.current.set(id, new maplibregl.Marker({ element: node }).setLngLat(coords).addTo(map));
      }
      for (const [id, m] of markers.current) if (!seen.has(id)) { m.remove(); markers.current.delete(id); }
    }

    function openPopup(slug: string, coords: [number, number]) {
      const e = eventsRef.current.find((x) => x.slug === slug);
      if (!e) return;
      cbRef.current.onMarkerClick?.(slug);
      const o = originRef.current;
      const st = registrationStatus(statusInput(e));
      const reg = (st === "open" || st === "closing_soon") && e.registrationUrl;
      const html = `
        <div style="min-width:220px;max-width:260px;font-family:inherit">
          <div style="font-size:12px;font-weight:600;color:${esc(e.colour)}">${esc(e.icon)} ${esc(e.sportName)}${e.demo ? ' · <span style="color:#7e22ce">Demo</span>' : ""}</div>
          <div style="font-weight:700;font-size:15px;line-height:1.3;margin:2px 0 4px">${esc(e.title)}</div>
          <div style="font-size:13px;color:#4c5870">${esc(formatEventDate(new Date(e.start), e.end ? new Date(e.end) : null))}</div>
          <div style="font-size:13px;color:#64718a">${esc(e.venueName)}, ${esc(e.cityName)}</div>
          ${o ? `<div style="font-size:13px;font-weight:600;margin-top:4px">${formatDistance(haversineMetres(o, e))} away <span style="font-weight:400;color:#64718a">(straight-line)</span></div>` : ""}
          <div style="font-size:12px;margin-top:4px;color:#3a4459">${esc(STATUS_LABEL[st])}</div>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            <a href="/events/${esc(e.slug)}/" style="background:#0f1a2c;color:white;padding:6px 10px;border-radius:8px;font-size:13px;font-weight:600">View event</a>
            ${reg ? `<a href="${esc(e.registrationUrl!)}" target="_blank" rel="noopener nofollow" style="background:#ff5a1f;color:white;padding:6px 10px;border-radius:8px;font-size:13px;font-weight:600">Register ↗</a>` : ""}
            <a href="${directionsUrl(e)}" target="_blank" rel="noopener" style="padding:6px 4px;font-size:13px;font-weight:600;color:#ef4410">Directions</a>
          </div>
        </div>`;
      new maplibregl.Popup({ offset: 20, maxWidth: "280px", closeButton: true }).setLngLat(coords).setHTML(html).addTo(map);
    }

    return () => {
      markers.current.forEach((m) => m.remove());
      markers.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fit() {
    const map = mapRef.current;
    const list = eventsRef.current;
    if (!map || !list.length) return;
    const b = new maplibregl.LngLatBounds();
    list.forEach((e) => b.extend([e.lng, e.lat]));
    map.fitBounds(b, { padding: 60, maxZoom: 13, duration: 0 });
  }

  function syncRadius() {
    const map = mapRef.current;
    const src = map?.getSource("radius") as GeoJSONSource | undefined;
    if (!src) return;
    src.setData({ type: "FeatureCollection", features: origin && radiusKm ? [circle(origin, radiusKm)] : [] });
  }

  // Update event data.
  useEffect(() => {
    const src = mapRef.current?.getSource("events") as GeoJSONSource | undefined;
    if (!src) return;
    markers.current.forEach((m) => m.remove());
    markers.current.clear();
    src.setData(toGeoJSON(events));
    if (fitToEvents && !bboxLocked.current) fit();
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  // Origin dot + radius ring.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    youMarker.current?.remove();
    youMarker.current = null;
    if (origin) {
      const node = document.createElement("div");
      node.className = "ac-you";
      node.title = "Your chosen location (approximate)";
      youMarker.current = new maplibregl.Marker({ element: node }).setLngLat([origin.lng, origin.lat]).addTo(map);
    }
    if (map.isStyleLoaded()) syncRadius(); else map.once("load", syncRadius);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng, radiusKm]);

  // Re-centre when the requested centre changes.
  useEffect(() => {
    if (center && mapRef.current) mapRef.current.easeTo({ center: [center.lng, center.lat], zoom, duration: 600 });
  }, [center?.lat, center?.lng, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className={className ?? "h-[420px] w-full rounded-2xl"} role="region" aria-label="Map of sports events" />;
}

function toGeoJSON(list: EventSummary[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: list.map((e) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [e.lng, e.lat] },
      properties: { slug: e.slug, title: e.title, icon: e.icon, colour: e.colour, status: e.status },
    })),
  };
}
