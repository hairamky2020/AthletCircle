// Checks content/events.json and prints a short summary. Run: npm run validate:data
import { RUNS } from "../src/data/events";
import { istDate } from "../src/lib/dates";

const today = istDate(new Date());
const past = RUNS.filter((r) => (r.endDate ?? r.date) < today);
const noPlace = RUNS.filter((r) => !r.location);
const noLink = RUNS.filter((r) => !r.registrationUrl);
console.log(`✓ ${RUNS.length} runs valid · ${RUNS.length - past.length} upcoming · ${past.length} past`);
console.log(`  ${noPlace.length} without a map location, ${noLink.length} without a registration link`);
