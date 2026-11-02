/**
 * Reserved ad space. Currently shows the OurTemples.Info banner (animated in CSS, no image file,
 * no third-party script). Marked as an ad and linked with rel="sponsored".
 */
export function AdSlot({ size }: { size: "leaderboard" | "inline" }) {
  return (
    <aside className={`ad-slot ad-${size} ad-temple`} aria-label="Advertisement">
      <span className="ad-label">Ad</span>
      <a href="https://www.ourtemples.info" target="_blank" rel="sponsored noopener" className="at-link">
        <svg className="at-art" viewBox="0 0 220 140" aria-hidden="true">
          <circle className="at-sun" cx="110" cy="70" r="46" />
          <g className="at-temple">
            <path d="M80 130V96h60v34Z" />
            <path d="M86 96l6-14h36l6 14Z" />
            <path d="M92 82l5-12h26l5 12Z" />
            <path d="M97 70l4-10h18l4 10Z" />
            <path d="M101 60l3-8h12l3 8Z" />
            <path d="M106 52l4-10 4 10Z" />
            <circle cx="110" cy="38" r="3" />
            <path className="at-door" d="M102 130v-16a8 8 0 0 1 16 0v16Z" />
            <path d="M40 130v-22h22v22ZM158 130v-22h22v22Z" opacity=".55" />
            <path d="M44 108l7-10 7 10ZM162 108l7-10 7 10Z" opacity=".55" />
          </g>
          <path className="at-bell" d="M188 30v6M182 48a6 6 0 0 1 12 0v4h-12Z M188 55v3" />
          <g className="at-diya"><ellipse cx="34" cy="50" rx="7" ry="3" /><path className="at-flame" d="M34 46c-3-3-2-7 0-10 2 3 3 7 0 10Z" /></g>
        </svg>
        <span className="at-copy">
          <span className="at-q">Are you looking for temples information?</span>
          <span className="at-brand">Visit <strong>www.OurTemples.Info</strong></span>
        </span>
        <span className="at-cta">Visit now →</span>
      </a>
    </aside>
  );
}
