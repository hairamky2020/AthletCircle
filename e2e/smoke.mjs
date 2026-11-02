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
  check(await page.locator(".banner .slide.is-active").isVisible(), "home: featured carousel");
  check((await page.locator(".cat-card").count()) >= 5, "home: event categories");
  check((await page.locator(".ad-slot").count()) >= 2, "home: ad spaces");
  check(await page.locator(".countdown-card").isVisible(), "home: next run countdown");
  for (const h of ["Event categories", "Upcoming runs", "All runs at a glance", "Calendar", "Map", "My runs"]) {
    check((await page.getByRole("heading", { name: new RegExp(h) }).count()) > 0, `one page has section: ${h}`);
  }
  const cards = () => page.locator("#upcoming a.run-card");
  check((await cards().count()) >= 10, `upcoming cards (${await cards().count()})`);
  check(!(await page.content()).includes("Demo"), "no demo data");
  await shot("home");

  await page.getByLabel("Month", { exact: true }).selectOption("2026-12"); await settle();
  check((await cards().count()) === 3, `month filter (December: ${await cards().count()})`);
  check((await page.locator("#list li").count()) === 3, "filters apply to the list too");
  check(page.url().includes("month=2026-12"), "month filter in URL");
  await page.getByRole("button", { name: "Clear" }).click(); await settle();

  const gLabel = (await page.getByLabel("Area", { exact: true }).locator("option", { hasText: "Gachibowli" }).textContent()).trim();
  const gN = Number(gLabel.match(/\((\d+)\)/)[1]);
  await page.getByLabel("Area", { exact: true }).selectOption({ label: gLabel }); await settle();
  check((await cards().count()) === gN, `area filter (${gLabel})`);
  await page.getByRole("button", { name: "Clear" }).click(); await settle();

  await page.getByRole("button", { name: "Nearest to me" }).click(); await settle();
  await page.getByRole("button", { name: /Use my current location/ }).click(); await page.waitForTimeout(1200);
  check(await page.locator("#upcoming").getByText(/away/).first().isVisible(), "nearest to me shows distances");
  const firstRun = await cards().first().locator("p").first().textContent();
  check(/Signathon|Hitech|Rehabathon|Sankalp/.test(firstRun ?? ""), `nearest first is a Gachibowli run (${firstRun?.trim()})`);
  await page.getByRole("button", { name: "Clear" }).click(); await settle();

  // My runs
  await cards().nth(1).getByRole("button", { name: /registered/ }).click(); await settle();
  await page.locator("#list").getByRole("button", { name: /I’m registered/ }).nth(3).click(); await settle();
  check((await page.locator(".my-runs-count").textContent()) === "2", "My runs button counts 2");
  await page.getByRole("link", { name: /My runs/ }).first().click(); await page.waitForTimeout(1200);
  check((await page.locator("#my-runs ol li").count()) === 2, "My runs section lists them");
  await shot("myruns");

  await page.locator(".section-nav").getByRole("link", { name: "Calendar" }).click(); await page.waitForTimeout(1200);
  check(await page.locator('.section-nav a[aria-current="true"]').textContent() === "Calendar", "sticky menu scrolls and highlights");
  await page.getByRole("button", { name: "Next month" }).click(); await settle();
  check(/November|December/.test(await page.locator(".cal-poster-month").textContent()), "calendar navigates months");
  await shot("calendar");

  await page.locator("#map").scrollIntoViewIfNeeded(); await page.waitForTimeout(2500);
  const markers = await page.locator(".rc-marker").count();
  check(markers >= 3, `map markers (${markers})`);
  await page.locator(".rc-marker").first().evaluate((el) => el.scrollIntoView({ block: "center" })); await settle();
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
  await page.locator("main nav").getByRole("link", { name: "Runs", exact: true }).click(); await page.waitForLoadState(); await settle();
  check(/^\/(#upcoming)?$/.test(pathOf(page.url())), `breadcrumb back to runs (${pathOf(page.url())})`);

  await page.goto(url("/hyderabad/running-events/premiethon-2026")); await settle();
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
