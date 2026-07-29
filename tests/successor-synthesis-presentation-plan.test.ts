import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  compileKpRegisteredSuccessorSynthesisPresentation
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
  const result = compileKpRegisteredSuccessorSynthesisPresentation({
    transformationId: transformation.id,
    transformationKind: transformation.transformType,
    binding
  });

  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  const plan = result.operationPresentationPlan;
  assert.equal(plan.planKind, "successor-synthesis");
  assert.deepEqual(binding, before);
  assert.ok(plan.roles.bundles.some(({ role }) =>
    role === "source-material"
  ));
  assert.ok(plan.roles.bundles.some(({ role }) => role === "catalyst"));
  assert.ok(plan.roles.bundles.some(({ role }) =>
    role === "target-material"
  ));
  assert.equal(plan.roles.groups[0]?.groupKind, "fusion");
  assert.equal(
    result.paintContinuityPlan.carriers[0]?.transferTopology,
    "shared-zero-area-junction"
  );
  assert.equal(result.paintContinuityPlan.nonZeroPaint, "opaque");
  assert.equal(
    result.paintContinuityPlan.operationPresentationPlanId,
    plan.id
  );
});

test("unregistered transformations become explicit static checkpoints", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "simplifyConstantProduct"
  )!;
  const binding = createKpEquationSuccessorSynthesisBindings({
    animation,
    transformation
  })[0]!;

  const result = compileKpRegisteredSuccessorSynthesisPresentation({
    transformationId: transformation.id,
    transformationKind: "projectUnknownEvaluation",
    binding
  });
  assert.equal(result.status, "explicit-static");
  if (result.status !== "explicit-static") return;
  assert.equal(result.checkpoint.reason, "unsupported-presentation");
});
