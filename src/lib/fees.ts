
/** Lowest announced fee, as quoted text; never computed beyond picking the minimum. */export function feeFrom(run: { details?: { categories?: { fee?: string }[]; overview?: string } }): string | null {
  const nums = (run.details?.categories ?? []).map((c) => c.fee?.match(/₹\s?([\d,]+)/)?.[1]).filter(Boolean).map((n) => Number(n!.replace(/,/g, "")));
  if (!nums.length) { const m = run.details?.overview?.match(/from ₹\s?([\d,]+)/); return m ? `From ₹${m[1]}` : null; }
  const min = Math.min(...nums); return `${nums.length > 1 ? "From " : ""}₹${min.toLocaleString("en-IN")}`;
}
export function prizeText(run: { details?: { prizes?: { places: { award: string }[] }[]; awards?: string[] } }): string | null {
  const top = run.details?.prizes?.[0]?.places?.[0]?.award; if (top) return `Up to ${top}`;
  return run.details?.awards?.length ? "Awards" : null;
}
