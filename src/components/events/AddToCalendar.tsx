"use client";

import { buildIcs, googleCalendarUrl, type CalEvent } from "@/lib/ics";

export function AddToCalendar({ ev }: { ev: Omit<CalEvent, "start" | "end"> & { start: string; end: string } }) {
  const e: CalEvent = { ...ev, start: new Date(ev.start), end: new Date(ev.end) };
  const download = () => {
    const blob = new Blob([buildIcs(e)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${ev.uid}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <a href={googleCalendarUrl(e)} target="_blank" rel="noopener" className="btn btn-ghost !py-2 text-sm">📅 Google Calendar</a>
      <button onClick={download} className="btn btn-ghost !py-2 text-sm">⬇ Apple / Outlook (.ics)</button>
    </div>
  );
}
