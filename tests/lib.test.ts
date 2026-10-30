import { describe, expect, it } from "vitest";
import { haversineMetres, formatDistance, formatDuration, coarsen, nextRadius, isInIndia } from "@/lib/geo";
import { presetRange, istDate, formatEventDate } from "@/lib/dates";
import { registrationStatus } from "@/lib/registration";
import { searchEvents } from "@/lib/search";
import type { EventSummary } from "@/lib/event-types";

describe("geo", () => {
  it("computes straight-line distance (Gachibowli to HITEC City ≈ 3 km)", () => {
    const d = haversineMetres({ lat: 17.4401, lng: 78.3489 }, { lat: 17.4474, lng: 78.3762 });
    expect(d).toBeGreaterThan(2800);
    expect(d).toBeLessThan(3100);
  });
  it("formats kilometres and minutes", () => {
    expect(formatDistance(3240)).toBe("3.2 KM");
    expect(formatDistance(18400)).toBe("18 KM");
    expect(formatDistance(540)).toBe("540 M");
    expect(formatDuration(900)).toBe("about 15 min");
    expect(formatDuration(4800)).toBe("about 1 hr 20 min");
  });
  it("coarsens coordinates to ~1 km", () => {
    expect(coarsen({ lat: 17.440123, lng: 78.348987 })).toEqual({ lat: 17.44, lng: 78.35 });
  });
  it("suggests the next radius", () => {
    expect(nextRadius(25)).toBe(50);
    expect(nextRadius(200)).toBeNull();
  });
  it("rejects points outside India", () => {
    expect(isInIndia({ lat: 51.5, lng: -0.12 })).toBe(false);
    expect(isInIndia({ lat: 12.97, lng: 77.59 })).toBe(true);
  });
});

describe("dates", () => {
  it("uses IST calendar days", () => {
    expect(istDate(new Date("2026-10-30T20:00:00Z"))).toBe("2026-10-31");
  });
  it("weekend preset on a Wednesday ends Monday 00:00 IST", () => {
    const { to } = presetRange("weekend", new Date("2026-11-04T06:00:00Z")); // Wed
    expect(to!.toISOString()).toBe("2026-11-08T18:30:00.000Z"); // Mon 9 Nov 00:00 IST
  });
  it("weekend preset on a Sunday covers only today", () => {
    const { to } = presetRange("weekend", new Date("2026-11-08T06:00:00Z")); // Sun
    expect(to!.toISOString()).toBe("2026-11-08T18:30:00.000Z");
  });
  it("formats single and multi-day events", () => {
    const now = new Date("2026-10-30T00:00:00Z");
    expect(formatEventDate(new Date("2026-11-08T00:00:00+05:30"), null, now)).toMatch(/8 Nov/);
    expect(formatEventDate(new Date("2026-11-09T08:00:00+05:30"), new Date("2026-11-10T18:00:00+05:30"), now)).toMatch(/9 Nov.*10 Nov/);
  });
});

describe("registration status", () => {
  const base = { state: "published", regOpensAt: null, regClosesAt: null, startAt: new Date("2026-12-01"), registrationUrl: "https://x.example" };
  const now = new Date("2026-11-01T00:00:00Z");
  it("open / closing soon / closed / not yet open", () => {
    expect(registrationStatus({ ...base, regClosesAt: new Date("2026-11-20") }, now)).toBe("open");
    expect(registrationStatus({ ...base, regClosesAt: new Date("2026-11-05") }, now)).toBe("closing_soon");
    expect(registrationStatus({ ...base, regClosesAt: new Date("2026-10-20") }, now)).toBe("closed");
    expect(registrationStatus({ ...base, regOpensAt: new Date("2026-11-10") }, now)).toBe("not_yet_open");
  });
  it("cancelled and past events", () => {
    expect(registrationStatus({ ...base, state: "cancelled" }, now)).toBe("cancelled");
    expect(registrationStatus({ ...base, startAt: new Date("2026-10-01") }, now)).toBe("completed");
  });
});

describe("search", () => {
  const ev = (o: Partial<EventSummary>): EventSummary => ({
    slug: "x", title: "X", sport: "10k", sportName: "10K", rootSport: "running", icon: "", colour: "#000",
    start: "2026-11-08T05:00:00+05:30", end: null, status: "scheduled", venueName: "V", localityName: null,
    cityPath: "in/telangana/hyderabad", cityName: "Hyderabad", statePath: "in/telangana", lat: 17.44, lng: 78.35,
    regOpens: null, regCloses: null, registrationUrl: null, isFree: false, priceMin: null, priceMax: null, featured: false,
    demo: false, level: "open", ageMin: null, ageMax: null, organiserName: null, lastVerified: null, added: null, ...o,
  });
  const now = new Date("2026-11-01T00:00:00Z");
  const list = [
    ev({ slug: "near", lat: 17.445, lng: 78.35 }),
    ev({ slug: "far", lat: 17.6, lng: 78.5, start: "2026-11-05T05:00:00+05:30" }),
    ev({ slug: "past", start: "2026-10-01T05:00:00+05:30" }),
    ev({ slug: "chess", sport: "chess", rootSport: "chess", title: "Chess Open", ageMin: 18 }),
  ];
  it("drops past events and sorts by date", () => {
    expect(searchEvents(list, {}, now).map((e) => e.slug)).toEqual(["far", "near", "chess"]);
  });
  it("filters by radius and sorts nearest first", () => {
    const r = searchEvents(list, { origin: { lat: 17.44, lng: 78.35 }, radiusKm: 5 }, now);
    expect(r.map((e) => e.slug)).toEqual(["chess", "near"]); // chess sits exactly at the origin
    expect(r[1].distanceM).toBeLessThan(1000);
  });
  it("filters by sport tree, text and age", () => {
    expect(searchEvents(list, { sports: new Set(["chess"]) }, now).map((e) => e.slug)).toEqual(["chess"]);
    expect(searchEvents(list, { q: "chess open" }, now).map((e) => e.slug)).toEqual(["chess"]);
    expect(searchEvents(list, { age: 12 }, now).map((e) => e.slug)).not.toContain("chess");
  });
});
