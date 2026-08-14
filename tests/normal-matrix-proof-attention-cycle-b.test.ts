import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpNormalMatrixProofAttentionCycleB,
  kpNormalMatrixProofAttentionCycleB,
  projectKpNormalMatrixProofAttentionCycleBPhase
} from "../src/tutorial/normal-matrix-proof/normal-matrix-proof-attention-cycle-b.ts";

test("cycle B preserves the complete attention grammar and proof endpoints", () => {
  assert.deepEqual(checkKpNormalMatrixProofAttentionCycleB(), []);
  assert.equal(kpNormalMatrixProofAttentionCycleB.entryCheckpointId, "norm-equation");
  assert.equal(kpNormalMatrixProofAttentionCycleB.settledCheckpointId, "recursion");
  assert.deepEqual(
    kpNormalMatrixProofAttentionCycleB.phases.map(({ kind }) => kind),
    ["orient", "act", "settle", "inspect"]
  );
});

test("prediction is held before any zero or block conclusion is revealed", () => {
  const orient = projectKpNormalMatrixProofAttentionCycleBPhase("orient");
  assert.deepEqual(orient.intents.map(({ kind }) => kind), [
    "predict",
    "supporting-context"
  ]);
  assert.equal(
    orient.intents.some(({ kind }) => kind === "reveal"),
    false
  );
  const settle = projectKpNormalMatrixProofAttentionCycleBPhase("settle");
  assert.deepEqual(
    settle.intents.filter(({ kind }) => kind === "reveal").map(({ id }) => id),
    ["reveal-zero-norm", "reveal-zero-remainder", "reveal-block-diagonal"]
  );
});

test("the zero inference and recursion retain authored transformation authority", () => {
  assert.deepEqual(
    projectKpNormalMatrixProofAttentionCycleBPhase("act").phase.transformationPaths,
    ["force-row-remainder-zero"]
  );
  assert.deepEqual(
    projectKpNormalMatrixProofAttentionCycleBPhase("inspect").phase.transformationPaths,
    ["restrict-normality-to-lower-block"]
  );
  assert.equal(
    kpNormalMatrixProofAttentionCycleB.salience.intents.some((intent) =>
      Object.keys(intent).some((key) => /color|opacity|duration|keyframe|path|dom|svg/iu.test(key))
    ),
    false
  );
});

test("cycle B phase projection is pure and order independent", () => {
  const first = projectKpNormalMatrixProofAttentionCycleBPhase("inspect");
  projectKpNormalMatrixProofAttentionCycleBPhase("act");
  const second = projectKpNormalMatrixProofAttentionCycleBPhase("inspect");
  assert.deepEqual(second, first);
  assert.equal(second.phase, first.phase);
});
