import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalReversePlanForTransformationType,
  evaluateKpCanonicalReverseChoreographyLaws
} from "../src/animation/canonical-reverse-choreography.ts";
import {
  kpAlgebraReverseRuntimeRegistrations
} from "../src/animation/catalog-packs/algebra-reverse-runtime.ts";
import { kpCanonicalOperationRegistry } from "../src/semantic/canonical-operation-registry.ts";

test("canonical operations satisfy explicit reverse choreography laws", () => {
  assert.deepEqual(
    kpCanonicalOperationRegistry.entries.flatMap((entry) =>
      evaluateKpCanonicalReverseChoreographyLaws({ entry })
    ),
    []
  );
});

test("lazy algebra reverse plans exactly match registry compilation", () => {
  kpAlgebraReverseRuntimeRegistrations.forEach((registration) => {
    assert.deepEqual(
      registration.plan,
      canonicalReversePlanForTransformationType({
        transformType: registration.transformType
      })
    );
  });
});

test("annihilation rewinds by opening its witness into an authored neutral pair", () => {
  const plan = canonicalReversePlanForTransformationType({
    transformType: "cancelAdditiveInverses"
  });
  assert.equal(plan?.choreographyKind, "introduce-neutral-pair");
  assert.equal(plan?.causalEmphasis, "witness");
  assert.equal(plan?.validity, "authored-history-only");
  assert.match(plan?.narration ?? "", /not a unique algebraic inverse/);
});

test("distribution and factoring expose causal inverse ownership transfers", () => {
  const distribution = canonicalReversePlanForTransformationType({
    transformType: "distributeMultiplication"
  });
  const factoring = canonicalReversePlanForTransformationType({
    transformType: "factorCommonTerm"
  });
  assert.deepEqual(
    [distribution?.choreographyKind, factoring?.choreographyKind],
    ["fusion", "fission"]
  );
  assert.equal(distribution?.validity, "mathematical-inverse");
  assert.equal(factoring?.validity, "mathematical-inverse");
});

test("successor reversal is historical decomposition, not a false inverse", () => {
  const plan = canonicalReversePlanForTransformationType({
    transformType: "simplifyConstantDifference"
  });
  assert.equal(plan?.choreographyKind, "decompose-successor");
  assert.equal(plan?.validity, "authored-history-only");
  assert.match(plan?.interpretation ?? "", /without exposing.*mathematical inverse/);
});

test("material-junction reversal restores the authored predecessor representation", () => {
  const plan = canonicalReversePlanForTransformationType({
    transformType: "rewritePowerAsRoot"
  });
  assert.equal(plan?.choreographyKind, "restore-predecessor");
  assert.equal(plan?.causalEmphasis, "predecessor");
  assert.equal(plan?.validity, "authored-history-only");
});
