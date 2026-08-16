import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpMotifInvocation,
  createKpMotifEntityBinding,
  createKpMotifInvocation,
  defineKpMotifSchema,
  type KpCompiledMotifPlan
} from "../src/domain-ir/equation-motif-invocation.ts";
import {
  compileKpEquationRecipe,
  defineKpEquationRecipe,
  sampleKpCompiledEquationRecipe
} from "../src/domain-ir/equation-recipe-composition.ts";
import {
  createKpRecipeId,
  kpCanonicalEquationMotionVocabulary
} from "../src/domain-ir/equation-motion-vocabulary.ts";

const vocabulary = kpCanonicalEquationMotionVocabulary;
const schema = defineKpMotifSchema({
  id: vocabulary.motifs.functionWrapV1,
  familyId: vocabulary.families.structuralWrapV1,
  operationKinds: [vocabulary.operations.wrapFunctionV1],
  roles: [
    { id: "continuant", cardinality: "exactly-one", materialKind: "continuant" }
  ],
  requiredRendererCapabilityIds: [vocabulary.rendererCapabilities.nativeKatexV1]
});

test("recipe composition sequences and overlaps named motifs on one host clock", () => {
  const result = compileKpEquationRecipe(defineKpEquationRecipe({
    id: createKpRecipeId("recipe.test-composition.v1"),
    operationKind: vocabulary.operations.wrapFunctionV1,
    phases: [
      phase("release", 2),
      phase("wrap-left", 1),
      phase("wrap-right", 1)
    ],
    dependencies: [
      { from: "release", to: "wrap-left", kind: "sequence" },
      { from: "wrap-left", to: "wrap-right", kind: "overlap", overlapFraction: 0.5 }
    ]
  }));
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  assert.equal(result.recipe.hostClock, "kp.shared-normalized-clock.v1");
  assert.deepEqual(
    result.recipe.phases.map(({ id }) => id),
    ["release", "wrap-left", "wrap-right"]
  );
  const [release, left, right] = result.recipe.phases;
  assert.equal(release!.startProgress, 0);
  assert.equal(release!.endProgress, left!.startProgress);
  assert.ok(right!.startProgress < left!.endProgress);
  assert.equal(right!.endProgress, 1);
});

test("cycle and malformed dependency diagnostics fail closed", () => {
  const result = compileKpEquationRecipe(defineKpEquationRecipe({
    id: createKpRecipeId("recipe.test-cycle.v1"),
    operationKind: vocabulary.operations.wrapFunctionV1,
    phases: [phase("left", 1), phase("right", 1)],
    dependencies: [
      { from: "left", to: "right", kind: "sequence" },
      { from: "right", to: "left", kind: "sequence" }
    ]
  }));
  assert.equal(result.status, "invalid");
  assert.deepEqual(
    result.diagnostics.map(({ code }) => code),
    ["recipe.dependency.cycle"]
  );
});

test("recipes reject unknown phases, invalid overlap, and forged motif plans", () => {
  const forged = { ...motifPlan("forged") } as KpCompiledMotifPlan;
  const result = compileKpEquationRecipe(defineKpEquationRecipe({
    id: createKpRecipeId("recipe.test-malformed.v1"),
    operationKind: vocabulary.operations.wrapFunctionV1,
    phases: [{ id: "forged", motifPlan: forged, spanWeight: 1 }],
    dependencies: [
      { from: "forged", to: "missing", kind: "overlap", overlapFraction: 1 }
    ]
  }));
  assert.equal(result.status, "invalid");
  assert.deepEqual(
    result.diagnostics.map(({ code }) => code),
    [
      "recipe.phase.uncompiled-motif",
      "recipe.dependency.unknown-phase",
      "recipe.dependency.overlap"
    ]
  );
});

test("seek rewind and interruption are history-independent", () => {
  const result = compileKpEquationRecipe(defineKpEquationRecipe({
    id: createKpRecipeId("recipe.test-seek.v1"),
    operationKind: vocabulary.operations.wrapFunctionV1,
    phases: [phase("first", 1), phase("second", 1)],
    dependencies: [{ from: "first", to: "second", kind: "sequence" }]
  }));
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;

  const forward = sampleKpCompiledEquationRecipe(result.recipe, 0.75);
  const rewind = sampleKpCompiledEquationRecipe(result.recipe, 0.25);
  const resumed = sampleKpCompiledEquationRecipe(result.recipe, 0.75);
  assert.deepEqual(resumed, forward);
  assert.deepEqual(
    rewind.phases.map(({ state, localProgress }) => ({ state, localProgress })),
    [
      { state: "active", localProgress: 0.5 },
      { state: "queued", localProgress: 0 }
    ]
  );
  assert.deepEqual(
    sampleKpCompiledEquationRecipe(result.recipe, -1),
    sampleKpCompiledEquationRecipe(result.recipe, 0)
  );
  assert.deepEqual(
    sampleKpCompiledEquationRecipe(result.recipe, 2),
    sampleKpCompiledEquationRecipe(result.recipe, 1)
  );
});

function phase(id: string, spanWeight: number) {
  return { id, spanWeight, motifPlan: motifPlan(id) };
}

function motifPlan(id: string): KpCompiledMotifPlan {
  const invocation = createKpMotifInvocation(schema, {
    id: `invocation.${id}`,
    motifId: vocabulary.motifs.functionWrapV1,
    operationKind: vocabulary.operations.wrapFunctionV1,
    roleBindings: {
      continuant: [createKpMotifEntityBinding({
        entityId: `entity.${id}`,
        semanticObjectId: `semantic.${id}`
      })]
    }
  });
  const result = compileKpMotifInvocation({
    schema,
    invocation,
    rendererCapabilityIds: [vocabulary.rendererCapabilities.nativeKatexV1]
  });
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") throw new Error("test motif failed to compile");
  return result.plan;
}
