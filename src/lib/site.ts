export const SITE = {
  name: "AthletCircle",
  tagline: "Discover sports. Find events. Explore nearby. Participate.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "events@athletcircle.in",
  mapStyle: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty",
  // Free OSRM demo server for road distance; set NEXT_PUBLIC_ROUTING_URL="" to turn road distance off.
  routingUrl: process.env.NEXT_PUBLIC_ROUTING_URL ?? "https://router.project-osrm.org",
  // Free Nominatim for address search (on submit only, never as-you-type, per its usage policy).
  geocoderUrl: process.env.NEXT_PUBLIC_GEOCODER_URL ?? "https://nominatim.openstreetmap.org",
};
