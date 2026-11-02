// AthletCircle approved design system: the single source for brand values used in TS
// (map markers, sport accents). CSS uses the same values as variables in globals.css (@theme).
// Do not change these without the brand owner's approval.

export const BRAND = {
  orange: "#FF8A00",
  green: "#36B900",
  blue: "#0866E9",
  navy: "#10284B",
} as const;

/** Sport accent colours (category accents, not replacements for the brand colours). */
export const SPORT_COLOURS: Record<string, string> = {
  running: "#FF8A00",
  cycling: "#16A34A",
  swimming: "#0284C7",
  football: "#059669",
  cricket: "#1D4ED8",
  badminton: "#7C3AED",
  tennis: "#65A30D",
  basketball: "#DC2626",
  athletics: "#0D9488",
};
export const sportColour = (slug: string) => SPORT_COLOURS[slug] ?? BRAND.blue;
