import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExponentialHomomorphismEquationExtensionPack,
  kpExponentialHomomorphismRecipePhaseIds
} from
  "../src/animation/equation-extension-packs/exponential-homomorphism.ts";
import { validateKpEquationExtensionPack } from
  "../src/domain-ir/equation-extension-pack-validator.ts";
import { kpCanonicalHomomorphicCausalPhaseGrammar } from
  "../src/domain-ir/homomorphic-causal-phases.ts";

test("exponential pack binds dual laws to one nominal power recipe", () => {
  const result = validateKpEquationExtensionPack(
    createKpExponentialHomomorphismEquationExtensionPack()
  );
  assert.equal(result.status, "valid");
  if (result.status !== "valid") return;
  const pack = result.validatedPack.pack;
  assert.deepEqual(pack.operations.ids, [
    "operation.equation.exponential-sum-to-product.v1",
    "operation.equation.exponential-difference-to-quotient.v1"
  ]);
  assert.deepEqual(pack.operations.entries.map(({ semanticAuthorityIds }) =>
    semanticAuthorityIds
  ), [
    ["law.exponential.sum-to-product"],
    ["law.exponential.difference-to-quotient"]
  ]);
  assert.deepEqual(pack.recipes.ids, [
    "recipe.equation.exponential-homomorphism.v1"
  ]);
  assert.deepEqual(pack.recipes.entries[0]?.causalGrammarIds, [
    "grammar.equation.homomorphic-crossover.v1"
  ]);
  assert.deepEqual(kpExponentialHomomorphismRecipePhaseIds,
    kpCanonicalHomomorphicCausalPhaseGrammar.phases.map(({ id }) => id));
});

test("power motif declares semantic roles but no presentation controls", () => {
  const pack = createKpExponentialHomomorphismEquationExtensionPack();
  const schema = pack.motifs.entries[0]?.schema;
  assert.deepEqual(schema?.roles.map(({ id }) => id), [
    "source-power-application",
    "source-base",
    "source-exponent-payloads",
    "source-superscript-region",
    "source-connectors",
    "target-power-applications",
    "target-bases",
    "target-exponent-payloads",
    "target-superscript-regions",
    "target-connectors",
    "target-combination"
  ]);
  assert.doesNotMatch(JSON.stringify(pack),
    /duration|coordinates|geometry|opacity|timing|DOM/u);
});
