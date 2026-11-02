import { SITE } from "./site";
// On the live site without a database, the in-browser demo must not run: it would let any visitor
// "sign in" as an admin in their own browser. Organizer submissions go by email until Supabase is connected.
// Demo is OFF unless explicitly enabled (local test builds set NEXT_PUBLIC_ENABLE_DEMO=1).
export const DEMO_ALLOWED = process.env.NEXT_PUBLIC_ENABLE_DEMO === "1" && process.env.NEXT_PUBLIC_DISABLE_DEMO !== "1";
export const HAS_DB = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const PORTAL_ON = HAS_DB || DEMO_ALLOWED;
export const submitMail = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("New event for AthletCircle")}&body=${encodeURIComponent("Event name:\nDate:\nVenue / area:\nCategories and fees:\nRegistration link:\nOrganizer name and phone:\n")}`;
