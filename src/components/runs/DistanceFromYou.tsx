"use client";

import { useLocation } from "@/components/location/LocationProvider";
import { formatDistance, haversineMetres, type LatLng } from "@/lib/geo";

export function DistanceFromYou({ to, precision }: { to: LatLng; precision: "venue" | "area" }) {
  const { location, ready, openPicker } = useLocation();
  if (!ready) return <p className="text-ink-400">…</p>;
  if (!location) return <button onClick={openPicker} className="link text-left">Set your location to see how far it is</button>;
  return (
    <p>
      <span className="font-semibold">{precision === "area" ? "About " : ""}{formatDistance(haversineMetres(location, to))}</span>{" "}
      <span className="text-ink-500">from {location.label}, straight-line{precision === "area" ? " to the area" : ""}.</span>{" "}
      <button onClick={openPicker} className="link text-sm text-ink-500">Change</button>
    </p>
  );
}
