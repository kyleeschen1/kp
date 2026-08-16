import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFamilyId,
  createKpMotifId,
  createKpOperationKind,
  createKpRecipeId,
  createKpRendererCapabilityId,
  isKpFamilyId,
  isKpMotifId,
  isKpOperationKind,
  isKpRecipeId,
  isKpRendererCapabilityId,
  kpCanonicalEquationMotionVocabulary,
  type KpMotifId
} from "../src/domain-ir/equation-motion-vocabulary.ts";
import {
  createKpFunctionWrapReceptionPlan
} from "../src/animation/function-wrap-reception.ts";

const nominalMotif = createKpMotifId("motif.function-wrap.v1");
const nominalRecipe = createKpRecipeId("recipe.equation.function-wrap.v1");
// @ts-expect-error Recipe identity cannot satisfy a motif invocation.
const crossKindAssignment: KpMotifId = nominalRecipe;
void [nominalMotif, crossKindAssignment];

test("canonical equation vocabulary is versioned, serializable, and nominally distinct", () => {
  const vocabulary = kpCanonicalEquationMotionVocabulary;
  assert.equal(vocabulary.motifs.functionWrapV1, "motif.function-wrap.v1");
  assert.equal(
    vocabulary.rendererCapabilities.nativeKatexV1,
    "renderer-capability.equation.native-katex.v1"
  );

  const decoded = JSON.parse(JSON.stringify(vocabulary)) as {
    motifs: { functionWrapV1: string };
  };
  assert.equal(
    createKpMotifId(decoded.motifs.functionWrapV1),
    vocabulary.motifs.functionWrapV1
  );
  assert.equal(Object.isFrozen(vocabulary), true);
  assert.equal(Object.isFrozen(vocabulary.motifs), true);
});

test("each vocabulary constructor rejects ambiguous, unversioned, or foreign ids", () => {
  const constructors = [
    [createKpMotifId, "wrap"],
    [createKpRecipeId, "motif.function-wrap.v1"],
    [createKpOperationKind, "operation.Wrap.v1"],
    [createKpRendererCapabilityId, "renderer-capability.native-katex"],
    [createKpFamilyId, " family.equation.v1"]
  ] as const;
  for (const [constructor, value] of constructors) {
    assert.throws(() => constructor(value), /Invalid .* id/);
  }
});

test("runtime guards recover branded ids at JSON and authoring boundaries", () => {
  assert.equal(isKpMotifId("motif.function-wrap.v1"), true);
  assert.equal(isKpRecipeId("recipe.equation.function-application.v1"), true);
  assert.equal(isKpOperationKind("operation.wrap-function.v1"), true);
  assert.equal(
    isKpRendererCapabilityId(
      "renderer-capability.equation.native-katex.v1"
    ),
    true
  );
  assert.equal(isKpFamilyId("family.equation.structural-wrap.v1"), true);
  assert.equal(isKpMotifId("recipe.equation.function-application.v1"), false);
});

test("function-wrap reception carries executable canonical motif identity", () => {
  const plan = createKpFunctionWrapReceptionPlan({
    id: "function-wrap-reception.test",
    direction: "forward",
    branches: [{
      id: "branch.test",
      argumentEntityIds: ["argument.test"],
      syntaxEntityIds: ["function.test"],
      enclosureEntityRoles: []
    }]
  });

  assert.equal(
    plan.motifId,
    kpCanonicalEquationMotionVocabulary.motifs.functionWrapV1
  );
});
