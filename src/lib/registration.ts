// Registration status shown on cards and event pages, derived from dates and event state.
export type RegistrationStatus = "open" | "closing_soon" | "closed" | "not_yet_open" | "unknown" | "cancelled" | "postponed" | "completed";

export function registrationStatus(
  e: { state: string; regOpensAt: Date | null; regClosesAt: Date | null; startAt: Date; registrationUrl: string | null },
  now = new Date(),
): RegistrationStatus {
  if (e.state === "cancelled") return "cancelled";
  if (e.state === "postponed") return "postponed";
  if (e.state === "completed" || e.startAt < now) return "completed";
  if (e.regOpensAt && e.regOpensAt > now) return "not_yet_open";
  const closes = e.regClosesAt ?? null;
  if (closes && closes < now) return "closed";
  if (!closes && !e.registrationUrl) return "unknown";
  if (closes && closes.getTime() - now.getTime() <= 7 * 864e5) return "closing_soon";
  return "open";
}

export const STATUS_LABEL: Record<RegistrationStatus, string> = {
  open: "Registration open",
  closing_soon: "Closing soon",
  closed: "Registration closed",
  not_yet_open: "Opens soon",
  unknown: "Check organiser",
  cancelled: "Cancelled",
  postponed: "Postponed",
  completed: "Completed",
};

export function daysLeft(closes: Date | null, now = new Date()): number | null {
  if (!closes) return null;
  return Math.max(0, Math.ceil((closes.getTime() - now.getTime()) / 864e5));
}
