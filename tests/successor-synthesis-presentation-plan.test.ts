import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  compileKpRegisteredSuccessorSynthesisPresentationPlan
} from "../src/animation/successor-synthesis-presentation-plan.ts";
import {
  createKpEquationSuccessorSynthesisBindings
} from "../src/rendering/equation-linear-rearrangement-bindings.ts";

test("registered successor compiler classifies material without changing motion binding", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "simplifyConstantProduct"
  )!;
  const binding = createKpEquationSuccessorSynthesisBindings({
    animation,
    transformation
  })[0]!;
  const before = structuredClone(binding);
  const plan = compileKpRegisteredSuccessorSynthesisPresentationPlan({
    transformationId: transformation.id,
    transformationKind: transformation.transformType,
    binding
  });

  assert.ok(plan);
  assert.equal(plan?.planKind, "successor-synthesis");
  assert.deepEqual(binding, before);
  assert.ok(plan?.roles.bundles.some(({ role }) =>
    role === "source-material"
  ));
  assert.ok(plan?.roles.bundles.some(({ role }) => role === "catalyst"));
  assert.ok(plan?.roles.bundles.some(({ role }) =>
    role === "target-material"
  ));
  assert.equal(plan?.roles.groups[0]?.groupKind, "fusion");
});

test("unregistered transformations do not acquire executable plan authority", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "simplifyConstantProduct"
  )!;
  const binding = createKpEquationSuccessorSynthesisBindings({
    animation,
    transformation
  })[0]!;

  assert.equal(
    compileKpRegisteredSuccessorSynthesisPresentationPlan({
      transformationId: transformation.id,
      transformationKind: "projectUnknownEvaluation",
      binding
    }),
    undefined
  );
});
