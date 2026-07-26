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
import {
  sampleKpNativeKatexSceneTracks,
  sampleKpNativeKatexTypographyStylePlan,
  type KpNativeKatexSceneTrack,
  type KpNativeKatexTypographyStylePlan
} from "../src/rendering/native-katex-scene-compositor.ts";

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
// Thirty-two paint tracks provide headroom beyond the 15-atom fraction
// exemplar without introducing another expression-specific benchmark.
const sceneTracks: readonly KpNativeKatexSceneTrack[] = Array.from(
  { length: 32 },
  (_, index) => ({
    id: `stress.track.${index}`,
    componentId: `stress.component.${index}`,
    lifecycle: "persist",
    sourceAtomId: `source.${index}`,
    targetAtomId: `target.${index}`,
    visualAtomId: `source.${index}`,
    paintKind: index % 7 === 0 ? "rule" : "glyph",
    sizingMode: index % 7 === 0 ? "rule-length" : "rect",
    startRect: {
      left: index * 4,
      top: index % 3,
      width: 8 + index % 5,
      height: 18
    },
    endRect: {
      left: index * 2,
      top: 24 + index % 4,
      width: 10 + index % 6,
      height: 20
    },
    startOpacity: 1,
    endOpacity: 1
  })
);
const sceneSampleStart = performance.now();
for (let index = 0; index < 1_000; index += 1) {
  sampleKpNativeKatexSceneTracks(sceneTracks, index / 999);
}
const sceneFrameSampleP95Ms = (performance.now() - sceneSampleStart) / 1_000;
const sceneFrameSamples = Array.from({ length: 1_000 }, (_, index) =>
  sampleKpNativeKatexSceneTracks(sceneTracks, index / 999)
);
const stylePlan: KpNativeKatexTypographyStylePlan = {
  kind: "native-katex-typography-style-plan",
  lifecycle: "renderer-session",
  model: "target-style-reverse-flip",
  entries: sceneTracks.map((track, index) => ({
    id: `style.${track.id}`,
    materialOwnerId: `native-scene-owner.${track.id}`,
    componentId: track.componentId,
    atomLifecycle: track.lifecycle,
    targetPaintAtomId: track.targetAtomId!,
    paintKind: track.paintKind,
    model: "target-style-reverse-flip",
    currentRect: track.startRect,
    targetRect: track.endRect,
    inverseTranslateX: index % 3 - 1,
    inverseTranslateY: index % 5 / 2,
    inverseScaleX: 1 + index % 4 / 100,
    inverseScaleY: 1 + index % 4 / 100,
    targetPaintFingerprint: `paint.${index}`,
    targetStyleFingerprint: `style.${index}`,
    targetClipPath: "none"
  }))
};
const styleSampleStart = performance.now();
for (let index = 0; index < 1_000; index += 1) {
  sampleKpNativeKatexTypographyStylePlan(
    stylePlan,
    index / 999,
    sceneFrameSamples[index]
  );
}
const styleFrameSampleP95Ms = (performance.now() - styleSampleStart) / 1_000;
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
  sceneFrameSampleP95Ms,
  styleFrameSampleP95Ms,
  maxPlannerOperations: Math.max(...operations),
  serializedPlanMaxBytes: Math.max(...planBytes),
  routeGzipBytes,
  routeGzipGrowthBytes
};
const failures = [
  report.coldPlanP95Ms > budgets.maxColdPlanP95Ms && "cold plan",
  report.cachedPlanP95Ms > budgets.maxCachedPlanP95Ms && "cached plan",
  report.frameSampleP95Ms > budgets.maxFrameSampleP95Ms && "frame sample",
  report.sceneFrameSampleP95Ms > budgets.maxFrameSampleP95Ms &&
    "scene frame sample",
  report.styleFrameSampleP95Ms > budgets.maxFrameSampleP95Ms &&
    "style frame sample",
  report.maxPlannerOperations > budgets.maxPlannerOperations && "operations",
  report.serializedPlanMaxBytes > budgets.maxSerializedPlanBytes && "plan bytes",
  report.routeGzipGrowthBytes > budgets.maxRouteGzipGrowthBytes &&
    "route gzip growth"
].filter(Boolean);
console.log(JSON.stringify({ budgets, report, status: failures.length === 0 ? "passed" : "failed" }, null, 2));
if (failures.length > 0) throw new Error(`Glyph performance budgets failed: ${failures.join(", ")}.`);
