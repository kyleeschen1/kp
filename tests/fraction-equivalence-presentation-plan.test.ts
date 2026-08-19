import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileKpFractionEquivalencePresentationPlan,
  isKpFractionEquivalencePresentationPlan,
  kpCanonicalFractionEquivalencePresentationPlan
} from "../src/animation/fraction-equivalence-presentation-plan.ts";
import { kpCanonicalFractionEquivalence } from
  "../src/semantic/fraction-equivalence.ts";

test("fraction equivalence composes persistence fan-out and fraction material", () => {
  const plan = kpCanonicalFractionEquivalencePresentationPlan;
  assert.equal(isKpFractionEquivalencePresentationPlan(plan), true);
  assert.deepEqual(plan.motif, {
    id: "motif.equation.fraction-equivalence-factor-copy.v1",
    primitiveAuthorityIds: [
      "kp.core.persist",
      "kp.core.fan-out",
      "recipe.equation.fraction-material.v1"
    ],
    rendererPrimitive: "none"
  });
  assert.equal(plan.structureContinuity.kind,
    "stable-native-fraction-structure");
  assert.equal(plan.structureContinuity.settlement, "native-target");
});

test("source operands persist while one factor owns two exact descendants", () => {
  const plan = kpCanonicalFractionEquivalencePresentationPlan;
  assert.deepEqual(plan.operandTransfers.map((transfer) => ({
    role: transfer.role,
    relation: transfer.relation,
    source: transfer.sourceEntityId,
    target: transfer.targetEntityId
  })), [{
    role: "numerator-source",
    relation: "identity",
    source: "fraction-equivalence.source.numerator",
    target: "fraction-equivalence.target.numerator-source"
  }, {
    role: "denominator-source",
    relation: "identity",
    source: "fraction-equivalence.source.denominator",
    target: "fraction-equivalence.target.denominator-source"
  }]);
  assert.deepEqual(plan.factorTransfer, {
    correspondenceId: "correspondence.fraction-equivalence.factor",
    relation: "copy",
    sourceEntityId: "fraction-equivalence.factor.parameter",
    targetEntityIds: [
      "fraction-equivalence.target.numerator-factor",
      "fraction-equivalence.target.denominator-factor"
    ],
    targetRoles: ["numerator-factor", "denominator-factor"],
    synchronization: "together"
  });
});

test("causal plan orders cohesion after arrival without aesthetic policy", () => {
  const plan = kpCanonicalFractionEquivalencePresentationPlan;
  assert.deepEqual(plan.phaseOrder, [
    "hold-source-structure",
    "introduce-shared-factor",
    "copy-factor-to-both-branches",
    "join-target-products",
    "settle-native-target"
  ]);
  assert.equal(plan.targetProducts.cohesion,
    "join-after-material-arrival");
  assert.equal(new Set(plan.sourceSelectorIds).size,
    plan.sourceSelectorIds.length);
  assert.equal(new Set(plan.targetSelectorIds).size,
    plan.targetSelectorIds.length);
  assert.equal(Object.isFrozen(plan), true);
});

test("copied semantic data cannot acquire presentation authority", () => {
  assert.throws(() => compileKpFractionEquivalencePresentationPlan({
    ...kpCanonicalFractionEquivalence
  }), /verifier-minted semantic truth/u);
});

test("presentation plan contains no clock geometry paint or host policy", async () => {
  const source = await readFile(new URL(
    "../src/animation/fraction-equivalence-presentation-plan.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /(?:requestAnimationFrame|durationMs:|coordinates:|geometry:|color:|opacity:|\.svelte|HTMLElement|SVGElement)/u);
});
