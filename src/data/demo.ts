// DEMO DATA: clearly labelled, not real events. Every record has demo: true, the title ends with
// "(Demo)", and the venue is a placeholder. Set NEXT_PUBLIC_SHOW_DEMO=false to hide them once real
// events are in content/events.json. Dates are relative to the build date so the demo never goes stale.
// Registration links point at example.com on purpose.
import { localities, states } from "./gazetteer";
import type { EventInput, OrganiserRecord } from "./schema";

export type DemoEvent = {
  title: string;
  sport: string;          // sport or subcategory slug
  city: string;           // location path
  locality: string;       // locality slug inside the city
  offset: [number, number];
  inDays: number;         // start date relative to seeding day
  startHour: number;
  durationDays?: number;
  organiser: number;      // index into demoOrganisers
  level?: "open" | "amateur" | "professional" | "junior" | "masters";
  free?: boolean;
  price?: [number, number];
  regClosesInDays?: number;
  ageMin?: number;
  ageMax?: number;
  format?: string;
  attributes?: Record<string, unknown>;
  categories?: { name: string; distance_m?: number; format?: string; age_min?: number; age_max?: number; fee?: number; gender?: string }[];
  featured?: boolean;
  state?: "published" | "cancelled" | "postponed" | "pending_verification";
};

export const demoOrganisers = [
  { slug: "demo-runners-collective", name: "Demo Runners Collective", description: "Sample organiser used to demonstrate running events. Not a real organisation." },
  { slug: "demo-shuttle-league", name: "Demo Shuttle League", description: "Sample badminton and racquet-sports organiser for demonstration only." },
  { slug: "demo-turf-sports", name: "Demo Turf Sports", description: "Sample football and cricket tournament organiser for demonstration only." },
  { slug: "demo-pedal-club", name: "Demo Pedal Club", description: "Sample cycling and triathlon organiser for demonstration only." },
  { slug: "demo-mind-sports", name: "Demo Mind Sports Association", description: "Sample chess and carrom organiser for demonstration only." },
];

const run = (d: number[]) => d.map((m) => ({
  name: m === 21097 ? "Half Marathon (21.1K)" : m === 42195 ? "Marathon (42.2K)" : `${m / 1000}K`,
  distance_m: m,
}));

export const demoEvents: DemoEvent[] = [
  { title: "Gachibowli Sunrise 10K (Demo)", sport: "10k", city: "in/telangana/hyderabad", locality: "gachibowli", offset: [0.004, -0.003], inDays: 9, startHour: 5, organiser: 0, price: [499, 899], regClosesInDays: 6, categories: run([5000, 10000]), attributes: { terrain: "Road", timing: "Chip timed" }, featured: true },
  { title: "HITEC City Night Run (Demo)", sport: "5k", city: "in/telangana/hyderabad", locality: "hitec-city", offset: [0.002, 0.002], inDays: 3, startHour: 19, organiser: 0, price: [399, 399], regClosesInDays: 1, categories: run([3000, 5000]), attributes: { terrain: "Road", timing: "Chip timed" } },
  { title: "Hyderabad Lakeside Half Marathon (Demo)", sport: "half-marathon", city: "in/telangana/hyderabad", locality: "banjara-hills", offset: [-0.006, 0.01], inDays: 38, startHour: 5, organiser: 0, price: [999, 1799], regClosesInDays: 30, categories: run([5000, 10000, 21097]), attributes: { terrain: "Road", timing: "Chip timed", certified_course: true }, featured: true },
  { title: "Kompally Trail 15K (Demo)", sport: "trail-running", city: "in/telangana/hyderabad", locality: "kompally", offset: [0.01, -0.008], inDays: 24, startHour: 6, organiser: 0, price: [799, 799], regClosesInDays: 18, categories: [{ name: "15K Trail", distance_m: 15000 }], attributes: { terrain: "Trail", timing: "Manual", elevation_gain_m: 180 } },
  { title: "Uppal Community Fun Run (Demo)", sport: "3k", city: "in/telangana/hyderabad", locality: "uppal", offset: [0.001, 0.002], inDays: 5, startHour: 6, organiser: 0, free: true, categories: run([3000]), attributes: { terrain: "Road", timing: "Not timed" } },
  { title: "Madhapur Open Badminton Championship (Demo)", sport: "badminton", city: "in/telangana/hyderabad", locality: "madhapur", offset: [0.001, -0.001], inDays: 10, startHour: 8, durationDays: 2, organiser: 1, price: [600, 1200], regClosesInDays: 5, attributes: { event_types: ["Singles", "Doubles", "Mixed doubles"], shuttle: "Feather" }, categories: [{ name: "Men's Singles Open", format: "Singles", gender: "Men", fee: 600 }, { name: "Women's Singles Open", format: "Singles", gender: "Women", fee: 600 }, { name: "Mixed Doubles Open", format: "Mixed doubles", fee: 1200 }, { name: "35+ Men's Doubles", format: "Doubles", age_min: 35, fee: 1200 }], featured: true },
  { title: "Kukatpally Junior Badminton Cup (Demo)", sport: "badminton", city: "in/telangana/hyderabad", locality: "kukatpally", offset: [0.002, 0.001], inDays: 17, startHour: 9, organiser: 1, level: "junior", price: [400, 400], regClosesInDays: 12, ageMin: 9, ageMax: 17, attributes: { event_types: ["Singles", "Doubles"], shuttle: "Nylon" }, categories: [{ name: "U-11 Singles", format: "Singles", age_max: 11, fee: 400 }, { name: "U-13 Singles", format: "Singles", age_max: 13, fee: 400 }, { name: "U-15 Singles", format: "Singles", age_max: 15, fee: 400 }, { name: "U-17 Doubles", format: "Doubles", age_max: 17, fee: 400 }] },
  { title: "Kondapur 7-a-side Turf League (Demo)", sport: "football", city: "in/telangana/hyderabad", locality: "kondapur", offset: [-0.002, 0.003], inDays: 12, startHour: 7, durationDays: 2, organiser: 2, price: [4000, 4000], regClosesInDays: 8, format: "League + knockout", attributes: { format: "7-a-side", surface: "Artificial turf", team_size_max: 10 } },
  { title: "Secunderabad Box Cricket Bash (Demo)", sport: "box-cricket", city: "in/telangana/hyderabad", locality: "secunderabad", offset: [0.003, 0.001], inDays: 6, startHour: 16, organiser: 2, price: [3000, 3000], regClosesInDays: 3, attributes: { format: "Box cricket", ball_type: "Tennis", overs: 6, tournament_type: "Knockout" } },
  { title: "LB Nagar Corporate T20 Cup (Demo)", sport: "cricket", city: "in/telangana/hyderabad", locality: "lb-nagar", offset: [0.004, -0.002], inDays: 30, startHour: 8, durationDays: 9, organiser: 2, price: [15000, 15000], regClosesInDays: 20, attributes: { format: "T20", ball_type: "Leather", overs: 20, tournament_type: "Corporate" } },
  { title: "Financial District Gravel Ride 60K (Demo)", sport: "road-cycling", city: "in/telangana/hyderabad", locality: "financial-district", offset: [-0.004, -0.006], inDays: 16, startHour: 5, organiser: 3, price: [700, 700], regClosesInDays: 12, attributes: { discipline: "Gravel", distance_km: 60, timing: "Manual" } },
  { title: "Shamshabad Brevet 200 (Demo)", sport: "brevet", city: "in/telangana/hyderabad", locality: "shamshabad", offset: [0.01, 0.01], inDays: 45, startHour: 5, organiser: 3, price: [500, 500], regClosesInDays: 40, attributes: { discipline: "Brevet / Audax", distance_km: 200 } },
  { title: "Gachibowli Sprint Triathlon (Demo)", sport: "triathlon", city: "in/telangana/hyderabad", locality: "gachibowli", offset: [-0.003, 0.004], inDays: 52, startHour: 6, organiser: 3, price: [2500, 2500], regClosesInDays: 35, attributes: { distance_type: "Sprint", swim_venue: "Pool" } },
  { title: "Jubilee Hills Rapid Chess Open (Demo)", sport: "chess", city: "in/telangana/hyderabad", locality: "jubilee-hills", offset: [0.002, -0.002], inDays: 7, startHour: 10, organiser: 4, price: [500, 500], regClosesInDays: 4, attributes: { time_control: "Rapid", fide_rated: false, rounds: 7 } },
  { title: "Ameerpet Carrom Doubles (Demo)", sport: "carrom", city: "in/telangana/hyderabad", locality: "ameerpet", offset: [0.001, 0.001], inDays: 14, startHour: 10, organiser: 4, free: true },
  { title: "Miyapur Kabaddi Open (Demo)", sport: "kabaddi", city: "in/telangana/hyderabad", locality: "miyapur", offset: [0.002, 0.002], inDays: 21, startHour: 15, durationDays: 2, organiser: 2, price: [2000, 2000], regClosesInDays: 15 },
  { title: "Tarnaka Table Tennis Masters (Demo)", sport: "table-tennis", city: "in/telangana/hyderabad", locality: "tarnaka", offset: [0.001, -0.001], inDays: 26, startHour: 9, organiser: 1, level: "masters", ageMin: 40, price: [500, 500], regClosesInDays: 20, attributes: { event_types: ["Singles", "Doubles"] } },
  { title: "Begumpet Yoga Championship (Demo)", sport: "yoga", city: "in/telangana/hyderabad", locality: "begumpet", offset: [0.002, 0.003], inDays: 33, startHour: 7, organiser: 4, free: true, state: "postponed" },
  { title: "Manikonda 5-a-side Futsal Night (Demo)", sport: "futsal", city: "in/telangana/hyderabad", locality: "manikonda", offset: [0.001, 0.001], inDays: 4, startHour: 20, organiser: 2, price: [2500, 2500], regClosesInDays: 2, attributes: { format: "5-a-side", surface: "Indoor" }, state: "cancelled" },
  { title: "Cubbon Park 10K Run (Demo)", sport: "10k", city: "in/karnataka/bengaluru", locality: "cubbon-park", offset: [0.001, 0.001], inDays: 8, startHour: 6, organiser: 0, price: [599, 999], regClosesInDays: 5, categories: run([5000, 10000]), attributes: { terrain: "Road", timing: "Chip timed" }, featured: true },
  { title: "Whitefield Half Marathon (Demo)", sport: "half-marathon", city: "in/karnataka/bengaluru", locality: "whitefield", offset: [0.003, -0.004], inDays: 29, startHour: 5, organiser: 0, price: [1099, 1899], regClosesInDays: 21, categories: run([10000, 21097]), attributes: { terrain: "Road", timing: "Chip timed" } },
  { title: "Bengaluru City Marathon (Demo)", sport: "marathon", city: "in/karnataka/bengaluru", locality: "mg-road", offset: [0.001, 0.002], inDays: 60, startHour: 4, organiser: 0, price: [1499, 2999], regClosesInDays: 45, categories: run([5000, 10000, 21097, 42195]), attributes: { terrain: "Road", timing: "Chip timed", certified_course: true }, featured: true },
  { title: "Electronic City 5K Corporate Run (Demo)", sport: "5k", city: "in/karnataka/bengaluru", locality: "electronic-city", offset: [0.002, 0.001], inDays: 13, startHour: 6, organiser: 0, price: [349, 349], regClosesInDays: 9, categories: run([5000]) },
  { title: "Koramangala Badminton Open (Demo)", sport: "badminton", city: "in/karnataka/bengaluru", locality: "koramangala", offset: [0.002, -0.001], inDays: 11, startHour: 8, durationDays: 2, organiser: 1, price: [700, 1300], regClosesInDays: 6, attributes: { event_types: ["Singles", "Doubles"], shuttle: "Feather" }, categories: [{ name: "Men's Singles", format: "Singles", gender: "Men", fee: 700 }, { name: "Women's Doubles", format: "Doubles", gender: "Women", fee: 1300 }] },
  { title: "HSR Layout Turf Football Cup (Demo)", sport: "football", city: "in/karnataka/bengaluru", locality: "hsr-layout", offset: [0.001, 0.002], inDays: 15, startHour: 7, organiser: 2, price: [3500, 3500], regClosesInDays: 10, attributes: { format: "6-a-side", surface: "Artificial turf" } },
  { title: "Yelahanka Tennis-ball Cricket League (Demo)", sport: "tennis-ball-cricket", city: "in/karnataka/bengaluru", locality: "yelahanka", offset: [0.004, 0.003], inDays: 19, startHour: 8, durationDays: 2, organiser: 2, price: [5000, 5000], regClosesInDays: 12, attributes: { format: "Tennis-ball cricket", ball_type: "Tennis", overs: 10, tournament_type: "League + knockout" } },
  { title: "Nandi Hills Climb Ride (Demo)", sport: "road-cycling", city: "in/karnataka/bengaluru", locality: "devanahalli", offset: [0.05, -0.02], inDays: 10, startHour: 5, organiser: 3, price: [900, 900], regClosesInDays: 7, attributes: { discipline: "Road", distance_km: 80 } },
  { title: "Hebbal Lake Aquathlon (Demo)", sport: "triathlon", city: "in/karnataka/bengaluru", locality: "hebbal", offset: [0.002, 0.004], inDays: 41, startHour: 6, organiser: 3, price: [1800, 1800], regClosesInDays: 30, attributes: { distance_type: "Aquathlon", swim_venue: "Pool" } },
  { title: "Jayanagar Blitz Chess Arena (Demo)", sport: "chess", city: "in/karnataka/bengaluru", locality: "jayanagar", offset: [0.001, 0.001], inDays: 2, startHour: 10, organiser: 4, price: [300, 300], regClosesInDays: 1, attributes: { time_control: "Blitz", rounds: 9 } },
  { title: "Indiranagar Roller Skating Meet (Demo)", sport: "roller-skating", city: "in/karnataka/bengaluru", locality: "indiranagar", offset: [0.001, -0.002], inDays: 22, startHour: 7, organiser: 4, level: "junior", ageMin: 5, ageMax: 16, price: [450, 450], regClosesInDays: 15 },
  { title: "Marathahalli Box Cricket Night (Demo)", sport: "box-cricket", city: "in/karnataka/bengaluru", locality: "marathahalli", offset: [0.001, 0.001], inDays: 5, startHour: 19, organiser: 2, price: [2800, 2800], regClosesInDays: 3, attributes: { format: "Box cricket", ball_type: "Tennis", overs: 6 } },
  { title: "Malleshwaram Karate Open (Demo)", sport: "karate", city: "in/karnataka/bengaluru", locality: "malleshwaram", offset: [0.001, 0.001], inDays: 27, startHour: 9, organiser: 4, level: "junior", price: [600, 600], regClosesInDays: 20 },
  { title: "Chennai Beach 10K (Demo)", sport: "10k", city: "in/tamil-nadu/chennai", locality: "", offset: [0.01, 0.02], inDays: 34, startHour: 5, organiser: 0, price: [699, 699], regClosesInDays: 25, categories: run([5000, 10000]) },
  { title: "Pune Hill Half Marathon (Demo)", sport: "half-marathon", city: "in/maharashtra/pune", locality: "", offset: [0.01, -0.01], inDays: 48, startHour: 5, organiser: 0, price: [1199, 1199], regClosesInDays: 35, categories: run([21097]) },
  { title: "Mysuru Heritage Cycle Ride (Demo)", sport: "cycling", city: "in/karnataka/mysuru", locality: "", offset: [0.004, 0.004], inDays: 36, startHour: 6, organiser: 3, price: [600, 600], regClosesInDays: 28, attributes: { discipline: "Road", distance_km: 50 } },
  { title: "Warangal Fort Run (Demo)", sport: "5k", city: "in/telangana/warangal", locality: "", offset: [0.005, 0.003], inDays: 20, startHour: 6, organiser: 0, free: true, categories: run([5000]) },
  { title: "Kochi Backwater Swim (Demo)", sport: "open-water-swimming", city: "in/kerala/kochi", locality: "", offset: [-0.01, 0.01], inDays: 55, startHour: 6, organiser: 3, price: [1500, 1500], regClosesInDays: 40, attributes: { water: "Open water" } },
  { title: "Gachibowli Running Clinic Submission (Demo)", sport: "running", city: "in/telangana/hyderabad", locality: "gachibowli", offset: [0.001, 0.001], inDays: 18, startHour: 6, organiser: 0, free: true, state: "pending_verification" },
];

const slugify = (t: string) => t.toLowerCase().replace(/\(demo\)/g, "demo").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const IST = 5.5 * 36e5;

function cityCentre(path: string) {
  const [, st, ct] = path.split("/");
  const c = states.find((s) => s.slug === st)?.cities?.find((x) => x.slug === ct);
  if (!c) throw new Error(`demo: unknown city ${path}`);
  return c;
}

export function demoOrganiserRecords(): OrganiserRecord[] {
  return demoOrganisers.map((o) => ({ ...o, name: `${o.name} (Demo)`, website: "https://example.com", social: {}, verified: false, demo: true }));
}

export function demoEventRecords(now = new Date()): EventInput[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const iso = (ms: number) => new Date(ms + IST).toISOString().slice(0, 19) + "+05:30";
  return demoEvents.map((e) => {
    const loc = e.locality ? localities[e.city]?.find((l) => l.slug === e.locality) : undefined;
    const base = loc ?? cityCentre(e.city);
    const start = today + e.inDays * 864e5 + (e.startHour - 5.5) * 36e5;
    const end = e.durationDays ? start + (e.durationDays - 1) * 864e5 + 8 * 36e5 : start + 4 * 36e5;
    return {
      slug: slugify(e.title),
      title: e.title,
      sport: e.sport,
      summary: "Demo listing used to preview AthletCircle. This is not a real event.",
      description: "This is demonstration data, clearly labelled, to show how event pages, maps and filters work. Do not register: the registration link goes to example.com.",
      start: iso(start),
      end: iso(end),
      status: e.state === "cancelled" ? "cancelled" : e.state === "postponed" ? "postponed" : "scheduled",
      venue: {
        name: `Demo Ground, ${base.name}`,
        address: "Demo address, not a real venue",
        city: e.city,
        locality: e.locality || undefined,
        lat: +(base.lat + e.offset[0]).toFixed(5),
        lng: +(base.lng + e.offset[1]).toFixed(5),
        pinVerified: true,
      },
      organiser: demoOrganisers[e.organiser].slug,
      level: e.level ?? "open",
      format: e.format,
      ageMin: e.ageMin,
      ageMax: e.ageMax,
      isFree: e.free ?? false,
      priceMin: e.free ? 0 : e.price?.[0],
      priceMax: e.free ? 0 : e.price?.[1],
      registrationOpens: iso(today - 20 * 864e5),
      registrationCloses: e.regClosesInDays != null ? iso(today + e.regClosesInDays * 864e5 + 13 * 36e5) : undefined,
      registrationUrl: "https://example.com/register",
      websiteUrl: "https://example.com",
      contactEmail: "demo@example.com",
      attributes: e.attributes ?? {},
      categories: (e.categories ?? []).map((c) => ({
        name: c.name, distanceM: c.distance_m, format: c.format, gender: c.gender, ageMin: c.age_min, ageMax: c.age_max, fee: c.fee,
      })),
      featured: e.featured ?? false,
      verification: {
        verified: e.state !== "pending_verification",
        lastVerified: new Date(today + IST).toISOString().slice(0, 10),
        sources: ["https://example.com"],
      },
      demo: true,
    };
  });
}
