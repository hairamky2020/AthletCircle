// Browser smoke test on desktop and phone sizes.
//   Served site:      BASE=http://localhost:3000 node e2e/smoke.mjs
//   Double-click copy: FILE=/abs/path/to/out-offline node e2e/smoke.mjs
// SHOTS=/some/dir saves screenshots.
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const FILE = process.env.FILE;
const BASE = process.env.BASE ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS;
// "/runs/x?a=1" -> URL for the mode under test
const url = (p) => {
  if (!FILE) return BASE + p;
  const [, path, rest] = p.match(/^([^?#]*)(.*)$/);
  return `file://${FILE}/${path === "/" ? "index" : path.slice(1)}.html${rest}`;
};
const pathOf = (u) => FILE ? u.replace(`file://${FILE}/`, "/").replace(/index\.html/, "").replace(/\.html/, "") : u.replace(BASE, "");

let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? "✓" : "✗"} ${msg}`); if (!ok) failed++; };

async function run(label, ctxOpts) {
  console.log(`\n— ${label}${FILE ? " (file://)" : ""}`);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...ctxOpts, geolocation: { latitude: 17.4401, longitude: 78.3489 }, permissions: ["geolocation"] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/tiles|Failed to load resource/.test(m.text()) && errors.push(m.text()));
  const shot = async (n) => SHOTS && page.screenshot({ path: `${SHOTS}/${label}-${n}.png` });
  const settle = () => page.waitForTimeout(700);

  await page.goto(url("/")); await settle();
  check(await page.getByRole("heading", { name: /Every Sport. Every Athlete/ }).isVisible(), "home: brand hero");
  check(await page.locator('header img[alt="AthletCircle"]:visible').count() === 1, "home: approved logo in header");
  check((await page.locator(".featured-strip").count()) === 0, "home: no featured carousel");
  check((await page.locator(".sport-bar .sb-item").count()) === 1, "home: only Running in sports bar");
  check((await page.locator(".ad-slot").count()) === 1, "home: one ad space");
  const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  check(/manrope/i.test(font), `Manrope font (${font.slice(0, 40)})`);
  const cards = () => page.locator("#upcoming .ev-card");
  check((await cards().count()) >= 10, `event cards (${await cards().count()})`);
  check(/From ₹|₹\d/.test(await cards().first().textContent()) && (await page.locator("#upcoming").getByText("Not Announced").count()) >= 1, "cards show known fees and Not Announced otherwise");
  check(!(await page.content()).includes("Demo"), "no demo data");
  await shot("home");

  await page.locator("#upcoming").getByRole("button", { name: "Next 30 days" }).click(); await settle();
  const n30 = await cards().count();
  check(n30 > 0 && n30 < 13 && page.url().includes("when=month"), `when filter (${n30})`);
  await page.locator("#upcoming").getByRole("button", { name: "Any time" }).click(); await settle();
  await page.getByRole("group", { name: "Distance or type" }).getByRole("button", { name: /^Ultra Run/ }).click(); await settle();
  check((await cards().count()) >= 1 && (await cards().first().textContent()).includes("Ultra"), "category filter");
  await page.getByRole("button", { name: "All categories" }).click(); await settle();
  await page.getByLabel("Search runs or areas").fill("gachibowli"); await settle();
  const g = await cards().count();
  check(g >= 1 && g < 14, `search (${g})`);
  await page.getByLabel("Search runs or areas").fill("iit half"); await settle();
  check((await cards().count()) === 1 && await page.getByText(/1 run/).first().isVisible(), "multi-word search narrows to one");
  await page.getByLabel("Search runs or areas").fill("I want to know 10k runs in december"); await settle();
  check((await cards().count()) >= 1 && (await cards().count()) < 6, `free-text sentence search (${await cards().count()})`);
  await page.getByLabel("Search runs or areas").fill(""); await settle();
  await page.getByText("Completed events").click(); await settle();
  check((await page.locator("#past li").count()) >= 1, "completed events section");

  await page.getByRole("button", { name: "Use my location" }).click(); await page.waitForTimeout(1200);
  const near = page.locator("#nearby .ev-card");
  check((await near.count()) === 3, "events near you shows 3");
  check(/Signathon|Hitech|Rehabathon|Sankalp/.test(await near.first().locator(".ev-title").textContent()), "nearest is a Gachibowli run");
  check(await near.first().getByText(/straight-line/).isVisible(), "distance labelled straight-line");

  // Saved
  await cards().nth(0).getByRole("button", { name: /^Save/ }).click();
  await cards().nth(2).getByRole("button", { name: /^Save/ }).click(); await settle();
  check((await page.locator(".my-runs-count").textContent()) === "2", "header Saved counts 2");
  await page.getByRole("tab", { name: /Saved/ }).click(); await settle();
  check((await cards().count()) === 2, "Saved view lists them");
  await shot("saved");

  await page.getByRole("tab", { name: "Calendar" }).click(); await settle();
  await page.getByRole("button", { name: "Next month" }).click(); await settle();
  check(/November|December|January/.test(await page.locator(".cal-poster-month").textContent()), "calendar view navigates months");

  await page.locator("#map").scrollIntoViewIfNeeded(); await page.waitForTimeout(2500);
  const markers = await page.locator(".rc-marker").count();
  check(markers >= 3, `map markers (${markers})`);
  check(await page.locator(".leaflet-container").count() === 1, "Leaflet map");
  await page.locator(".rc-marker").first().click({ force: true }); await settle();
  check(await page.locator(".rc-pop").isVisible(), "marker popup");
  await shot("map");

  await page.goto(url("/hyderabad/running-events/hitech-marathon-2026")); await page.waitForTimeout(1500);
  check(await page.getByRole("heading", { name: "Hitech Marathon" }).isVisible(), "run page heading");
  check(await page.getByText("Sunday, 1 November 2026").first().isVisible(), "run page date");
  check(await page.getByText(/not the exact start point/).isVisible(), "area pin is labelled approximate");
  check((await page.getByText("Not Announced", { exact: true }).count()) >= 2, "unknown details say not announced");
  check(await page.getByRole("link", { name: "Google Calendar" }).isVisible(), "add to calendar");
  check(await page.getByText(/straight-line/).first().isVisible(), "distance from you");
  await shot("run");
  check(await page.getByRole("button", { name: /Registered|I’m registered/ }).isVisible(), "run page has My runs toggle");
  check((await page.locator('a[href^="https://wa.me/?text="]').count()) >= 1, "WhatsApp share link");
  for (const h of ["Run categories & fees", "What’s included", "Venue & location", "Organiser"])
    check(await page.getByRole("heading", { name: h, exact: true }).isVisible(), `section: ${h}`);
  { const mob = label === "mobile"; check(await page.locator(mob ? ".ed-mobile-cta" : ".ed-panel").isVisible(), mob ? "mobile registration bar" : "registration panel"); }
  await page.locator(".ed-crumbs").getByRole("link", { name: "Running events", exact: true }).click(); await page.waitForLoadState(); await settle();
  check(/^\/(#upcoming)?$/.test(pathOf(page.url())), `breadcrumb back to runs (${pathOf(page.url())})`);

  await page.goto(url("/hyderabad/running-events/freshathon-winter-rush-2026")); await settle();
  check(await page.getByText(/venue not announced yet/i).first().isVisible(), "run without venue says so");

  // Organizer submits (demo mode, stored in this browser)
  await page.goto(url("/submit")); await settle();
  await page.getByLabel("Email").fill("org@test.in"); await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByLabel("Event name *").fill("Test Lake Run");
  await page.getByLabel("Date *").fill("2027-03-14");
  await page.getByLabel("Organizer name *").fill("Test Club");
  await page.getByRole("button", { name: "Submit for review" }).click();
  check(await page.getByRole("status").filter({ hasText: "Pending Review" }).isVisible(), "organizer submission is pending review");
  check(await page.getByLabel("My submissions").getByText("Pending Review").isVisible(), "organizer sees status");

  // Reviewer can approve but not publish
  await page.goto(url("/admin")); await settle();
  await page.getByText("Sign out").click(); await settle();
  await page.getByLabel("Email").fill("rev@test.in"); await page.getByLabel("Try as (demo only)").selectOption("reviewer");
  await page.getByRole("button", { name: "Sign in" }).click(); await settle();
  const row = page.locator("tr", { hasText: "Test Lake Run" });
  await row.getByRole("button", { name: "Approve" }).click(); await settle();
  await page.getByRole("tab", { name: "All events" }).click(); await settle();
  check(await row.getByText("Approved").isVisible() && !(await row.getByRole("button", { name: "Publish" }).count()), "reviewer approves, cannot publish");

  // Editor publishes
  await page.getByText("Sign out").click(); await settle();
  await page.getByLabel("Email").fill("ed@test.in"); await page.getByLabel("Try as (demo only)").selectOption("editor");
  await page.getByRole("button", { name: "Sign in" }).click(); await settle();
  await page.getByRole("tab", { name: "All events" }).click(); await settle();
  await row.getByRole("button", { name: "Publish" }).click(); await settle();
  check(await row.getByText("Published").isVisible(), "editor publishes");
  await page.getByRole("tab", { name: "Metrics" }).click(); await settle();
  check(await page.getByText("Event page views").isVisible(), "metrics dashboard");
  await page.getByRole("tab", { name: "Audit trail" }).click(); await settle();
  check(await page.getByText(/approved → published/).first().isVisible(), "audit trail records publish");

  check(errors.length === 0, `no console errors${errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""}`);
  await browser.close();
}

await run("desktop", { viewport: { width: 1366, height: 900 } });
await run("mobile", { ...devices["Pixel 7"] });
console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
