import { z } from "zod";

// Event records live in content/events.json. Every field is validated at build time;
// an invalid record fails the build with a clear message rather than showing wrong data.

const isoDateTime = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "must be an ISO date-time, e.g. 2026-12-14T05:30:00+05:30");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");
const url = z.string().url().refine((u) => /^https?:\/\//.test(u), "must start with http(s)://");

export const categorySchema = z.object({
  name: z.string().min(1),
  distanceM: z.number().int().positive().optional(),
  format: z.string().optional(),
  gender: z.string().optional(),
  ageMin: z.number().int().optional(),
  ageMax: z.number().int().optional(),
  fee: z.number().nonnegative().optional(),
  registrationUrl: url.optional(),
});

export const eventSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "lowercase letters, digits and hyphens only"),
  title: z.string().min(3),
  sport: z.string(),                       // sport or subcategory slug from the taxonomy
  summary: z.string().max(300).optional(),
  description: z.string().optional(),
  banner: z.string().optional(),
  start: isoDateTime,
  end: isoDateTime.optional(),
  status: z.enum(["scheduled", "cancelled", "postponed"]).default("scheduled"),
  online: z.boolean().default(false),
  venue: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),                      // location path, e.g. in/telangana/hyderabad
    locality: z.string().optional(),       // locality slug in that city
    pincode: z.string().regex(/^\d{6}$/).optional(),
    lat: z.number().min(6).max(37.5),
    lng: z.number().min(68).max(97.5),
    pinVerified: z.boolean(),              // a person confirmed the pin on the map
  }),
  organiser: z.string().optional(),        // organiser slug
  level: z.enum(["open", "amateur", "professional", "junior", "masters"]).default("open"),
  format: z.string().optional(),
  ageMin: z.number().int().optional(),
  ageMax: z.number().int().optional(),
  isFree: z.boolean().default(false),
  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),
  registrationOpens: isoDateTime.optional(),
  registrationCloses: isoDateTime.optional(),
  registrationUrl: url.optional(),
  websiteUrl: url.optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  social: z.record(z.string(), url).default({}),
  attributes: z.record(z.string(), z.unknown()).default({}),
  categories: z.array(categorySchema).default([]),
  featured: z.boolean().default(false),
  verification: z.object({
    verified: z.boolean(),
    lastVerified: isoDate.optional(),
    sources: z.array(url).min(1, "at least one source URL is required"),
  }),
  added: isoDate.optional(),               // date the listing was added (for "Recently added")
  demo: z.boolean().default(false),
});

export type EventInput = z.input<typeof eventSchema>;
export type EventRecord = z.output<typeof eventSchema>;

export const organiserSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  description: z.string().optional(),
  logo: z.string().optional(),
  website: url.optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  social: z.record(z.string(), url).default({}),
  verified: z.boolean().default(false),
  demo: z.boolean().default(false),
});
export type OrganiserRecord = z.output<typeof organiserSchema>;
