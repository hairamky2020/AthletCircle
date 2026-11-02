export const SITE = {
  name: "AthletCircle",
  tagline: "Discover. Participate. Achieve.",
  message: "Every Sport. Every Athlete. One Circle.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://athletcircle.com").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "athletcircle@gmail.com",
  // Free map tiles with no API key: OpenFreeMap (OpenStreetMap data), drawn inside Leaflet.
  // No usage limit or sign-up; attribution required. Change with NEXT_PUBLIC_MAP_STYLE_URL.
  mapStyle: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/positron",
  // Free OSRM demo server for road distance; set NEXT_PUBLIC_ROUTING_URL="" to turn road distance off.
  routingUrl: process.env.NEXT_PUBLIC_ROUTING_URL ?? "https://router.project-osrm.org",
  // Free Nominatim for address search (on submit only, never as-you-type, per its usage policy).
  geocoderUrl: process.env.NEXT_PUBLIC_GEOCODER_URL ?? "https://nominatim.openstreetmap.org",
};
