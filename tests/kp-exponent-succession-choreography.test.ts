import assert from "node:assert/strict";
import test from "node:test";

import {
  createExponentExpansionAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createKpExponentSuccessionChoreography
} from "../src/animation/exponent-succession-choreography.ts";

test("exponent factor peel compiles split lineage into the shared phase envelope", () => {
  const animation = createExponentExpansionAnimationAsset();
  const choreography = createKpExponentSuccessionChoreography({
    animation,
    transformationId: animation.transformations[0]!.id
  });

  assert.equal(
    choreography.plan.semantic.canonicalOperationId,
    "kp.algebra.lower-exponent"
  );
  assert.deepEqual(
    choreography.plan.semantic.lineage.edges.map((edge) => edge.relation),
    ["split", "split"]
  );
  assert.deepEqual(
    choreography.plan.semantic.lifecycle.records.map((record) => record.kind),
    ["copy", "copy"]
  );
  assert.deepEqual(
    choreography.timeline.phases.map((phase) => phase.phaseId),
    ["orient", "reflow", "act", "settle", "release"]
  );
  assert.equal(
    choreography.timeline.phases.find((phase) => phase.phaseId === "reflow")
      ?.noOp,
    true
  );
});

test("unit-exponent absorption preserves factors and retires only the exponent", () => {
  const animation = createExponentExpansionAnimationAsset();
  const choreography = createKpExponentSuccessionChoreography({
    animation,
    transformationId: animation.transformations[1]!.id
  });

  assert.equal(
    choreography.plan.semantic.canonicalOperationId,
    "kp.algebra.unwrap-unit-exponent"
  );
  assert.deepEqual(
    choreography.plan.semantic.lineage.edges.map((edge) => edge.relation),
    ["persist", "persist", "persist", "removal"]
  );
  assert.deepEqual(
    choreography.plan.semantic.lifecycle.records.map((record) => record.kind),
    ["continuant", "continuant", "continuant", "elimination"]
  );
  assert.equal(choreography.plan.semantic.salience.nodes.length, 6);
  assert.equal(choreography.plan.semantic.salience.edges.length, 3);
});
