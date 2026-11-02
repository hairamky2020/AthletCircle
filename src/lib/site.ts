export const SITE = {
  name: "AthletCircle",
  tagline: "Discover. Participate. Achieve.",
  message: "Every Sport. Every Athlete. One Circle.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "events@athletcircle.in",
  // Leaflet raster tiles. Default: OpenStreetMap's own tiles (free, attribution required, light use only per
  // https://operations.osmfoundation.org/policies/tiles/). Switch with env vars, e.g. a self-hosted or paid provider at scale.
  tileUrl: process.env.NEXT_PUBLIC_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution: process.env.NEXT_PUBLIC_TILE_ATTRIBUTION ?? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  // Free OSRM demo server for road distance; set NEXT_PUBLIC_ROUTING_URL="" to turn road distance off.
  routingUrl: process.env.NEXT_PUBLIC_ROUTING_URL ?? "https://router.project-osrm.org",
  // Free Nominatim for address search (on submit only, never as-you-type, per its usage policy).
  geocoderUrl: process.env.NEXT_PUBLIC_GEOCODER_URL ?? "https://nominatim.openstreetmap.org",
};
