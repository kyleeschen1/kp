import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { createFractionSimplificationAnimationAsset } from "../src/animation/fraction-adapter.ts";
import { kpEquationPresentationPolicy } from "../src/rendering/equation-presentation-policy.ts";

test("canonical linear solve retains semantics but uses the continuity presentation", () => {
  const animation = createLinearSolveAnimationAsset();
  const policy = kpEquationPresentationPolicy(animation);

  assert.equal(policy.recipe, "continuity-v1");
  assert.equal(policy.applyWitnessedAnnihilation, false);
  assert.equal(policy.applySuccessorSynthesis, false);
  assert.ok(animation.transformations.some(
    (transformation) => transformation.transformType === "cancelAdditiveInverses"
  ));
  assert.ok(animation.transformations.some(
    (transformation) => transformation.transformType === "simplifyConstantDifference"
  ));
});

test("other equation assets retain the semantic material presentation", () => {
  const policy = kpEquationPresentationPolicy(
    createFractionSimplificationAnimationAsset()
  );

  assert.equal(policy.recipe, "semantic-material-v2");
  assert.equal(policy.applyWitnessedAnnihilation, true);
  assert.equal(policy.applySuccessorSynthesis, true);
});
