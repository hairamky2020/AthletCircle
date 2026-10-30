import { dayParts } from "@/lib/runs";

/** Race-calendar style date: weekday over a large day number. */
export function DateBlock({ date, size = "md" }: { date: string; size?: "md" | "lg" }) {
  const d = dayParts(date);
  const big = size === "lg";
  return (
    <div className={`flex shrink-0 flex-col items-start leading-none ${big ? "w-20" : "w-14"}`} aria-hidden>
      <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">{d.weekday}</span>
      <span className={`font-bold tracking-tight ${big ? "mt-1 text-6xl" : "mt-1 text-3xl"}`}>{d.day}</span>
      {big && <span className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-500">{d.month} {d.year}</span>}
    </div>
  );
}
