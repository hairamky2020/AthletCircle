import { describe, expect, it } from "vitest";
import { haversineMetres, formatDistance, coarsen, isInIndia } from "@/lib/geo";
import { dayParts, groupByMonth, isPast, relativeDay, formatShort } from "@/lib/runs";
import { buildIcs, googleCalendarUrl } from "@/lib/ics";
import { RUNS, getRun, otherRuns } from "@/data/events";

describe("geo", () => {
  it("computes straight-line distance (Gachibowli to HITEC City ≈ 3 km)", () => {
    const d = haversineMetres({ lat: 17.4401, lng: 78.3489 }, { lat: 17.4474, lng: 78.3762 });
    expect(d).toBeGreaterThan(2800);
    expect(d).toBeLessThan(3100);
  });
  it("formats distance", () => {
    expect(formatDistance(3240)).toBe("3.2 KM");
    expect(formatDistance(540)).toBe("540 M");
  });
  it("coarsens coordinates to ~1 km", () => {
    expect(coarsen({ lat: 17.440123, lng: 78.348987 })).toEqual({ lat: 17.44, lng: 78.35 });
  });
  it("rejects points outside India", () => {
    expect(isInIndia({ lat: 51.5, lng: -0.12 })).toBe(false);
  });
});

describe("run dates", () => {
  it("reads weekday and day from a calendar date", () => {
    expect(dayParts("2026-10-31")).toMatchObject({ weekday: "Sat", day: 31, month: "Oct", year: 2026 });
    expect(formatShort("2026-11-01")).toBe("Sun, 1 Nov");
  });
  it("keeps a run listed through its day in IST", () => {
    const run = { date: "2026-11-01" };
    expect(isPast(run, new Date("2026-11-01T17:00:00Z"))).toBe(false); // 22:30 IST same day
    expect(isPast(run, new Date("2026-11-01T19:00:00Z"))).toBe(true);  // 00:30 IST next day
  });
  it("describes how far away a date is", () => {
    const now = new Date("2026-10-30T06:00:00Z");
    expect(relativeDay("2026-10-30", now)).toBe("Today");
    expect(relativeDay("2026-10-31", now)).toBe("Tomorrow");
    expect(relativeDay("2026-11-05", now)).toBe("In 6 days");
  });
  it("groups by month in order", () => {
    const g = groupByMonth([{ date: "2026-11-01" }, { date: "2026-11-22" }, { date: "2027-01-03" }]);
    expect(g.map((x) => [x.label, x.items.length])).toEqual([["November 2026", 2], ["January 2027", 1]]);
  });
});

describe("calendar export", () => {
  const ev = { uid: "x", title: "Signathon", start: new Date("2026-10-31T00:00:00Z"), end: new Date("2026-11-01T00:00:00Z"), location: "Gachibowli", url: "https://x", allDay: true };
  it("writes all-day dates", () => {
    expect(buildIcs(ev)).toContain("DTSTART;VALUE=DATE:20261031");
    expect(buildIcs(ev)).toContain("DTEND;VALUE=DATE:20261101");
    expect(googleCalendarUrl(ev)).toContain("dates=20261031%2F20261101");
  });
});

describe("run data", () => {
  it("has the 18 Hyderabad runs, sorted by date, with unique slugs", () => {
    expect(RUNS).toHaveLength(18);
    expect(RUNS.map((r) => r.date)).toEqual([...RUNS.map((r) => r.date)].sort());
    expect(new Set(RUNS.map((r) => r.slug)).size).toBe(18);
    expect(RUNS[0].title).toBe("Signathon");
    expect(RUNS.at(-1)!.date).toBe("2027-03-07");
  });
  it("never invents links, times or distances", () => {
    for (const r of RUNS) {
      expect(r.registrationUrl).toBeUndefined();
      expect(r.startTime).toBeUndefined();
      expect(r.distances).toEqual([]);
    }
  });
  it("marks area pins as approximate", () => {
    expect(RUNS.filter((r) => r.location).every((r) => r.location!.precision === "area")).toBe(true);
  });
  it("finds runs around the same date", () => {
    const o = otherRuns(getRun("hitech-marathon-2026")!);
    expect(o.map((x) => x.date)).toContain("2026-11-01");
  });
});
