// Pure geo helpers shared by server and browser.

export type LatLng = { lat: number; lng: number };

const R = 6371008.8; // mean Earth radius, metres

/** Great-circle (straight-line) distance in metres. */
export function haversineMetres(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "3.2 KM", "850 M", "120 KM" — kilometres with sensible precision. */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.max(10, Math.round(metres / 10) * 10)} M`;
  const km = metres / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} KM`;
}

/** "about 15 min", "about 1 hr 20 min". */
export function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `about ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `about ${h} hr${m ? ` ${m} min` : ""}`;
}

/** Coarsen a coordinate before it leaves the browser (2 dp ≈ 1.1 km). */
export function coarsen(p: LatLng, decimals = 2): LatLng {
  const f = 10 ** decimals;
  return { lat: Math.round(p.lat * f) / f, lng: Math.round(p.lng * f) / f };
}

export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/** Rough bounding box of India (incl. islands), used to reject bad geocodes. */
export function isInIndia(p: LatLng): boolean {
  return p.lat >= 6 && p.lat <= 37.5 && p.lng >= 68 && p.lng <= 97.5;
}

export const RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100, 200] as const;
export const DEFAULT_RADIUS_KM = 25;

/** Next radius to suggest when too few results; null at the top. */
export function nextRadius(km: number): number | null {
  return RADIUS_OPTIONS_KM.find((r) => r > km) ?? null;
}

/** Free deep link to Google Maps directions (opens the app on mobile). */
export function directionsUrl(dest: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`;
}
