"use client";

// "My runs": the runs a visitor marked as registered. Kept only in this browser (no accounts in phase 1).
import { useEffect, useState } from "react";

const KEY = "ac.myruns.v1";
const EVT = "ac:myruns";

function read(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function useMyRuns() {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setSlugs(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const toggle = (slug: string) => {
    const cur = read();
    const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new Event(EVT));
  };
  return { slugs, has: (s: string) => slugs.includes(s), toggle };
}
