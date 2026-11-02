/** "The Orbit": an open ring that turns into forward motion, with three dots for many sports. */
export function LogoMark({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M26.4 9.6A12 12 0 1 0 28 16" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M22.6 8.2l4.6 1.1-1.2 4.6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="2.6" fill="var(--color-ink-950, #111)" />
      <circle cx="10.2" cy="20.6" r="1.9" fill="var(--color-ink-950, #111)" />
      <circle cx="21.4" cy="20.8" r="1.9" fill="var(--color-ink-950, #111)" />
    </svg>
  );
}
