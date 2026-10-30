import { describe, expect, it } from "vitest";
import { ALL_EVENTS, PUBLIC_EVENTS, isPublic } from "@/data/events";
import { searchPlaces, nearestPlace, getPlace } from "@/data/locations";
import { getSport, sportTree, schemaFor } from "@/data/sports";

describe("event data", () => {
  it("loads and validates every record", () => {
    expect(ALL_EVENTS.length).toBeGreaterThan(0);
  });
  it("never publishes unverified events or unconfirmed pins", () => {
    expect(PUBLIC_EVENTS.every(isPublic)).toBe(true);
    expect(ALL_EVENTS.some((e) => !isPublic(e))).toBe(true); // the demo set includes one pending submission
  });
  it("labels every demo record", () => {
    for (const e of ALL_EVENTS.filter((x) => x.demo)) expect(e.title).toMatch(/\(Demo\)$/);
  });
});

describe("gazetteer", () => {
  it("finds localities, aliases and PIN codes", () => {
    expect(searchPlaces("gachi")[0].label).toBe("Gachibowli");
    expect(searchPlaces("Bangalore")[0].label).toBe("Bengaluru");
    expect(searchPlaces("500032")[0].label).toContain("Gachibowli");
    expect(searchPlaces("bangalore airport")[0].label).toBe("Devanahalli");
  });
  it("labels a GPS point with the nearest locality", () => {
    expect(nearestPlace({ lat: 17.441, lng: 78.35 })?.name).toBe("Gachibowli");
    expect(nearestPlace({ lat: 51.5, lng: -0.12 })).toBeNull();
  });
  it("has the launch cities", () => {
    expect(getPlace("in/telangana/hyderabad")?.launch).toBe(true);
    expect(getPlace("in/karnataka/bengaluru")?.launch).toBe(true);
  });
});

describe("sports taxonomy", () => {
  it("includes subcategories in a sport tree and inherits schemas", () => {
    expect(sportTree("running").has("half-marathon")).toBe(true);
    expect(getSport("half-marathon")?.parent).toBe("running");
    expect(Object.keys(schemaFor("half-marathon").properties ?? {})).toContain("terrain");
  });
});
