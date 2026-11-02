// AthletCircle detail icons: 24px line icons drawn in currentColor, shown on a tinted brand tile.
// One set, used everywhere on event pages, so sections look consistent across sports.
import type { ReactNode } from "react";

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ICONS: Record<string, ReactNode> = {
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="3" {...P} /><path d="M3.5 10h17M8 3v4M16 3v4" {...P} /><circle cx="12" cy="15" r="1.6" fill="currentColor" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" {...P} /><path d="M12 7.5V12l3 2" {...P} /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" {...P} /><path d="M10 20a2 2 0 0 0 4 0" {...P} /></>,
  pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" {...P} /><circle cx="12" cy="10" r="2.6" {...P} /></>,
  ticket: <><path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4Z" {...P} /><path d="M14 6v12" {...P} strokeDasharray="2 2" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0Z" {...P} /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" {...P} /></>,
  medal: <><path d="M8 3l2.5 6M16 3l-2.5 6" {...P} /><circle cx="12" cy="15" r="5" {...P} /><path d="m12 12.6.8 1.6 1.7.2-1.3 1.2.4 1.7-1.6-.9-1.6.9.4-1.7-1.3-1.2 1.7-.2Z" fill="currentColor" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...P} /></>,
  info: <><circle cx="12" cy="12" r="8.5" {...P} /><path d="M12 11v5M12 8h.01" {...P} /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" {...P} /><circle cx="5" cy="6" r="1.2" fill="currentColor" /><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="5" cy="18" r="1.2" fill="currentColor" /></>,
  timeline: <><circle cx="6" cy="6" r="2" {...P} /><circle cx="6" cy="18" r="2" {...P} /><path d="M6 8v8M11 6h9M11 18h9M11 12h6" {...P} /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z" {...P} /><path d="m9 12 2 2 4-4" {...P} /></>,
  rules: <><rect x="5" y="3.5" width="14" height="17" rx="2.5" {...P} /><path d="M9 8h6M9 12h6M9 16h3" {...P} /></>,
  user: <><circle cx="12" cy="8.5" r="3.5" {...P} /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" {...P} /></>,
  image: <><rect x="3.5" y="5" width="17" height="14" rx="3" {...P} /><circle cx="9" cy="10" r="1.7" {...P} /><path d="m4 17 5-4.5 4 3.5 2.5-2 4.5 3.5" {...P} /></>,
  help: <><circle cx="12" cy="12" r="8.5" {...P} /><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 17h.01" {...P} /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" {...P} /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" {...P} /><circle cx="16" cy="7" r="2" {...P} /><circle cx="10" cy="17" r="2" {...P} /></>,
  share: <><circle cx="17" cy="5.5" r="2.5" {...P} /><circle cx="6" cy="12" r="2.5" {...P} /><circle cx="17" cy="18.5" r="2.5" {...P} /><path d="m8.2 10.8 6.6-4M8.2 13.2l6.6 4" {...P} /></>,
  phone: <><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" {...P} /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" {...P} /><path d="m4 7 8 6 8-6" {...P} /></>,
  globe: <><circle cx="12" cy="12" r="8.5" {...P} /><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17" {...P} /></>,
  play: <><circle cx="12" cy="12" r="8.5" {...P} /><path d="m10 8.5 5 3.5-5 3.5Z" fill="currentColor" /></>,
  history: <><path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" {...P} /><path d="M12 8v4l2.5 1.5" {...P} /></>,
  // facilities
  water: <><path d="M12 3.5s-5.5 6-5.5 10a5.5 5.5 0 0 0 11 0c0-4-5.5-10-5.5-10Z" {...P} /></>,
  refreshments: <><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M11 3v3" {...P} /></>,
  medical: <><rect x="3.5" y="6" width="17" height="13" rx="3" {...P} /><path d="M12 9.5v6M9 12.5h6M9 6V4.5h6V6" {...P} /></>,
  ambulance: <><path d="M3 16V8h11v8M14 11h4l3 3v2h-7" {...P} /><circle cx="7" cy="17" r="1.8" {...P} /><circle cx="17" cy="17" r="1.8" {...P} /><path d="M8.5 10v3M7 11.5h3" {...P} /></>,
  timing: <><circle cx="12" cy="13" r="7" {...P} /><path d="M12 13V9.5M10 3h4M18 6l1.5-1.5" {...P} /></>,
  bib: <><rect x="4" y="5" width="16" height="13" rx="2" {...P} /><path d="M8 10h8M10 14h4" {...P} /><circle cx="6.5" cy="7.5" r=".6" fill="currentColor" /><circle cx="17.5" cy="7.5" r=".6" fill="currentColor" /></>,
  tshirt: <><path d="M8 4 4 6.5l2 3.5 2-1V20h8V9l2 1 2-3.5L16 4c-.6 1.5-2.1 2.5-4 2.5S8.6 5.5 8 4Z" {...P} /></>,
  certificate: <><rect x="3.5" y="4.5" width="17" height="12" rx="2" {...P} /><path d="M7 8.5h10M7 12h6" {...P} /><circle cx="16" cy="17" r="2.5" {...P} /><path d="m14.8 19-.8 2.5 2-1 2 1-.8-2.5" {...P} /></>,
  photos: <><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" {...P} /><circle cx="12" cy="13" r="3.2" {...P} /></>,
  parking: <><rect x="4" y="4" width="16" height="16" rx="4" {...P} /><path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" {...P} /></>,
  baggage: <><rect x="5" y="8" width="14" height="11" rx="2" {...P} /><path d="M9 8V5.5h6V8M9 12v3M15 12v3" {...P} /></>,
  toilets: <><circle cx="7.5" cy="5" r="1.6" {...P} /><circle cx="16.5" cy="5" r="1.6" {...P} /><path d="M6 9h3l.5 6h-1v5h-2v-5h-1ZM15 9h3l1.5 7h-1.5v4h-2v-4H14.5Z M12 4v16" {...P} /></>,
  changing: <><path d="M12 6a2 2 0 1 1 2 2c-1 0-2 .7-2 1.6L4.5 15a1.5 1.5 0 0 0 .9 2.7h13.2a1.5 1.5 0 0 0 .9-2.7L12 9.6" {...P} /></>,
  pacers: <><path d="M5 20V4M5 4h10l-2 3.5 2 3.5H5" {...P} /><path d="M17 14l3 3-3 3" {...P} /></>,
  physio: <><path d="M7 21V12l-2-4 3-4 3 4-1 4v9M14 9h6M17 6v6" {...P} /></>,
  breakfast: <><path d="M4 11h16a8 8 0 0 1-16 0ZM9 4c-1 1.5 1 2.5 0 4M13 4c-1 1.5 1 2.5 0 4" {...P} /></>,
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true">{ICONS[name] ?? ICONS.info}</svg>;
}

/** Icon on a tinted rounded tile in one of the brand colours. */
export function IconTile({ name, tone = "blue", size = "md" }: { name: string; tone?: "blue" | "orange" | "green" | "navy"; size?: "sm" | "md" | "lg" }) {
  return <span className={`ic-tile ic-${tone} ic-${size}`}><Icon name={name} className="ic-svg" /></span>;
}
