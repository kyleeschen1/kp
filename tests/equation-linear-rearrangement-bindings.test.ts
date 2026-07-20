import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { createKpLinearRearrangementChoreography } from "../src/animation/linear-rearrangement-choreography.ts";
import { createKpEquationLinearRearrangementBindings } from "../src/rendering/equation-linear-rearrangement-bindings.ts";

test("lightweight reader bindings preserve canonical choreography semantics", () => {
  const animation = createLinearSolveAnimationAsset();
  const lightweight = createKpEquationLinearRearrangementBindings(animation);
  const canonical = createKpLinearRearrangementChoreography(animation).steps;

  assert.deepEqual(
    lightweight.map((step) => ({
      transformationId: step.transformationId,
      kind: step.kind,
      successorSynthesisBinding: step.successorSynthesisBinding
    })),
    canonical.map((step) => ({
      transformationId: step.transformationId,
      kind: step.kind,
      successorSynthesisBinding: step.successorSynthesisBinding
    }))
  );
});
