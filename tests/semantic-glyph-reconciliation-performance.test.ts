import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import test from "node:test";

import { createKpSolveXGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-cases.ts";
import {
  KpGlyphReconciliationCompilerCache,
  compileKpGlyphReconciliationCase
} from "../src/animation/semantic-glyph-reconciliation-compiler.ts";
import { kpGlyphReconciliationExperimentLedger } from "../src/animation/semantic-glyph-reconciliation-experiment.ts";

test("compiler cache keys every renderer-session input and invalidates on geometry", async () => {
  const cache = new KpGlyphReconciliationCompilerCache();
  const input = createKpSolveXGlyphReconciliationCase();
  const first = await cache.compile(input);
  const second = await cache.compile(input);
  const changed = await cache.compile({
    ...input,
    viewport: { ...input.viewport, width: input.viewport.width + 1 }
  });

  assert.equal(first, second);
  assert.notEqual(first, changed);
  assert.equal(cache.size, 2);
  cache.clear();
  assert.equal(cache.size, 0);
});

test("solve-x planning, cache, sampling, operations, and plan payload meet frozen budgets", async () => {
  const budgets = kpGlyphReconciliationExperimentLedger.budget;
  const input = createKpSolveXGlyphReconciliationCase();
  const coldStart = performance.now();
  const compiled = await compileKpGlyphReconciliationCase(input);
  const coldMs = performance.now() - coldStart;
  const cache = new KpGlyphReconciliationCompilerCache();
  await cache.compile(input);
  const cachedStart = performance.now();
  await cache.compile(input);
  const cachedMs = performance.now() - cachedStart;
  const playback = compiled.createPlayback({
    supportedMatchIds: new Set(compiled.schedule.motions.map(({ matchId }) => matchId)),
    apply() {}
  });
  const sampleStart = performance.now();
  for (let index = 0; index < 1_000; index += 1) playback.sample(index / 999);
  const sampleMs = (performance.now() - sampleStart) / 1_000;
  const operations = compiled.plan.operationCount + compiled.schedule.operationCount;
  const planBytes = Buffer.byteLength(JSON.stringify({
    plan: compiled.plan,
    schedule: compiled.schedule
  }));

  assert.ok(coldMs <= budgets.maxColdPlanP95Ms, `${coldMs}ms cold`);
  assert.ok(cachedMs <= budgets.maxCachedPlanP95Ms, `${cachedMs}ms cached`);
  assert.ok(sampleMs <= budgets.maxFrameSampleP95Ms, `${sampleMs}ms sample`);
  assert.ok(operations <= budgets.maxPlannerOperations);
  assert.ok(planBytes <= budgets.maxSerializedPlanBytes);
});
