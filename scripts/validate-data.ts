// Validates content/*.json the same way the build does, and lists records that are hidden
// (not verified or pin not confirmed) or past. Usage: npm run validate:data
import { ALL_EVENTS, PUBLIC_EVENTS, isPublic } from "../src/data/events";

const now = Date.now();
const hidden = ALL_EVENTS.filter((e) => !isPublic(e));
const past = PUBLIC_EVENTS.filter((e) => Date.parse(e.end ?? e.start) < now);
console.log(`✓ ${ALL_EVENTS.length} records valid · ${PUBLIC_EVENTS.length} public · ${hidden.length} hidden · ${past.length} past`);
for (const e of hidden) console.log(`  hidden: ${e.slug} (${!e.verification.verified ? "not verified" : "pin not confirmed"})`);
