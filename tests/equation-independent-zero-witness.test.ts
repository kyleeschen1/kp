import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpIndependentZeroWitnessPlan,
  sampleKpIndependentZeroWitness
} from "../src/rendering/equation-independent-zero-witness.ts";
import type {
  KpMeasuredEquationTransitionGeometry
} from "../src/rendering/equation-motion-dom.ts";

const geometry: KpMeasuredEquationTransitionGeometry = {
  transitionId: "transition.cancel",
  linearRearrangementKind: "cancel-additive-inverses",
  zeroWitnessPresentationRecipe: "independent-zero-v1",
  sourceTokens: [],
  targetTokens: [],
  relations: [{
    recordId: "inverse-terms",
    lifecycle: "cancel",
    source: {
      selectorIds: ["plus-three", "minus-three"],
      motionIds: ["plus-three", "minus-three"],
      bounds: { left: 40, top: 20, width: 48, height: 20 }
    }
  }]
};

test("independent zero uses cancellation geometry without adopting term identity", () => {
  const plan = createKpIndependentZeroWitnessPlan(geometry)!;

  assert.equal(plan.relationRecordId, "inverse-terms");
  assert.equal(plan.latex, "+0");
  assert.deepEqual(plan.contactPoint, { x: 64, y: 30 });
  assert.equal(Object.isFrozen(plan), true);
  assert.ok(!plan.id.includes("plus-three"));
  assert.ok(!plan.id.includes("minus-three"));
});

test("independent zero enters after contact, dwells readably, then exits", () => {
  const plan = createKpIndependentZeroWitnessPlan(geometry)!;
  const hidden = sampleKpIndependentZeroWitness(plan, 0.79);
  const dwell = sampleKpIndependentZeroWitness(plan, 0.86);
  const exited = sampleKpIndependentZeroWitness(plan, 0.95);

  assert.equal(hidden.pose.opacity, 0);
  assert.equal(hidden.readable, false);
  assert.equal(dwell.phase, "dwell");
  assert.equal(dwell.pose.opacity, 1);
  assert.equal(dwell.readable, true);
  assert.equal(exited.pose.opacity, 0);
  assert.equal(exited.readable, false);
});

test("independent zero rejects geometry without a cancellation source", () => {
  assert.throws(() => createKpIndependentZeroWitnessPlan({
    ...geometry,
    relations: []
  }), /requires a measured cancellation source/);
});
