import type { Run } from "@/data/schema";

/** SEO landing pages: /hyderabad/<slug>. Each lists only real runs that match; nothing is invented. */
export type Topic = { slug: string; h1: string; title: string; description: string; intro: string; match: (r: Run, now: Date) => boolean; faqs: [string, string][] };

const has = (r: Run, ...d: string[]) => r.distances.some((x) => d.includes(x)) || d.some((x) => new RegExp(`\\b${x.replace(".", "\\.")}`, "i").test(r.title));
const ym = (d: Date) => d.toISOString().slice(0, 7);

export const TOPICS: Topic[] = [
  { slug: "running-events", h1: "Running events in Hyderabad", title: "Running Events in Hyderabad 2026–27 · Dates, Fees & Registration",
    description: "Every upcoming running event in Hyderabad: 5K, 10K, half marathons, trail and ultra runs, with dates, venues, fees and official registration links.",
    intro: "Every upcoming run in Hyderabad in one place: fun runs, 5K and 10K races, half marathons, trail runs and ultras. Each listing links to the organiser’s official registration page.",
    match: () => true, faqs: [["When is running season in Hyderabad?", "Most Hyderabad runs happen between November and March, when mornings are cooler. Races usually start between 5:00 and 6:30 AM on Sundays."], ["Where do I register?", "Always on the organiser’s official page. AthletCircle links to it from every event."]] },
  { slug: "marathons", h1: "Marathons in Hyderabad", title: "Marathons in Hyderabad 2026–27 · Full, Half & Ultra",
    description: "Upcoming marathons in Hyderabad: full marathons, half marathons (21.1K) and ultra runs, with dates, venues, fees and registration links.",
    intro: "Upcoming marathon-distance races in and around Hyderabad, including half marathons (21.1K), full marathons (42.2K) and ultras.",
    match: (r) => r.kind === "half" || r.kind === "marathon" || r.kind === "ultra" || has(r, "21.1K", "42.2K", "24K") || /marathon|ultra/i.test(r.title),
    faqs: [["What is the biggest marathon in Hyderabad?", "The Hyderabad Marathon is usually held in August. Between November and March there are several half marathons and ultras listed here."], ["How long is a half marathon?", "21.1 km. A full marathon is 42.2 km."]] },
  { slug: "half-marathons", h1: "Half marathons in Hyderabad", title: "Half Marathons in Hyderabad 2026–27 · 21.1K Races",
    description: "Upcoming 21.1K half marathons in Hyderabad with dates, venues, fees, prize money and official registration links.",
    intro: "Every upcoming 21.1 km half marathon in Hyderabad. Most also offer 5K and 10K categories, so friends of every level can run the same event.",
    match: (r) => r.kind === "half" || has(r, "21.1K") || /half/i.test(r.title), faqs: [["How do I train for my first half marathon?", "Most beginners train 10–12 weeks, building up from regular 5K and 10K runs. A 10K race 4–6 weeks before is a good check."]] },
  { slug: "10k-runs", h1: "10K runs in Hyderabad", title: "10K Runs in Hyderabad 2026–27 · Dates & Registration",
    description: "Upcoming 10K runs in Hyderabad, timed and untimed, with dates, venues, fees and official registration links.",
    intro: "Upcoming runs in Hyderabad with a 10K category, the most popular race distance for regular runners.", match: (r) => has(r, "10K"), faqs: [] },
  { slug: "5k-runs", h1: "5K runs in Hyderabad", title: "5K Runs in Hyderabad 2026–27 · Fun Runs & First Races",
    description: "Upcoming 5K runs and fun runs in Hyderabad, great for first-timers and families, with dates, fees and registration links.",
    intro: "Upcoming runs in Hyderabad with a 5K category. A great first race, and many include kids’ and family categories.", match: (r) => has(r, "5K"), faqs: [] },
  { slug: "trail-runs", h1: "Trail and ultra runs in Hyderabad", title: "Trail & Ultra Runs in Hyderabad 2026–27",
    description: "Upcoming trail runs and ultra marathons around Hyderabad with dates, distances, fees and registration links.",
    intro: "Off-road and long-distance runs around Hyderabad.", match: (r) => r.kind === "ultra" || /trail|ultra|forest/i.test(r.title), faqs: [] },
  { slug: "runs-this-month", h1: "Runs in Hyderabad this month", title: "Running Events in Hyderabad This Month",
    description: "Running events in Hyderabad this month, with dates, venues, fees and official registration links.",
    intro: "Runs in Hyderabad this calendar month.", match: (r, now) => r.date.slice(0, 7) === ym(now), faqs: [] },
];
export const getTopic = (slug: string) => TOPICS.find((t) => t.slug === slug) ?? null;
