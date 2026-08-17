import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpHomomorphicCrossoverEquationExtensionPack,
  kpHomomorphicCrossoverRecipeRegistration,
  kpLogProductHomomorphicOperationRegistration
} from "../src/animation/equation-extension-packs/homomorphic-crossover.ts";
import {
  kpHomomorphicCrossoverCallerRegistrations,
  kpLogProductHomomorphicCrossoverCallerRegistration,
  kpLogQuotientHomomorphicCrossoverCallerRegistration
} from "../src/animation/homomorphic-crossover-caller-registrations.ts";
import {
  registerKpHomomorphicCrossoverCaller
} from "../src/animation/homomorphic-crossover-caller-registration.ts";
import {
  validateKpEquationExtensionPack
} from "../src/domain-ir/equation-extension-pack-validator.ts";
import {
  kpCanonicalHomomorphicCausalPhaseGrammar
} from "../src/domain-ir/homomorphic-causal-phases.ts";
import { kpCanonicalLogProductSemanticMotionPrecedence } from
  "../src/semantic/log-product-semantic-motion.ts";

test("product and quotient share one validated nominal crossover recipe", () => {
  const pack = createKpHomomorphicCrossoverEquationExtensionPack();
  const validation = validateKpEquationExtensionPack(pack);
  assert.equal(validation.status, "valid");
  assert.deepEqual(pack.operations.entries.map(({ id, semanticAuthorityIds }) =>
    ({ id, semanticAuthorityIds })), [{
    id: "operation.equation.log-product-decomposition.v1",
    semanticAuthorityIds: ["law.logarithm.product"]
  }, {
    id: "operation.equation.log-quotient-fusion.v1",
    semanticAuthorityIds: ["law.logarithm.quotient"]
  }]);
  assert.deepEqual(pack.recipes.ids, [
    "recipe.equation.homomorphic-decomposition.v1"
  ]);
  assert.deepEqual(pack.recipes.entries[0]?.operationKinds,
    pack.operations.ids);
  assert.deepEqual(pack.recipes.entries[0]?.causalGrammarIds, [
    kpCanonicalHomomorphicCausalPhaseGrammar.id
  ]);
});

test("both existing callers bind every shared phase without presentation policy", () => {
  assert.deepEqual(kpHomomorphicCrossoverCallerRegistrations.map(
    ({ semanticAuthorityId, recipeId }) => ({
      semanticAuthorityId,
      recipeId
    })), [{
    semanticAuthorityId: "law.logarithm.product",
    recipeId: "recipe.equation.homomorphic-decomposition.v1"
  }, {
    semanticAuthorityId: "law.logarithm.quotient",
    recipeId: "recipe.equation.homomorphic-decomposition.v1"
  }]);
  const expectedPhaseIds = kpCanonicalHomomorphicCausalPhaseGrammar.phases.map(
    ({ id }) => id
  );
  for (const registration of kpHomomorphicCrossoverCallerRegistrations) {
    assert.deepEqual(
      registration.phaseBindings.map(({ phaseId }) => phaseId),
      expectedPhaseIds
    );
    assert.equal(registration.presentationAuthority, "caller-local");
  }
  assert.equal(
    kpLogProductHomomorphicCrossoverCallerRegistration.callerIds.length,
    2
  );
  assert.deepEqual(
    kpLogQuotientHomomorphicCrossoverCallerRegistration.callerIds,
    ["animation.algebra.log-quotient.difference-to-quotient"]
  );
  const serialized = JSON.stringify(kpHomomorphicCrossoverCallerRegistrations);
  for (const forbidden of [
    "duration",
    "timing",
    "geometry",
    "coordinates",
    "motionPath",
    "opacity",
    "scale",
    "fractionConstruction",
    "renderer"
  ]) assert.equal(serialized.includes(forbidden), false, forbidden);
});

test("caller registration fails closed when a causal phase is omitted", () => {
  const validation = validateKpEquationExtensionPack(
    createKpHomomorphicCrossoverEquationExtensionPack()
  );
  assert.equal(validation.status, "valid");
  if (validation.status !== "valid") return;
  assert.throws(() => registerKpHomomorphicCrossoverCaller({
    id: "caller-registration.invalid.v1",
    callerIds: ["animation.invalid"],
    semanticMotionOperationId: "kp.semantic-motion.log-product",
    semanticAuthorityId: "law.logarithm.product",
    operationRegistration: kpLogProductHomomorphicOperationRegistration,
    recipeId: kpHomomorphicCrossoverRecipeRegistration.id,
    grammar: kpCanonicalHomomorphicCausalPhaseGrammar,
    precedence: kpCanonicalLogProductSemanticMotionPrecedence,
    phaseBindings:
      kpLogProductHomomorphicCrossoverCallerRegistration.phaseBindings.slice(1),
    registryAuthority: validation.validatedPack
  }), /bind every causal phase exactly once/u);
});
