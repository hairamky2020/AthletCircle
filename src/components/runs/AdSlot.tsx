import { SITE } from "@/lib/site";

/**
 * Reserved ad space. Until an ad is booked it shows a house ad for sponsors; later this can render
 * an ad network tag or a sold banner image without changing the layout around it.
 */
export function AdSlot({ size }: { size: "leaderboard" | "inline" }) {
  const mail = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Advertising on athletcircle")}`;
  return (
    <aside className={`ad-slot ad-${size}`} aria-label="Advertisement">
      <span className="ad-label">Ad</span>
      <p className="font-black italic uppercase tracking-tight">Your brand on Hyderabad’s start lines</p>
      <p className="text-sm text-ink-500">Reach runners planning their next race. Banner spots available.</p>
      <a href={mail} className="ad-cta">Advertise with us</a>
    </aside>
  );
}
