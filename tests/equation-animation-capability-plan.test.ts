import assert from "node:assert/strict";
import test from "node:test";

import { kpEquationAnimationCapabilityPlan } from
  "../src/architecture/equation-animation-capability-plan.ts";

const expectedCapabilityIds = Object.freeze([
  "capability.equation.function-wrapping",
  "capability.equation.distribution",
  "capability.equation.additive-cancellation",
  "capability.equation.log-homomorphic-decomposition",
  "capability.equation.transform-series",
  "capability.equation.balanced-operations",
  "capability.equation.alternative-logarithm-bases",
  "capability.equation.fraction-equivalence",
  "capability.equation.common-denominator-construction",
  "capability.equation.fraction-arithmetic",
  "capability.equation.fraction-factor-cancellation",
  "capability.equation.nested-fraction-normalization",
  "capability.equation.exponential-homomorphism",
  "capability.equation.power-and-exponent-transformations",
  "capability.equation.radical-inversion",
  "capability.equation.substitution-collection-factoring",
  "capability.equation.branching-and-domain-conditions",
  "capability.equation.inequality-transformations",
  "capability.equation.trigonometric-transformations",
  "capability.equation.piecewise-transformations",
  "capability.equation.sequence-series-transformations",
  "capability.equation.limit-transformations",
  "capability.equation.differentiation-transformations",
  "capability.equation.integration-transformations",
  "capability.equation.polar-parametric-transformations",
  "capability.equation.differential-equation-transformations",
  "capability.equation.taylor-series-transformations",
  "capability.equation.binders-and-calculus-operators",
  "capability.equation.multiline-derivation-continuity"
] as const);

test("equation capabilities preserve the accepted exact order", () => {
  assert.deepEqual(
    kpEquationAnimationCapabilityPlan.entries.map(({ id }) => id),
    expectedCapabilityIds
  );
  assert.deepEqual(
    kpEquationAnimationCapabilityPlan.entries.map(({ order }) => order),
    expectedCapabilityIds.map((_, index) => index + 1)
  );
});

test("alternative logarithm bases are a distinct syntax and motif capability", () => {
  const capability = kpEquationAnimationCapabilityPlan.entries.find(
    ({ id }) => id === "capability.equation.alternative-logarithm-bases"
  );
  assert.ok(capability);
  assert.deepEqual(
    new Set(capability.requirements.map(({ kind }) => kind)),
    new Set([
      "endpoint-normalizer",
      "semantic-operation",
      "canonical-recipe",
      "motion-motif",
      "canonical-exemplar",
      "authoring-surface",
      "generation-corpus"
    ])
  );
  assert.equal(
    capability.requirements.find(({ kind }) => kind === "motion-motif")
      ?.authorityId,
    "motif.equation.logarithm-base-handoff.v1"
  );
});

test("one exemplar never stands in for general family capability", () => {
  for (const entry of kpEquationAnimationCapabilityPlan.entries) {
    const kinds = new Set(entry.requirements.map(({ kind }) => kind));
    if (!kinds.has("canonical-exemplar")) continue;
    assert.ok(
      kinds.has("semantic-operation"),
      `${entry.id} needs semantic operation authority beyond its exemplar`
    );
    assert.ok(
      kinds.has("canonical-recipe"),
      `${entry.id} needs canonical recipe authority beyond its exemplar`
    );
  }
});

test("detailed fraction root branch binder and derivation gaps remain visible", () => {
  const ids = new Set(kpEquationAnimationCapabilityPlan.entries.map(({ id }) => id));
  for (const id of [
    "capability.equation.fraction-equivalence",
    "capability.equation.common-denominator-construction",
    "capability.equation.fraction-arithmetic",
    "capability.equation.fraction-factor-cancellation",
    "capability.equation.nested-fraction-normalization",
    "capability.equation.radical-inversion",
    "capability.equation.branching-and-domain-conditions",
    "capability.equation.binders-and-calculus-operators",
    "capability.equation.multiline-derivation-continuity"
  ]) assert.ok(ids.has(id), `missing ordered capability ${id}`);
});
