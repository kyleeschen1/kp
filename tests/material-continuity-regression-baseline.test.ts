import assert from "node:assert/strict";
import test from "node:test";

import {
  materialContinuityRegressionBaselines
} from "./fixtures/material-continuity-regression-baseline.ts";

test("material continuity repair baselines cover the reported proof cohort", () => {
  assert.deepEqual(
    materialContinuityRegressionBaselines.map((baseline) => baseline.animationId),
    [
      "animation.linear-solve.solve-x",
      "animation.generated.radical.square-root-as-power"
    ]
  );
  assert.deepEqual(
    new Set(
      materialContinuityRegressionBaselines.flatMap((baseline) =>
        baseline.observations.map((observation) => observation.kind)
      )
    ),
    new Set([
      "ownership-swap",
      "envelope-restart",
      "disconnected-bundle",
      "structural-deformation"
    ])
  );
});

test("each regression observation identifies evidence and an enforceable repair", () => {
  for (const baseline of materialContinuityRegressionBaselines) {
    assert.match(baseline.id, /^regression\./);
    assert.match(baseline.descriptorId, /^editor-animation\./);
    for (const observation of baseline.observations) {
      assert.ok(observation.progress >= 0 && observation.progress <= 1);
      assert.ok(observation.sourceEvidence.length >= 2);
      assert.ok(observation.visibleFailure.length > 20);
      assert.ok(observation.repairContract.length > 20);
    }
  }
});

