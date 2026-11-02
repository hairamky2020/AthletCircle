/* eslint-disable @next/next/no-img-element */
// Approved AthletCircle logo assets (supplied by the brand owner). Never redraw or recolour.
// Paths are relative-safe: make-offline rewrites "/brand/..." for the double-click build.

export function LogoFull({ height = 40 }: { height?: number }) {
  return <img src="/brand/logo-horizontal.png" alt="AthletCircle" height={height} style={{ height, width: "auto" }} />;
}
export function LogoIcon({ size = 36 }: { size?: number }) {
  return <img src="/brand/icon.png" alt="AthletCircle" height={size} style={{ height: size, width: "auto" }} />;
}
export function LogoReversed({ height = 56 }: { height?: number }) {
  return <img src="/brand/logo-reversed-on-navy.png" alt="AthletCircle" height={height} style={{ height, width: "auto", borderRadius: 12 }} />;
}
