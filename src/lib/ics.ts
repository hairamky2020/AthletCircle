// iCalendar (.ics) and Google Calendar links for "Add to calendar".
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escapeText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export type CalEvent = { uid: string; title: string; start: Date; end: Date; location: string; url: string; description?: string; allDay?: boolean };

// All-day events use calendar dates: DTEND is the day after the last day.
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

export function buildIcs(e: CalEvent): string {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AthletCircle//Events//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@athletcircle`,
    `DTSTAMP:${stamp(new Date())}`,
    e.allDay ? `DTSTART;VALUE=DATE:${ymd(e.start)}` : `DTSTART:${stamp(e.start)}`,
    e.allDay ? `DTEND;VALUE=DATE:${ymd(e.end)}` : `DTEND:${stamp(e.end)}`,
    `SUMMARY:${escapeText(e.title)}`,
    `LOCATION:${escapeText(e.location)}`,
    `URL:${e.url}`,
    `DESCRIPTION:${escapeText((e.description ? e.description + "\n\n" : "") + e.url)}`,
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

export function googleCalendarUrl(e: CalEvent): string {
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: e.allDay ? `${ymd(e.start)}/${ymd(e.end)}` : `${stamp(e.start)}/${stamp(e.end)}`, location: e.location, details: e.url });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
