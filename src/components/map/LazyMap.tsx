"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import type { EventMap as EventMapType } from "./EventMap";

const EventMap = dynamic(() => import("./EventMap").then((m) => m.EventMap), {
  ssr: false,
  loading: () => <div className="grid h-full w-full place-items-center rounded-2xl bg-ink-100 text-sm text-ink-500">Loading map…</div>,
});

/** Loads the map library only when the map scrolls into view (keeps pages fast). */
export function LazyMap(props: ComponentProps<typeof EventMapType> & { height?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={props.height ?? "h-[420px]"}>
      {show ? <EventMap {...props} className="h-full w-full rounded-2xl" /> : <div className="h-full w-full rounded-2xl bg-ink-100" />}
    </div>
  );
}
