import assert from "node:assert/strict";
import test from "node:test";

import { projectKpNormalMatrixProofCycleB } from
  "../src/tutorial/normal-matrix-proof/normal-matrix-proof-cycle-b-projection.ts";

test("cycle B aligns prediction, settlement, and recursion to authored checkpoints", () => {
  assert.equal(projectKpNormalMatrixProofCycleB(7_199).active, false);
  assert.equal(projectKpNormalMatrixProofCycleB(7_200).phaseKind, "orient");
  assert.equal(projectKpNormalMatrixProofCycleB(8_200).phaseKind, "act");
  assert.equal(projectKpNormalMatrixProofCycleB(9_600).phaseKind, "settle");
  assert.equal(projectKpNormalMatrixProofCycleB(10_700).phaseKind, "inspect");
  assert.equal(projectKpNormalMatrixProofCycleB(12_000).active, false);
  assert.equal(projectKpNormalMatrixProofCycleB(12_000).checkpointId, "recursion");
});

test("prediction holds all conclusions at their unrevealed endpoints", () => {
  const prediction = projectKpNormalMatrixProofCycleB(7_600);
  assert.equal(prediction.phaseKind, "orient");
  assert.equal(prediction.matchedProgress, 0);
  assert.equal(prediction.zeroNormProgress, 0);
  assert.equal(prediction.remainderZeroProgress, 0);
  assert.ok(prediction.targetPaths.includes("matrix/row-remainder"));
  assert.ok(prediction.targetPaths.includes("inference/norm-equality"));
});

test("r reaches its settled-zero handoff before the endpoint changes", () => {
  const before = projectKpNormalMatrixProofCycleB(9_599.999);
  assert.equal(before.phaseKind, "act");
  assert.equal(before.remainderZeroProgress, 1);
  const settled = projectKpNormalMatrixProofCycleB(9_600);
  assert.equal(settled.phaseKind, "settle");
  assert.equal(settled.checkpointId, "remainder-zero");
});

test("cycle B is order independent under direct reverse and interrupted seeks", () => {
  const samples = [7_200, 7_900, 8_500, 9_200, 9_600, 10_700, 11_900, 12_000];
  const expected = new Map(samples.map((timeMs) => [
    timeMs,
    projectKpNormalMatrixProofCycleB(timeMs)
  ]));
  for (const timeMs of [11_900, 8_500, 7_200, 10_700, 9_200, 12_000, 7_900, 9_600]) {
    assert.deepEqual(projectKpNormalMatrixProofCycleB(timeMs), expected.get(timeMs));
  }
});
