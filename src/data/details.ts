import { z } from "zod";

// Rich, optional event details. Every field is optional: anything not announced stays empty and the
// page says "Not Announced" (or "Not Applicable" where an organizer marks it so). Nothing is guessed.
// The same shape is stored in events.details (jsonb) in Supabase.

const url = z.string().url().refine((u) => /^https?:\/\//.test(u), "must start with http(s)://");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const SECTION_KEYS = [
  "basics", "timing", "venue", "categories", "prizes", "registration", "overview", "schedule",
  "facilities", "eligibility", "organizer", "gallery", "faqs", "sport",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const FACILITIES = {
  water: "Water stations", refreshments: "Refreshments", medical: "Medical support", ambulance: "Ambulance",
  timing: "Timing chip", bib: "Bib", tshirt: "Event T-shirt", medal: "Finisher medal", certificate: "E-certificate",
  photos: "Event photos", parking: "Parking", baggage: "Baggage counter", toilets: "Toilets", changing: "Changing rooms",
  pacers: "Pacers", physio: "Physio", breakfast: "Breakfast",
} as const;
export type FacilityKey = keyof typeof FACILITIES;

export const detailsSchema = z.object({
  reportingTime: z.string().optional(),            // e.g. "05:00"
  endTime: z.string().optional(),
  overview: z.string().optional(),
  categories: z.array(z.object({
    name: z.string(),                              // "10K", "Men's Singles U-17", "Open T20"
    distance: z.string().optional(),
    fee: z.string().optional(),                    // as announced, e.g. "₹1,200" — kept as text, never computed
    startTime: z.string().optional(),
    cutoff: z.string().optional(),
    ageGroup: z.string().optional(),
    slots: z.string().optional(),
    note: z.string().optional(),
  })).default([]),
  prizes: z.array(z.object({
    category: z.string(),
    places: z.array(z.object({ place: z.string(), award: z.string() })).default([]),
    note: z.string().optional(),
  })).default([]),
  awards: z.array(z.string()).default([]),         // medals, trophies, certificates
  schedule: z.array(z.object({ date: isoDate.optional(), time: z.string().optional(), item: z.string() })).default([]),
  facilities: z.array(z.enum(Object.keys(FACILITIES) as [FacilityKey, ...FacilityKey[]])).default([]),
  eligibility: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  organizer: z.object({
    name: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional(),
    website: url.optional(), instagram: url.optional(),
  }).default({}),
  gallery: z.array(z.object({ type: z.enum(["image", "video"]), url, caption: z.string().optional(), credit: z.string() })).default([]),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  sportFields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).default({}),
  // Provenance: which sections our team checked against an official source. Everything else is
  // shown as "From the organizer" or "From public announcements".
  verified: z.array(z.enum(SECTION_KEYS)).default([]),
  notApplicable: z.array(z.enum(SECTION_KEYS)).default([]),
  history: z.array(z.object({ date: isoDate, change: z.string() })).default([]),
});

export type EventDetails = z.output<typeof detailsSchema>;
export const emptyDetails = (): EventDetails => detailsSchema.parse({});
