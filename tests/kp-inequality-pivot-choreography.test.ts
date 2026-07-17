import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpInequalityPivotChoreography,
  sampleKpInequalityPivotChoreography
} from "../src/animation/inequality-pivot-choreography.ts";

const plan = () => compileKpInequalityPivotChoreography({
  id: "inequality.negative-scale",
  continuantRecordIds: ["lhs-operand-persists"],
  sideChangeRecordIds: [
    "lhs-negative-multiplier-enters",
    "rhs-operand-exits",
    "rhs-scaled-result-enters"
  ],
  relationRecordId: "relation-pivots"
});

test("negative scaling becomes legible before the relation pivots", () => {
  const scaling = sampleKpInequalityPivotChoreography({ plan: plan(), progress: 0.4 });
  assert.ok(scaling.focusStrength > 0);
  assert.ok(scaling.sideScaleProgress > 0.8);
  assert.equal(scaling.relationPivotProgress, 0);
});

test("relation pivot completes before native settlement and focus release", () => {
  const pivot = sampleKpInequalityPivotChoreography({ plan: plan(), progress: 0.7 });
  assert.equal(pivot.sideScaleProgress, 1);
  assert.ok(pivot.relationPivotProgress > 0.7);
  assert.equal(pivot.settlementProgress, 0);

  const settle = sampleKpInequalityPivotChoreography({ plan: plan(), progress: 0.9 });
  assert.equal(settle.relationPivotProgress, 1);
  assert.ok(settle.settlementProgress > 0.5);
  assert.ok(settle.focusStrength < 0.5);
});

test("pivot plans reject missing causal roles", () => {
  assert.throws(() => compileKpInequalityPivotChoreography({
    id: "bad.pivot",
    continuantRecordIds: [],
    sideChangeRecordIds: [],
    relationRecordId: "relation"
  }), /persistent operand/);
});
