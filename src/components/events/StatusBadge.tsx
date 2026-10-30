import { STATUS_LABEL, daysLeft, type RegistrationStatus } from "@/lib/registration";

const STYLE: Record<RegistrationStatus, string> = {
  open: "bg-green-50 text-green-700 ring-green-200",
  closing_soon: "bg-amber-50 text-amber-800 ring-amber-200",
  closed: "bg-ink-100 text-ink-600 ring-ink-200",
  not_yet_open: "bg-sky-50 text-sky-700 ring-sky-200",
  unknown: "bg-ink-50 text-ink-600 ring-ink-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  postponed: "bg-orange-50 text-orange-700 ring-orange-200",
  completed: "bg-ink-100 text-ink-600 ring-ink-200",
};

export function StatusBadge({ status, closes }: { status: RegistrationStatus; closes?: string | null }) {
  const d = status === "closing_soon" && closes ? daysLeft(new Date(closes)) : null;
  const label = d != null ? (d === 0 ? "Closes today" : `Closes in ${d} day${d === 1 ? "" : "s"}`) : STATUS_LABEL[status];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLE[status]}`}>{label}</span>;
}

export function DemoBadge() {
  return <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-200" title="Sample data for preview. Not a real event.">Demo</span>;
}
