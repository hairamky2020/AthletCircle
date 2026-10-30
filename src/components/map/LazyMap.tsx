"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import type { RunMap as RunMapType } from "./RunMap";

const RunMap = dynamic(() => import("./RunMap").then((m) => m.RunMap), {
  ssr: false,
  loading: () => <div className="grid h-full w-full place-items-center bg-ink-100 text-sm text-ink-500">Loading map…</div>,
});

/** Loads the map library only when the map scrolls into view (keeps pages fast). */
export function LazyMap(props: ComponentProps<typeof RunMapType> & { height?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`${props.height ?? "h-[420px]"} overflow-hidden rounded-lg border border-line`}>
      {show ? <RunMap {...props} className="h-full w-full" /> : <div className="h-full w-full bg-ink-100" />}
    </div>
  );
}
