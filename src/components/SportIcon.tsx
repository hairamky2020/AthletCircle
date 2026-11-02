// Minimal line icons for each sport, drawn in currentColor so they take the sport's accent colour.
const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const PATHS: Record<string, React.ReactNode> = {
  running: <><circle cx="15" cy="4.5" r="2" {...s} /><path d="M13 8l-3.5 4 3.5 2.5-1.5 6M9.5 12l-4.5-.5M13.5 10.5l3.5 2" {...s} /></>,
  cycling: <><circle cx="6" cy="16" r="4" {...s} /><circle cx="18" cy="16" r="4" {...s} /><path d="M6 16l4-7h5l3 7M10 9l3 7h-2" {...s} /><circle cx="15" cy="5" r="1.6" {...s} /></>,
  swimming: <><circle cx="16" cy="7" r="2" {...s} /><path d="M3 15c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M3 19c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M6 12l5-4 4 4" {...s} /></>,
  football: <><circle cx="12" cy="12" r="9" {...s} /><path d="M12 7.5l3.5 2.5-1.3 4h-4.4L8.5 10z M12 3v4.5M15.5 10l4.6-1.4M14.2 14l2.6 4M9.8 14l-2.6 4M8.5 10L3.9 8.6" {...s} /></>,
  cricket: <><path d="M4 20l9-9 2.5 2.5-9 9zM13 11l5.5-5.5a1.8 1.8 0 0 1 2.5 2.5L15.5 13.5" {...s} /><circle cx="18" cy="18" r="2.2" {...s} /></>,
  badminton: <><path d="M14 10l6-6M10 14l-5 5" {...s} /><path d="M14 10l-4 4-3-3 4-4z" {...s} /><path d="M11 7l2-4 2 1 1 2 2 1 1 2-4 2" {...s} /></>,
  tennis: <><circle cx="9" cy="9" r="6" {...s} /><path d="M13.5 13.5L20 20M5 6c2 2 6 2 8 0M5 12c2-2 6-2 8 0" {...s} /><circle cx="19" cy="6" r="1.8" {...s} /></>,
  basketball: <><circle cx="12" cy="12" r="9" {...s} /><path d="M3 12h18M12 3v18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8" {...s} /></>,
  athletics: <><path d="M3 18h18M5 18v-4M19 18v-4M3 14h18" {...s} /><circle cx="12" cy="5" r="2" {...s} /><path d="M10 11l2-3 2 3" {...s} /></>,
};

export const SPORT_LIST = [
  { slug: "running", name: "Running" },
  { slug: "cycling", name: "Cycling" },
  { slug: "swimming", name: "Swimming" },
  { slug: "football", name: "Football" },
  { slug: "cricket", name: "Cricket" },
  { slug: "badminton", name: "Badminton" },
  { slug: "tennis", name: "Tennis" },
  { slug: "basketball", name: "Basketball" },
  { slug: "athletics", name: "Athletics" },
];

export function SportIcon({ sport, className = "" }: { sport: string; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden>{PATHS[sport] ?? PATHS.athletics}</svg>;
}
