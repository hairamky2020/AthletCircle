"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Run } from "@/data/schema";
import { dayParts, placeLabel, relativeDay, runHref, KINDS } from "@/lib/runs";
import { RegisterToggle } from "./RegisterToggle";
import { photoFor } from "@/lib/images";

// Each slide gets its own poster palette so the carousel feels like a stack of race posters.
const THEMES = [
  { bg: "linear-gradient(120deg,#0b2a6f 0%,#1d4ed8 55%,#60a5fa 100%)", accent: "#ffd23f" },
  { bg: "linear-gradient(120deg,#5a1a0b 0%,#c2410c 50%,#fb923c 100%)", accent: "#fff3c4" },
  { bg: "linear-gradient(120deg,#062e2a 0%,#0f766e 55%,#5eead4 100%)", accent: "#fde047" },
  { bg: "linear-gradient(120deg,#3b0a2a 0%,#be185d 55%,#f472b6 100%)", accent: "#fef08a" },
  { bg: "linear-gradient(120deg,#1c1917 0%,#44403c 50%,#a8a29e 100%)", accent: "#ff5252" },
];

/** Featured runs as a rotating poster banner (in the style of race posters). */
export function Banner({ runs, now }: { runs: Run[]; now: Date }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || runs.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % runs.length), 6000);
    return () => clearInterval(t);
  }, [paused, runs.length]);
  if (!runs.length) return null;
  const go = (d: number) => setI((x) => (x + d + runs.length) % runs.length);

  return (
    <section className="banner" aria-roledescription="carousel" aria-label="Featured runs" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {runs.map((r, n) => {
        const t = THEMES[n % THEMES.length];
        const d = dayParts(r.date);
        const tiles = r.distances.map((x) => ({ big: x.replace("K", " KM"), small: "" }));
        return (
          <div key={r.slug} className={`slide ${n === i ? "is-active" : ""}`} style={{ background: t.bg }} aria-hidden={n !== i} role="group" aria-roledescription="slide" aria-label={`${n + 1} of ${runs.length}`}>
            <span className="slide-day" aria-hidden>{String(d.day).padStart(2, "0")}</span>
            <svg className="slide-route" viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden>
              <path d="M0 250 C 120 180, 200 290, 330 210 S 520 60, 640 140 S 760 260, 800 200" fill="none" stroke="white" strokeOpacity=".35" strokeWidth="3" strokeDasharray="6 10" />
            </svg>
            <div className="slide-body">
              <div className="min-w-0">
                <p className="slide-kicker">{relativeDay(r.date, now)} · {KINDS[r.kind].label}</p>
                <h2 className="slide-title">{r.title}</h2>
                <p className="slide-date" style={{ background: t.accent }}>{d.day} {d.month} {d.year}</p>
                <p className="slide-place">
                  <svg width="14" height="16" viewBox="0 0 12 14" aria-hidden><path d="M6 13.5S1 8.6 1 5.5a5 5 0 0 1 10 0c0 3.1-5 8-5 8Z" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
                  {placeLabel(r) ? `${placeLabel(r)}, Hyderabad` : "Venue to be announced"}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href={runHref(r.slug)} className="slide-cta" tabIndex={n === i ? 0 : -1}>View run →</Link>
                  <span className="slide-reg"><RegisterToggle slug={r.slug} /></span>
                </div>
              </div>
              <figure className="slide-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoFor(r, 800).src} alt={photoFor(r).caption} loading={n === 0 ? "eager" : "lazy"} onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }} />
                <figcaption>
                  <span>{r.distances.length ? r.distances.join(" · ") : "Distances to be announced"}</span>
                  <a href={photoFor(r).page} target="_blank" rel="noopener" tabIndex={-1}>Photo: {photoFor(r).caption} · Wikimedia Commons</a>
                </figcaption>
              </figure>
            </div>
          </div>
        );
      })}
      {runs.length > 1 && (
        <>
          <div className="banner-arrows">
            <button onClick={() => go(-1)} aria-label="Previous featured run">‹</button>
            <button onClick={() => go(1)} aria-label="Next featured run">›</button>
          </div>
          <div className="banner-dots">
            {runs.map((r, n) => <button key={r.slug} onClick={() => setI(n)} aria-label={`Show ${r.title}`} aria-current={n === i} />)}
          </div>
        </>
      )}
    </section>
  );
}
