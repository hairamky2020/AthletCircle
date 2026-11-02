"use client";
import { useEffect, useState } from "react";
/** Days / hours / minutes until the start. Renders dashes until hydrated so static HTML never shows a stale count. */
export function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const s = now == null ? null : Math.max(0, (Date.parse(iso) - now) / 1000);
  const v = s == null ? ["–", "–", "–"] : [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60)].map(String);
  return <div className="ed-cd" aria-label="Time until the race starts">{["Days", "Hrs", "Min"].map((l, i) => <div key={l}><b>{v[i]}</b><span>{l}</span></div>)}</div>;
}
