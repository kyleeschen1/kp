import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { gzipSync } from "node:zlib";

import {
  createKpCrowdedQuadraticGlyphReconciliationCase,
  createKpFractionMergeGlyphReconciliationCase,
  createKpQuadraticPlusMinusGlyphReconciliationCase,
  createKpSolveXGlyphReconciliationCase
} from "../src/animation/semantic-glyph-reconciliation-cases.ts";
import {
  KpGlyphReconciliationCompilerCache,
  compileKpGlyphReconciliationCase
} from "../src/animation/semantic-glyph-reconciliation-compiler.ts";
import { kpGlyphReconciliationExperimentLedger } from "../src/animation/semantic-glyph-reconciliation-experiment.ts";

const budgets = kpGlyphReconciliationExperimentLedger.budget;
const cases = [
  createKpSolveXGlyphReconciliationCase(),
  createKpFractionMergeGlyphReconciliationCase(),
  createKpQuadraticPlusMinusGlyphReconciliationCase(),
  createKpCrowdedQuadraticGlyphReconciliationCase("wide"),
  createKpCrowdedQuadraticGlyphReconciliationCase("phone")
];
const cold: number[] = [];
const cached: number[] = [];
const samples: number[] = [];
const planBytes: number[] = [];
const operations: number[] = [];
for (const caseInput of cases) {
  const start = performance.now();
  const compiled = await compileKpGlyphReconciliationCase(caseInput);
  cold.push(performance.now() - start);
  const cache = new KpGlyphReconciliationCompilerCache();
  await cache.compile(caseInput);
  const cachedStart = performance.now();
  await cache.compile(caseInput);
  cached.push(performance.now() - cachedStart);
  const playback = compiled.createPlayback({
    supportedMatchIds: new Set(compiled.schedule.motions.map(({ matchId }) => matchId)),
    apply() {}
  });
  const sampleStart = performance.now();
  for (let index = 0; index < 1_000; index += 1) playback.sample(index / 999);
  samples.push((performance.now() - sampleStart) / 1_000);
  planBytes.push(Buffer.byteLength(JSON.stringify({ plan: compiled.plan, schedule: compiled.schedule })));
  operations.push(compiled.plan.operationCount + compiled.schedule.operationCount);
}
const manifest = JSON.parse(
  await readFile("dist/.vite/manifest.json", "utf8")
) as Record<string, { file: string; name?: string }>;
const entry = Object.values(manifest).find(({ name }) =>
  name === "glyphReconciliationExperiment"
);
if (entry === undefined) throw new Error("Built glyph experiment entry is missing.");
const routeGzipBytes = gzipSync(await readFile(path.join("dist", entry.file)), { level: 9 }).byteLength;
const routeGzipGrowthBytes = Math.max(
  0,
  routeGzipBytes -
    kpGlyphReconciliationExperimentLedger.payloadBaseline.routeGzipBytes
);
const report = {
  coldPlanP95Ms: Math.max(...cold),
  cachedPlanP95Ms: Math.max(...cached),
  frameSampleP95Ms: Math.max(...samples),
  maxPlannerOperations: Math.max(...operations),
  serializedPlanMaxBytes: Math.max(...planBytes),
  routeGzipBytes,
  routeGzipGrowthBytes
};
const failures = [
  report.coldPlanP95Ms > budgets.maxColdPlanP95Ms && "cold plan",
  report.cachedPlanP95Ms > budgets.maxCachedPlanP95Ms && "cached plan",
  report.frameSampleP95Ms > budgets.maxFrameSampleP95Ms && "frame sample",
  report.maxPlannerOperations > budgets.maxPlannerOperations && "operations",
  report.serializedPlanMaxBytes > budgets.maxSerializedPlanBytes && "plan bytes",
  report.routeGzipGrowthBytes > budgets.maxRouteGzipGrowthBytes &&
    "route gzip growth"
].filter(Boolean);
console.log(JSON.stringify({ budgets, report, status: failures.length === 0 ? "passed" : "failed" }, null, 2));
if (failures.length > 0) throw new Error(`Glyph performance budgets failed: ${failures.join(", ")}.`);
