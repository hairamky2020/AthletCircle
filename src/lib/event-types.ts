// Compact event shape shared by server-rendered pages and browser-side search/map.
export type EventSummary = {
  slug: string;
  title: string;
  sport: string;          // slug (may be a subcategory)
  sportName: string;
  rootSport: string;      // top-level sport slug
  icon: string;
  colour: string;
  start: string;          // ISO
  end: string | null;
  status: "scheduled" | "cancelled" | "postponed";
  venueName: string;
  localityName: string | null;
  cityPath: string;
  cityName: string;
  statePath: string;
  lat: number;
  lng: number;
  regOpens: string | null;
  regCloses: string | null;
  registrationUrl: string | null;
  isFree: boolean;
  priceMin: number | null;
  priceMax: number | null;
  featured: boolean;
  demo: boolean;
  level: string;
  ageMin: number | null;
  ageMax: number | null;
  organiserName: string | null;
  lastVerified: string | null;
  added: string | null;
};
