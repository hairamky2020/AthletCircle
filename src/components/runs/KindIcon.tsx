import type { Kind } from "@/lib/runs";

// Line illustrations for event categories: ink strokes with a coral highlight on a soft blob.
const blob = <path d="M14 34c-4-14 8-26 22-26s28 6 28 22-10 28-26 28S18 48 14 34Z" fill="#ff5252" opacity=".12" />;
const ink = { fill: "none", stroke: "#171511", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const red = { ...ink, stroke: "#ff5252" };

const ICONS: Record<Kind, React.ReactNode> = {
  half: <>{blob}<circle cx="44" cy="15" r="4" {...ink} /><path d="M40 21l-8 10 8 6-4 12M32 31l-10-2M40 27l10 4" {...ink} /><path d="M10 24h10M8 30h8M12 36h8" {...red} /><text x="46" y="56" fontSize="11" fontWeight="900" fill="#ff5252" fontStyle="italic">21</text></>,
  marathon: <>{blob}<circle cx="40" cy="14" r="4" {...ink} /><path d="M36 20l-6 12 8 5-3 13M30 32l-9 1M37 26l9 5" {...ink} /><path d="M14 52h40" {...ink} /><path d="M50 40v12M50 40l8 3-8 3" {...red} /></>,
  ultra: <>{blob}<path d="M8 52l16-24 10 12 8-10 14 22Z" {...ink} /><path d="M24 28l4 6M42 30l3 4" {...red} /><path d="M12 56c10-4 18 2 26-2s14 0 18 2" {...red} /></>,
  theme: <>{blob}<circle cx="24" cy="24" r="4" {...red} /><circle cx="44" cy="20" r="3" {...red} /><circle cx="36" cy="40" r="5" {...red} /><path d="M18 46l6-8M50 34l-6 4M30 12l2 6M48 48l4 4M14 30l-4-2" {...ink} /><path d="M20 54c6-6 18-6 24 0" {...ink} /></>,
  cause: <>{blob}<path d="M32 50S14 39 14 27a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 12-18 23-18 23Z" {...ink} /><path d="M20 30h6l3-5 4 10 3-5h8" {...red} /></>,
  community: <>{blob}<circle cx="22" cy="20" r="4" {...ink} /><circle cx="42" cy="20" r="4" {...ink} /><path d="M14 46c0-10 4-16 8-16s8 6 8 16M34 46c0-10 4-16 8-16s8 6 8 16" {...ink} /><path d="M10 52h44" {...red} /></>,
};

export function KindIcon({ kind }: { kind: Kind }) {
  return <svg width="72" height="64" viewBox="0 0 64 64" aria-hidden>{ICONS[kind]}</svg>;
}
