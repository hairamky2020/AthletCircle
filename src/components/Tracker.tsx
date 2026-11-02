"use client";

import { useEffect } from "react";
import { track, type Interaction } from "@/lib/backend";

/** Counts an anonymous page view, and clicks on any element inside with data-track="register_click" etc. */
export function Tracker({ slug }: { slug: string }) {
  useEffect(() => {
    track(slug, "view");
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-track]");
      if (el) track(slug, el.dataset.track as Interaction);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [slug]);
  return null;
}
