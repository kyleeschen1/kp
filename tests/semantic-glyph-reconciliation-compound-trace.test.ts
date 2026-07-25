import assert from "node:assert/strict";
import test from "node:test";

import { createKpGlyphReconciliationCompoundTrace } from "../src/animation/semantic-glyph-reconciliation-compound-trace.ts";

test("compound trace speeds up every canonical operation without omission", () => {
  const trace = createKpGlyphReconciliationCompoundTrace();

  assert.ok(trace.operationIds.length > 2);
  assert.equal(new Set(trace.operationIds).size, trace.operationIds.length);
  assert.ok(trace.compressionRatio > 0);
  assert.ok(trace.compressionRatio < 1);
  assert.equal(trace.accessibilityTranscript.length, trace.operationIds.length);
});

test("compound trace drill-down restores the exact paused parent frame", () => {
  const trace = createKpGlyphReconciliationCompoundTrace();

  assert.equal(trace.drillDown.parentClock.paused, true);
  assert.equal(trace.drillDown.childClock.nested, true);
  assert.equal(trace.drillDown.restore.exact, true);
  assert.equal(trace.drillDown.restore.elapsedMs, trace.drillDown.parentClock.elapsedMs);
  assert.equal(trace.drillDown.restore.progress, trace.drillDown.parentClock.progress);
  assert.deepEqual(trace.drillDown.actionIds, trace.operationIds);
});
