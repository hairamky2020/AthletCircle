"use client";

import { useMyRuns } from "@/lib/myRuns";

/** Lets a visitor mark a run as one they've registered for; it then shows under "My runs". */
export function RegisterToggle({ slug, size = "sm" }: { slug: string; size?: "sm" | "lg" }) {
  const { has, toggle } = useMyRuns();
  const on = has(slug);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(slug); }}
      aria-pressed={on}
      className={`reg-toggle ${size === "lg" ? "reg-toggle-lg" : ""} ${on ? "is-on" : ""}`}
      title={on ? "Remove from My runs" : "Add to My runs"}>
      <span className="reg-dot" aria-hidden>{on ? "✓" : "+"}</span>
      {on ? "Registered" : "I’m registered"}
    </button>
  );
}
