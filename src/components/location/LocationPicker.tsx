"use client";

import { useEffect, useRef, useState } from "react";
import { useLocation, type UserLocation } from "./LocationProvider";
import { searchPlaces, launchCities, allCities, type PlaceHit } from "@/data/locations";
import { isInIndia } from "@/lib/geo";
import { SITE } from "@/lib/site";

/** Modal for choosing a location: GPS (opt-in), locality/PIN/city search, popular cities, or an address. */
export function LocationPicker() {
  const { pickerOpen, closePicker, detect, detecting, error, set, location } = useLocation();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [addrState, setAddrState] = useState<"idle" | "loading" | "none" | "error">("idle");
  const [addrHits, setAddrHits] = useState<PlaceHit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pickerOpen) {
      setQ(""); setHits([]); setAddrHits([]); setAddrState("idle");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [pickerOpen]);

  useEffect(() => {
    setHits(searchPlaces(q, 8));
    setAddrHits([]); setAddrState("idle");
  }, [q]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePicker();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerOpen, closePicker]);

  if (!pickerOpen) return null;

  const choose = (h: PlaceHit) => {
    const cityPath = h.path.split("/").length >= 3 ? h.path.split("/").slice(0, 3).join("/") : null;
    const source: UserLocation["source"] = h.type === "pincode" ? "pincode" : h.type === "city" ? "city" : "search";
    set({ label: h.label, lat: h.lat, lng: h.lng, cityPath, source, precise: false });
    closePicker();
  };

  // Address / landmark lookup via the free Nominatim service, only when the visitor submits.
  const searchAddress = async () => {
    if (q.trim().length < 3 || !SITE.geocoderUrl) return;
    setAddrState("loading");
    try {
      const res = await fetch(`${SITE.geocoderUrl}/search?format=jsonv2&countrycodes=in&limit=5&q=${encodeURIComponent(q.trim())}`, {
        headers: { "Accept-Language": "en" },
      });
      const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
      const list = data
        .map((d) => ({ label: d.display_name.split(",")[0], sublabel: d.display_name.split(",").slice(1, 4).join(",").trim(), lat: +d.lat, lng: +d.lon, path: "", type: "locality" as const }))
        .filter((d) => isInIndia(d));
      setAddrHits(list);
      setAddrState(list.length ? "idle" : "none");
    } catch {
      setAddrState("error");
    }
  };

  const chooseAddress = (h: PlaceHit) => {
    set({ label: h.label, lat: h.lat, lng: h.lng, cityPath: null, source: "address", precise: false });
    closePicker();
  };

  const popular = launchCities().concat(allCities().filter((c) => ["in/tamil-nadu/chennai", "in/maharashtra/mumbai", "in/maharashtra/pune", "in/delhi/new-delhi"].includes(c.path)));

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink-900/50 p-0 sm:items-start sm:p-6 sm:pt-24" onClick={closePicker} role="dialog" aria-modal="true" aria-label="Choose your location">
      <div className="max-h-[90vh] w-full overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Where are you?</h2>
          <button onClick={closePicker} className="rounded-full p-2 text-ink-500 hover:bg-ink-100" aria-label="Close">✕</button>
        </div>

        <button onClick={async () => { if (await detect()) closePicker(); }} disabled={detecting} className="btn btn-dark w-full">
          <span aria-hidden>📍</span> {detecting ? "Detecting…" : "Use my current location"}
        </button>
        <p className="mt-2 text-xs text-ink-500">Your browser asks first. Your exact location stays on your device and is never shown publicly.</p>
        {error && <p className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{error}</p>}

        <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wide text-ink-400"><span className="h-px flex-1 bg-ink-200" />or<span className="h-px flex-1 bg-ink-200" /></div>

        <form onSubmit={(e) => { e.preventDefault(); if (hits[0]) choose(hits[0]); else void searchAddress(); }}>
          <label htmlFor="loc-q" className="mb-1 block text-sm font-medium">Search locality, city or PIN code</label>
          <input id="loc-q" ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Gachibowli, Bengaluru or 500032"
            className="w-full rounded-xl border border-ink-200 px-4 py-3 text-base outline-none focus:border-ink-900" autoComplete="off" />
        </form>

        {hits.length > 0 && (
          <ul className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-100">
            {hits.map((h) => (
              <li key={h.path + h.label}>
                <button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-ink-50" onClick={() => choose(h)}>
                  <span><span className="font-medium">{h.label}</span> <span className="text-sm text-ink-500">{h.sublabel}</span></span>
                  <span className="text-xs uppercase text-ink-400">{h.type}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {q.trim().length >= 3 && SITE.geocoderUrl && (
          <div className="mt-3">
            <button onClick={searchAddress} className="text-sm font-medium text-brand-600 hover:underline" disabled={addrState === "loading"}>
              {addrState === "loading" ? "Searching addresses…" : `Search addresses and landmarks for “${q.trim()}”`}
            </button>
            {addrState === "none" && <p className="mt-1 text-sm text-ink-500">No matching place found in India.</p>}
            {addrState === "error" && <p className="mt-1 text-sm text-ink-500">Address search is unavailable right now. Try a locality or city.</p>}
            {addrHits.length > 0 && (
              <ul className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-100">
                {addrHits.map((h, i) => (
                  <li key={i}><button className="w-full px-4 py-3 text-left hover:bg-ink-50" onClick={() => chooseAddress(h)}>
                    <span className="font-medium">{h.label}</span> <span className="text-sm text-ink-500">{h.sublabel}</span>
                  </button></li>
                ))}
              </ul>
            )}
            {addrHits.length > 0 && <p className="mt-1 text-[11px] text-ink-400">Address search © OpenStreetMap contributors (Nominatim)</p>}
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">Popular cities</p>
          <div className="flex flex-wrap gap-2">
            {popular.map((c) => (
              <button key={c.path} className={`chip ${location?.cityPath === c.path ? "is-active" : ""}`}
                onClick={() => choose({ label: c.name, sublabel: "", lat: c.lat!, lng: c.lng!, path: c.path, type: "city" })}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
