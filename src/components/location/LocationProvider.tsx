"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { coarsen, type LatLng } from "@/lib/geo";
import { nearestPlace } from "@/data/locations";

export type UserLocation = {
  label: string;               // "Gachibowli", "Hyderabad", "500032 · Gachibowli"
  lat: number;
  lng: number;
  cityPath: string | null;
  source: "gps" | "search" | "city" | "pincode" | "address";
  precise: boolean;            // true only for GPS in this tab; never persisted precisely
};

type Ctx = {
  location: UserLocation | null;
  ready: boolean;
  detecting: boolean;
  error: string | null;
  detect: () => Promise<UserLocation | null>;
  set: (l: UserLocation) => void;
  clear: () => void;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
};

const LocationContext = createContext<Ctx | null>(null);
const KEY = "ac.location.v1";

/**
 * Holds the visitor's chosen location in the browser only. GPS is requested only when the visitor
 * taps "Use my location". What we keep (sessionStorage, this visit only) is coarsened to ~1 km; the precise point
 * lives in memory for this tab. Nothing is sent to a server except optional routing requests.
 */
export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [ready, setReady] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem(KEY); // older builds kept the area across visits; we now ask each visit
      const raw = sessionStorage.getItem(KEY);
      if (raw) setLocation({ ...JSON.parse(raw), precise: false });
    } catch {}
    setReady(true);
  }, []);

  const set = useCallback((l: UserLocation) => {
    setLocation(l);
    setError(null);
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ ...l, ...coarsen(l), precise: false }));
    } catch {}
  }, []);

  const clear = useCallback(() => {
    setLocation(null);
    try { sessionStorage.removeItem(KEY); } catch {}
  }, []);

  const detect = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setError("Your browser can't share location. Pick a city or search a locality instead.");
      return null;
    }
    setDetecting(true);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }));
      const p: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const near = nearestPlace(p);
      const l: UserLocation = { label: near?.name ?? "Your location", ...p, cityPath: near?.cityPath ?? null, source: "gps", precise: true };
      set(l);
      setLocation(l); // keep the precise point in memory for this tab
      return l;
    } catch (e) {
      const err = e as GeolocationPositionError;
      setError(err?.code === 1
        ? "Location permission was denied. No problem: pick a city or search a locality or PIN code."
        : "We couldn't get your location. Pick a city or search a locality or PIN code.");
      return null;
    } finally {
      setDetecting(false);
    }
  }, [set]);

  const value = useMemo<Ctx>(() => ({
    location, ready, detecting, error, detect, set, clear,
    pickerOpen, openPicker: () => setPickerOpen(true), closePicker: () => setPickerOpen(false),
  }), [location, ready, detecting, error, detect, set, clear, pickerOpen]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside LocationProvider");
  return ctx;
}
