import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpFractionChoreography,
  sampleKpFractionChoreography,
  type KpFractionChoreographyKind
} from "../src/animation/fraction-choreography.ts";

test("fraction verbs preview focus before structural transmission", () => {
  for (const operationKind of operationKinds) {
    const preview = sampleKpFractionChoreography({
      plan: fractionPlan(operationKind),
      progress: 0.12
    });
    assert.ok(preview.focusStrength > 0.9);
    assert.ok(preview.reflowProgress > 0);
    assert.equal(preview.structuralProgress, 0);
    assert.equal(preview.artifactProgress, 0);
  }
});

test("fraction branches transmit independently before artifacts change", () => {
  const frame = sampleKpFractionChoreography({
    plan: fractionPlan("split-factors"),
    progress: 0.5
  });
  assert.ok(frame.branches[0]!.pathProgress > frame.branches[1]!.pathProgress);
  assert.ok(frame.branches.every((branch) => branch.opacity === 1));
  assert.equal(frame.artifactProgress, 0);
});

test("fraction verbs settle exact native ownership and release focus", () => {
  for (const operationKind of operationKinds) {
    const settled = sampleKpFractionChoreography({
      plan: fractionPlan(operationKind),
      progress: 1
    });
    assert.equal(settled.reflowProgress, 1);
    assert.equal(settled.structuralProgress, 1);
    assert.equal(settled.artifactProgress, 1);
    assert.equal(settled.settlementProgress, 1);
    assert.equal(settled.focusStrength, 0);
    assert.ok(settled.branches.every(
      (branch) => branch.opacity === 1 && branch.scale === 1 && branch.pathProgress === 1
    ));
  }
});

test("fraction choreography rejects missing structural authority", () => {
  assert.throws(() => compileKpFractionChoreography({
    id: "bad-fraction",
    operationKind: "simplify-unit-factor",
    focusRecordIds: ["unit-factor-cancels"],
    continuantRecordIds: ["base-numerator-persists"],
    structuralRecordIds: [],
    artifactRecordIds: ["unit-factor-cancels"],
    maximumBranchCount: 1
  }), /structural action/);
});

const operationKinds: readonly KpFractionChoreographyKind[] = [
  "split-factors",
  "separate-common-factor",
  "simplify-unit-factor"
];

function fractionPlan(operationKind: KpFractionChoreographyKind) {
  return compileKpFractionChoreography({
    id: `fraction.${operationKind}`,
    operationKind,
    focusRecordIds: ["focus"],
    continuantRecordIds: ["bar-persists"],
    structuralRecordIds: ["structure"],
    artifactRecordIds: ["artifact"],
    maximumBranchCount: 2
  });
}
