import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileKpLogarithmChangeOfBasePresentationPlan,
  isKpLogarithmChangeOfBasePresentationPlan,
  kpCanonicalLogarithmChangeOfBasePresentationPlan
} from "../src/animation/logarithm-change-of-base-presentation-plan.ts";
import { kpCanonicalLogarithmChangeOfBase } from
  "../src/semantic/logarithm-change-of-base.ts";

test("change-of-base composes existing wrap fraction and renderer authority", () => {
  const plan = kpCanonicalLogarithmChangeOfBasePresentationPlan;
  assert.equal(isKpLogarithmChangeOfBasePresentationPlan(plan), true);
  assert.equal(plan.recipeId,
    "recipe.equation.change-logarithm-base.v1");
  assert.deepEqual(plan.motif, {
    id: "motif.equation.logarithm-base-handoff.v1",
    primitiveAuthorityIds: [
      "motif.function-wrap.v1",
      "recipe.equation.fraction-material.v1",
      "renderer-capability.equation.native-katex.v1"
    ],
    rendererPrimitive: "none"
  });
  assert.equal(plan.fractionConstruction.kind,
    "native-katex-fraction-construction");
  assert.equal(plan.fractionConstruction.settlement, "native-target");
});

test("two synchronized wrap branches receive argument and base material", () => {
  const plan = kpCanonicalLogarithmChangeOfBasePresentationPlan;
  assert.deepEqual(plan.functionWrapInvocationGroup.branches.map((branch) => ({
    id: branch.id,
    source: branch.sourceArgumentEntityIds,
    target: branch.targetArgumentEntityIds,
    syntax: branch.functionEntityIds
  })), [{
    id: "change-of-base.numerator",
    source: ["source.log-base-two.argument-seven"],
    target: ["target.numerator.argument-seven"],
    syntax: ["target.numerator.operator"]
  }, {
    id: "change-of-base.denominator",
    source: ["source.log-base-two.base"],
    target: ["target.denominator.argument-two"],
    syntax: ["target.denominator.operator"]
  }]);
  assert.equal(plan.functionWrapInvocationGroup.synchronization, "together");
  assert.equal(plan.forwardReception.direction, "forward");
  assert.equal(plan.rewindReception.direction, "rewind");
});

test("causal plan covers exact endpoints without timing or geometry", () => {
  const plan = kpCanonicalLogarithmChangeOfBasePresentationPlan;
  assert.deepEqual(plan.phaseOrder, [
    "prepare-source-handoff",
    "transfer-identity-material",
    "construct-fraction-structure",
    "receive-natural-log-wrappers",
    "settle-native-target"
  ]);
  assert.equal(new Set(plan.sourceSelectorIds).size,
    plan.sourceSelectorIds.length);
  assert.equal(new Set(plan.targetSelectorIds).size,
    plan.targetSelectorIds.length);
  assert.deepEqual(plan.identityTransfers.map(({ destinationRole }) =>
    destinationRole), ["numerator-argument", "denominator-argument"]);
  assert.equal(Object.isFrozen(plan), true);
});

test("copied semantic data cannot acquire presentation authority", () => {
  assert.throws(() => compileKpLogarithmChangeOfBasePresentationPlan({
    ...kpCanonicalLogarithmChangeOfBase
  }), /verifier-minted semantic truth/u);
});

test("caller-local plan introduces no renderer clock or compositor primitive", async () => {
  const source = await readFile(new URL(
    "../src/animation/logarithm-change-of-base-presentation-plan.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /(?:native-katex-glyph-compositor|requestAnimationFrame|durationMs:|coordinates:|geometry:)/u);
  assert.match(source, /compileKpFunctionWrapInvocationGroup/u);
  assert.match(source, /KP_EQUATION_FRACTION_MATERIAL_RECIPE_ID/u);
});
