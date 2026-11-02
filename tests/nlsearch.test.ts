import { test, expect } from "vitest";
import { parseQuery, matchesParsed } from "@/lib/nlsearch";
import { RUNS } from "@/data/events";
const now = new Date("2026-11-02");
const q = (s: string) => RUNS.filter((r) => r.date >= "2026-11-02" && matchesParsed(r, parseQuery(s, now), () => false)).map((r) => r.slug);
test("free-text search understands plain sentences", () => {
  expect(q("I want to know runs").length).toBeGreaterThan(10);
  expect(q("10k runs in december")).toEqual(["sankalp-suraksha-run-2026", "freshathon-winter-rush-2026"]);
  expect(q("trail")).toContain("forest-run-uppal-2026");
  expect(parseQuery("half marathon under ₹800", now)).toMatchObject({ dist: ["21.1K"], maxFee: 800 });
});
