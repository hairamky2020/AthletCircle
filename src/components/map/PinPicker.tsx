"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { SITE } from "@/lib/site";
import type { LatLng } from "@/lib/geo";

/** Click or drag to place the venue pin. A person confirms every pin before an event goes live. */
export function PinPicker({ value, centre, onChange }: { value: LatLng | null; centre: LatLng; onChange: (p: LatLng) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    if (!el.current) return;
    const m = new maplibregl.Map({ container: el.current, style: SITE.mapStyle, center: [centre.lng, centre.lat], zoom: 12, attributionControl: { compact: true } });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.on("click", (e) => cb.current({ lat: +e.lngLat.lat.toFixed(6), lng: +e.lngLat.lng.toFixed(6) }));
    map.current = m;
    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { map.current?.easeTo({ center: [centre.lng, centre.lat], zoom: 13 }); }, [centre.lat, centre.lng]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!value) { marker.current?.remove(); marker.current = null; return; }
    if (!marker.current) {
      marker.current = new maplibregl.Marker({ color: "#ff5a1f", draggable: true }).setLngLat([value.lng, value.lat]).addTo(m);
      marker.current.on("dragend", () => { const p = marker.current!.getLngLat(); cb.current({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) }); });
    } else marker.current.setLngLat([value.lng, value.lat]);
  }, [value?.lat, value?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className="h-72 w-full rounded-xl ring-1 ring-ink-200" aria-label="Map: click to place the venue pin" />;
}
