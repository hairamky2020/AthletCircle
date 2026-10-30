// Date helpers. All user-facing dates are shown in India Standard Time.
export const TZ = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 36e5;

/** Calendar date (YYYY-MM-DD) of an instant, in IST. */
export function istDate(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Start of an IST calendar day as a UTC instant. */
export function istDayStart(ymd: string): Date {
  return new Date(Date.parse(`${ymd}T00:00:00Z`) - IST_OFFSET_MS);
}

export function addDays(ymd: string, days: number): string {
  return new Date(Date.parse(`${ymd}T00:00:00Z`) + days * 864e5).toISOString().slice(0, 10);
}

export type DatePreset = "weekend" | "7d" | "30d" | "this-month" | "next-month" | "all";

/** [from, to) instants for a preset, relative to `now`. */
export function presetRange(preset: DatePreset, now = new Date()): { from: Date; to: Date | null } {
  const today = istDate(now);
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  switch (preset) {
    case "weekend": {
      // Upcoming Saturday + Sunday; on a weekend, the rest of this weekend.
      const sat = dow === 6 ? today : dow === 0 ? addDays(today, -1) : addDays(today, 6 - dow);
      return { from: now, to: istDayStart(addDays(sat, 2)) };
    }
    case "7d":
      return { from: now, to: istDayStart(addDays(today, 8)) };
    case "30d":
      return { from: now, to: istDayStart(addDays(today, 31)) };
    case "this-month": {
      const [y, m] = today.split("-").map(Number);
      return { from: now, to: istDayStart(new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)) };
    }
    case "next-month": {
      const [y, m] = today.split("-").map(Number);
      return {
        from: istDayStart(new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)),
        to: istDayStart(new Date(Date.UTC(y, m + 1, 1)).toISOString().slice(0, 10)),
      };
    }
    default:
      return { from: now, to: null };
  }
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: TZ, ...opts });
const dayFmt = fmt({ weekday: "short", day: "numeric", month: "short" });
const dayYearFmt = fmt({ weekday: "short", day: "numeric", month: "short", year: "numeric" });
const timeFmt = fmt({ hour: "numeric", minute: "2-digit", hour12: true });
const longFmt = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function formatEventDate(start: Date, end?: Date | null, now = new Date()): string {
  const sameYear = istDate(start).slice(0, 4) === istDate(now).slice(0, 4);
  const f = sameYear ? dayFmt : dayYearFmt;
  if (end && istDate(end) !== istDate(start)) return `${f.format(start)} – ${f.format(end)}`;
  return `${f.format(start)} · ${timeFmt.format(start).toUpperCase()}`;
}

export const formatLongDate = (d: Date) => longFmt.format(d);
export const formatTime = (d: Date) => timeFmt.format(d).toUpperCase();
export const formatShortDate = (d: Date) => dayFmt.format(d);
