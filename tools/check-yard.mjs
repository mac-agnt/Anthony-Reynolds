/* Consistency check: bundles the demo store + yard layer with esbuild and asserts the headline numbers
   every screen must agree on. Run: node tools/check-yard.mjs */
import { build } from "esbuild";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dir = mkdtempSync(join(tmpdir(), "yard-check-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `
import { getState, derive } from ${JSON.stringify(root + "/src/demo/store")};
import * as Y from ${JSON.stringify(root + "/src/demo/yard")};
export const run = () => {
  const s = getState(), d = derive(s), c = Y.yardCounts(s), w = Y.workshopOverview(s), p = Y.partsOverview(s), i = Y.inspectionCounts(s);
  return { c, w, p, i, d, s, vehicles: Y.yardVehicles(s) };
};`);
const out = join(dir, "out.mjs");
await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", outfile: out, logLevel: "error" });
const { run } = await import(pathToFileURL(out).href);
const { c, w, p, i, d, vehicles } = run();
let bad = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) bad++; console.log((ok ? "ok   " : "FAIL ") + name + " = " + JSON.stringify(got) + (ok ? "" : "  (want " + JSON.stringify(want) + ")")); };
eq("yard on site", c.onSite, 42); eq("arrived today", c.arrivedToday, 8); eq("ready to leave", c.readyN, 11);
eq("blocked", c.blockedN, 7); eq("overnight", c.overnightN, 16); eq("unknown", c.unknownN, 2);
eq("overnight buckets", Object.fromEntries(Object.entries(c.bucket).map(([k, v]) => [k, v.length])), { "Waiting parts": 4, "Accounts hold": 2, "CVRT repair": 1, "Awaiting customer": 2, Unknown: 1, Workshop: 6 });
eq("open jobs", w.openJobs, 24); eq("active technicians", w.activeTechs, 12); eq("utilisation %", w.utilisation, 83);
eq("waiting parts (jobs)", w.waitingParts, 7); eq("over budget", w.overBudget, 3); eq("ready to invoice", w.readyToInvoice, 8); eq("ready net", w.readyNet, 18420);
eq("unallocated", d.counts.unallocated, 2); eq("lost capacity h", p.lostHours, 11.5); eq("at risk today", c.atRisk.length, 3);
eq("inspection awaiting", i.awaiting, 6);
eq("every yard row has its job", vehicles.filter(v => v.row.job && !v.job).length, 0);
eq("no duplicate keys", new Set(vehicles.map(v => v.key)).size, vehicles.length);
console.log(bad ? `\n${bad} check(s) failed` : "\nall checks passed");
process.exit(bad ? 1 : 0);
