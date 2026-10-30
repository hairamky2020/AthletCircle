// Browser smoke tests against a static build served on BASE (default http://localhost:3000).
// Build for tests with a local blank map style so tiles aren't needed:
//   NEXT_PUBLIC_MAP_STYLE_URL=/test-map-style.json npm run build && cp e2e/test-map-style.json out/ && npx serve out
import { createRequire } from "node:module";
// Uses the machine's installed Playwright (CommonJS resolution honours NODE_PATH).
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS; // optional folder for screenshots
const GACHIBOWLI = { latitude: 17.4401, longitude: 78.3489 };
let failures = 0;

async function check(name, fn) {
  try { await fn(); console.log(`✓ ${name}`); }
  catch (e) { failures++; console.log(`✗ ${name}\n    ${e.message.split("\n")[0]}`); }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await chromium.launch();
for (const [label, opts] of [["desktop", { viewport: { width: 1366, height: 900 } }], ["mobile", devices["Pixel 7"]]]) {
  console.log(`\n— ${label}`);
  const ctx = await browser.newContext({ ...opts, geolocation: GACHIBOWLI, permissions: ["geolocation"], locale: "en-IN", timezoneId: "Asia/Kolkata" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(m.text()); });
  const shot = async (n) => SHOTS && page.screenshot({ path: `${SHOTS}/${label}-${n}.png`, fullPage: false });

  await check("home renders hero, demo notice and sections", async () => {
    await page.goto(BASE + "/");
    await page.getByRole("heading", { level: 1 }).waitFor();
    expect(await page.getByText("Preview mode").count() === 1, "demo notice missing");
    expect(await page.getByRole("heading", { name: "Sports near me" }).count() === 1, "near me section missing");
    await shot("home");
  });

  await check("Sports Near Me uses GPS and shows straight-line distances", async () => {
    await page.locator("#near-me").getByRole("button", { name: /Use my location/ }).click();
    await page.locator("#near-me").getByText(/events? within 25 KM/).waitFor({ timeout: 10000 });
    const txt = await page.locator("#near-me").innerText();
    expect(/KM away \(straight-line\)|M away \(straight-line\)/.test(txt), "no straight-line distance label");
    expect(/Near Gachibowli/.test(await page.locator("header").innerText()), "location pill not updated");
    await page.locator("#near-me").scrollIntoViewIfNeeded();
    await shot("near-me");
  });

  await check("radius chip changes results", async () => {
    const before = await page.locator("#near-me").getByText(/events? within \d+ KM/).innerText();
    await page.locator("#near-me").getByRole("button", { name: "5 KM", exact: true }).click();
    const after = await page.locator("#near-me").getByText(/events? within \d+ KM/).innerText();
    expect(before !== after && /within 5 KM/.test(after), `unchanged: ${after}`);
  });

  await check("location picker finds a PIN code", async () => {
    await page.locator("header").getByRole("button", { name: /Location/ }).click();
    await page.getByLabel("Search locality, city or PIN code").fill("560034");
    await page.getByRole("button", { name: /560034 · Koramangala/ }).click();
    expect(/560034/.test(await page.locator("header").innerText()), "pin not applied");
  });

  await check("search filters by text", async () => {
    await page.goto(BASE + "/search/?q=badminton");
    await page.getByText(/\d+ events?/).first().waitFor();
    const titles = await page.locator("article h3").allInnerTexts();
    expect(titles.length > 0 && titles.every((t) => /badminton/i.test(t)), `unexpected: ${titles.join(" | ")}`);
    await shot("search");
  });

  await check("map page renders markers and a popup", async () => {
    await page.goto(BASE + "/map/?city=in/telangana/hyderabad");
    await page.locator(".ac-marker, .ac-cluster").first().waitFor({ timeout: 15000 });
    const n = await page.locator(".ac-marker, .ac-cluster").count();
    expect(n > 0, "no markers");
    const marker = page.locator(".ac-marker").first();
    if (await marker.count()) {
      await marker.click();
      await page.locator(".maplibregl-popup").getByText("View event").waitFor({ timeout: 5000 });
    }
    await shot("map");
  });

  await check("event page: register link, details, travel info, calendar", async () => {
    await page.goto(BASE + "/events/madhapur-open-badminton-championship-demo/");
    const reg = page.getByRole("link", { name: /Register/ }).first();
    expect((await reg.getAttribute("href")) === "https://example.com/register", "register href");
    expect(await page.getByText("Demo event.").count() === 1, "demo banner missing");
    await page.getByText("How far is it?").waitFor();
    expect(await page.getByText(/straight-line/).count() > 0, "no straight-line distance");
    expect(await page.getByRole("link", { name: /Google Calendar/ }).count() === 1, "calendar link missing");
    expect(await page.getByRole("cell", { name: "Mixed Doubles Open" }).count() === 1, "categories table missing");
    await shot("event");
  });

  await check("cancelled event shows a notice", async () => {
    await page.goto(BASE + "/events/manikonda-5-a-side-futsal-night-demo/");
    await page.getByText(/This event has been cancelled/).waitFor();
  });

  await check("unverified events are never published", async () => {
    const r = await page.goto(BASE + "/events/gachibowli-running-clinic-submission-demo/");
    expect(r.status() === 404, `status ${r.status()}`);
  });

  await check("calendar renders events", async () => {
    await page.goto(BASE + "/calendar/");
    await page.getByRole("group", { name: "Calendar view" }).waitFor();
    await page.getByRole("button", { name: "list" }).click();
    await page.locator("main a[href^='/events/']").first().waitFor();
    await shot("calendar");
  });

  await check("city and sport-in-city pages", async () => {
    await page.goto(BASE + "/in/telangana/hyderabad/");
    expect(/Sports events in Hyderabad/.test(await page.locator("h1").innerText()), "city h1");
    await page.goto(BASE + "/in/telangana/hyderabad/running/");
    expect(/Running events and marathons in Hyderabad/.test(await page.locator("h1").innerText()), "city sport h1");
    expect(await page.locator("script[type='application/ld+json']").count() >= 1, "breadcrumb schema");
  });

  await check("entry helper validates and outputs JSON", async () => {
    await page.goto(BASE + "/tools/event-builder/");
    await page.getByLabel("Event name *").fill("Test Run");
    expect(await page.getByText("Not ready yet:").count() === 1, "validation not shown");
  });

  expect(errors.length === 0, "");
  if (errors.length) { failures++; console.log("✗ console errors:\n    " + errors.slice(0, 5).join("\n    ")); } else console.log("✓ no console errors");
  await ctx.close();
}
await browser.close();
console.log(failures ? `\n${failures} failing` : "\nall passed");
process.exit(failures ? 1 : 0);
