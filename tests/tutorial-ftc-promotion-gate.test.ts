import assert from "node:assert/strict";
import test from "node:test";
import { evaluateKpFtcReviewableGates } from "../src/tutorial/ftc-promotion-gate.ts";

test("FTC automated gates approve reviewable while leaving gold human-gated", () => {
  const report = evaluateKpFtcReviewableGates();

  assert.equal(report.passed, true);
  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.promotion.status, "approved");
  assert.equal(report.promotion.from, "draft");
  assert.equal(report.promotion.to, "reviewable");
  assert.equal(report.metrics.claimCount, 7);
  assert.equal(report.metrics.checkpointCount, 7);
  assert.equal(report.metrics.accessibilityProjectionCount, 8);
  assert.equal(report.metrics.exportFrameCount, 7);
  assert.ok(report.metrics.serializedDefinitionBytes < 100_000);
});
