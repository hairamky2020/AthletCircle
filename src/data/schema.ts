import { z } from "zod";
import { detailsSchema } from "./details";

// Event records live in content/events.json and are validated at build time:
// a bad record fails the build instead of showing wrong information.
// Only add what has been announced. Unknown details (time, distances, fees, links) stay empty.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");
const url = z.string().url().refine((u) => /^https?:\/\//.test(u), "must start with http(s)://");

export const eventSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "lowercase letters, digits and hyphens only"),
  title: z.string().min(3),
  sport: z.string().default("running"),            // sport slug from the taxonomy
  city: z.string().default("in/telangana/hyderabad"),
  date: isoDate,
  endDate: isoDate.optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM, 24-hour IST").optional(),
  area: z.string().optional(),                      // as announced, e.g. "Gachibowli"
  venue: z.string().optional(),                     // exact venue, once known
  location: z.object({
    lat: z.number().min(6).max(37.5),
    lng: z.number().min(68).max(97.5),
    precision: z.enum(["venue", "area"]),          // "area" = centre of the locality, not the start line
  }).optional(),
  kind: z.enum(["half", "marathon", "ultra", "theme", "cause", "community"]).default("community"),
  distances: z.array(z.string()).default([]),       // e.g. ["5K", "10K", "21.1K"]
  registrationUrl: url.optional(),
  websiteUrl: url.optional(),
  status: z.enum(["scheduled", "cancelled", "postponed"]).default("scheduled"),
  featured: z.boolean().default(false),
  note: z.string().optional(),
  source: z.string().min(2),                        // where this listing came from
  added: isoDate,
  updated: isoDate.optional(),                      // last time any detail changed
  provenance: z.enum(["public", "organizer"]).default("public"), // public announcements vs organizer submission
  details: detailsSchema.default({}),
});

export type EventInput = z.input<typeof eventSchema>;
export type Run = z.output<typeof eventSchema>;
