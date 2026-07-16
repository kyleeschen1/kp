import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveKpGestaltMotionEligibility
} from "../src/animation/gestalt-motion-eligibility.ts";

test("gestalt identities remain stable across linear solve states", () => {
  const initial = resolveKpGestaltMotionEligibility(
    "solve.initial.equation.linear-solve.initial.lhs.x"
  );
  const solved = resolveKpGestaltMotionEligibility(
    "solve.solved.equation.linear-solve.solved.lhs.x"
  );
  assert.equal(initial.identityId, solved.identityId);
  assert.equal(initial.mode, "material-continuant");
  assert.equal(initial.coordinateSpace, "path-relative");
});

test("base and radicand inherit one material motion signature", () => {
  const base = resolveKpGestaltMotionEligibility(
    "radical.power.base"
  );
  const radicand = resolveKpGestaltMotionEligibility(
    "radical.radical.radicand"
  );
  assert.equal(base.identityId, radicand.identityId);
  assert.equal(base.deformationScale, 0.5);
});

test("thin structural notation has no nonuniform deformation", () => {
  for (const motionId of [
    "radical.power.exponent-fraction-line",
    "radical.radical.radical-symbol"
  ]) {
    const eligibility = resolveKpGestaltMotionEligibility(motionId);
    assert.equal(eligibility.mode, "structural-fragment");
    assert.equal(eligibility.deformationScale, 0);
    assert.ok(eligibility.microMotionScale < 0.3);
  }
});
