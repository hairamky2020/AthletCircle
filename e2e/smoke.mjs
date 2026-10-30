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
  check(await page.getByRole("heading", { name: "Upcoming runs in Hyderabad" }).isVisible(), "home: heading");
  check(await page.getByRole("heading", { name: "November 2026" }).isVisible(), "home: grouped by month");
  check((await page.locator("main a[href*='runs/']").count()) >= 17, "home: lists the runs");
  check((await page.content()).includes("Signathon"), "home: first run is there");
  check(!(await page.content()).includes("Demo"), "home: no demo data");
  await shot("home");

  await page.getByRole("button", { name: /Dec ’26/ }).click(); await settle();
  const decCount = await page.locator("main ul a[href*='runs/']").count();
  check(decCount === 3, `month chip filters (December: ${decCount})`);
  check(page.url().includes("month=2026-12"), "month filter in URL");
  await page.getByRole("button", { name: "Clear" }).click(); await settle();

  await page.getByLabel("Area", { exact: true }).selectOption({ label: "Gachibowli (4)" }); await settle();
  check((await page.locator("main ul a[href*='runs/']").count()) === 4, "area filter (Gachibowli: 4)");
  await page.getByRole("button", { name: "Clear" }).click(); await settle();

  await page.getByRole("button", { name: "Nearest to me" }).click(); await settle();
  await page.getByRole("button", { name: /Use my current location/ }).click(); await page.waitForTimeout(1200);
  check(await page.getByText(/away/).first().isVisible(), "nearest to me shows distances");
  const firstRun = await page.locator("main ul a[href*='runs/'] p").first().textContent();
  check(/Signathon|Hitech|Rehabathon|Sankalp/.test(firstRun ?? ""), `nearest first is a Gachibowli run (${firstRun?.trim()})`);
  await shot("nearest");

  await page.getByRole("link", { name: "List", exact: true }).click(); await page.waitForLoadState(); await settle();
  check(pathOf(page.url()).startsWith("/list"), `list view URL ${pathOf(page.url())}`);
  check((await page.locator("main ul a[href*='runs/']").count()) >= 17, "list view rows");
  await shot("list");

  await page.goto(url("/calendar")); await settle();
  check(await page.getByRole("heading", { name: /October 2026|November 2026/ }).isVisible(), "calendar month heading");
  await page.getByRole("button", { name: "Next month" }).click(); await settle();
  await page.getByRole("button", { name: "Next month" }).click(); await settle();
  check(await page.getByRole("heading", { name: /December 2026|January 2027/ }).isVisible(), "calendar navigates months");
  await shot("calendar");

  await page.goto(url("/map")); await page.waitForTimeout(2500);
  const markers = await page.locator(".rc-marker").count();
  check(markers >= 5, `map markers (${markers})`);
  check(await page.getByText(/Venue not announced yet/).isVisible(), "map lists runs without a venue");
  await page.locator(".rc-marker").first().click({ force: true }); await settle();
  check(await page.locator(".rc-pop").isVisible(), "marker popup");
  await shot("map");

  await page.goto(url("/runs/hitech-marathon-2026")); await page.waitForTimeout(1500);
  check(await page.getByRole("heading", { name: "Hitech Marathon" }).isVisible(), "run page heading");
  check(await page.getByText("Sunday, 1 November 2026").first().isVisible(), "run page date");
  check(await page.getByText(/not the exact start point/).isVisible(), "area pin is labelled approximate");
  check((await page.getByText("Not announced yet").count()) >= 2, "unknown details say not announced");
  check(await page.getByRole("link", { name: "Google Calendar" }).isVisible(), "add to calendar");
  check(await page.getByText(/straight-line/).first().isVisible(), "distance from you");
  await shot("run");
  await page.getByRole("link", { name: "Runs", exact: true }).first().click(); await page.waitForLoadState(); await settle();
  check(/^\/(\?|$)/.test(pathOf(page.url())), `breadcrumb back to runs (${pathOf(page.url())})`);

  await page.goto(url("/runs/premiethon-2026")); await settle();
  check(await page.getByText(/venue not announced yet/i).first().isVisible(), "run without venue says so");

  await page.goto(url("/add-a-run")); await settle();
  check(await page.getByLabel("Name of the run").isVisible(), "add a run form");

  check(errors.length === 0, `no console errors${errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""}`);
  await browser.close();
}

await run("desktop", { viewport: { width: 1366, height: 900 } });
await run("mobile", { ...devices["Pixel 7"] });
console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
