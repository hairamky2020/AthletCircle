"use client";

import { buildIcs, googleCalendarUrl, type CalEvent } from "@/lib/ics";

type Props = { slug: string; title: string; date: string; endDate?: string; place: string; url: string };

/** All-day calendar entry: start times are often announced late, so we don't guess one. */
export function AddToCalendar({ slug, title, date, endDate, place, url }: Props) {
  const day = (ymd: string, add = 0) => new Date(Date.parse(`${ymd}T00:00:00Z`) + add * 864e5);
  const ev: CalEvent = { uid: slug, title, start: day(date), end: day(endDate ?? date, 1), location: place, url, allDay: true };
  const download = () => {
    const blob = new Blob([buildIcs(ev)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      <a href={googleCalendarUrl(ev)} target="_blank" rel="noopener" className="link">Google Calendar</a>
      <button onClick={download} className="link">Apple / Outlook (.ics)</button>
    </div>
  );
}
