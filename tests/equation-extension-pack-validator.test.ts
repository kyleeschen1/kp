import assert from "node:assert/strict";
import test from "node:test";

import {
  composeKpEquationExtensionPack,
  createKpEquationFamilyRegistry,
  createKpEquationMotifRegistry,
  createKpEquationOperationRegistry,
  createKpEquationRecipeRegistry,
  createKpEquationRendererCapabilityRegistry,
  type KpEquationExtensionPack
} from "../src/domain-ir/equation-extension-registry.ts";
import {
  isKpValidatedEquationExtensionPack,
  validateKpEquationExtensionPack
} from "../src/domain-ir/equation-extension-pack-validator.ts";
import { defineKpMotifSchema } from "../src/domain-ir/equation-motif-invocation.ts";
import {
  createKpRecipeId,
  kpCanonicalEquationMotionVocabulary
} from "../src/domain-ir/equation-motion-vocabulary.ts";

const vocabulary = kpCanonicalEquationMotionVocabulary;

test("a role-complete closed pack is minted with code-generation disposition", () => {
  const result = validateKpEquationExtensionPack(validPack());
  assert.equal(result.status, "valid");
  if (result.status !== "valid") return;
  assert.equal(isKpValidatedEquationExtensionPack(result.validatedPack), true);
  assert.deepEqual(result.validatedPack.familyDispositions, [{
    familyId: vocabulary.families.structuralWrapV1,
    disposition: "active"
  }]);
});

test("missing closure emits exact operation and family diagnostics", () => {
  const pack = validPack();
  const malformed = {
    ...pack,
    recipes: createKpEquationRecipeRegistry([])
  } as KpEquationExtensionPack;
  const result = validateKpEquationExtensionPack(malformed);
  assert.equal(result.status, "invalid");
  assert.deepEqual(result.diagnostics.map(({ code, path }) => ({ code, path })), [
    { code: "pack.operation.recipe-missing", path: "$.operations[0].recipeIds[0]" },
    { code: "pack.family.member-missing", path: "$.families[0].recipeIds[0]" }
  ]);
});

test("role capability cycle and disposition defects fail before generation", () => {
  const pack = validPack();
  const recipe = pack.recipes.entries[0]!;
  const cyclicRecipes = createKpEquationRecipeRegistry([{
    ...recipe,
    motifUses: [{ ...recipe.motifUses[0]!, roleIds: [] }],
    dependencyRecipeIds: [recipe.id]
  }]);
  const malformedFamily = {
    ...pack.families.entries[0]!,
    disposition: "mystery"
  } as unknown as typeof pack.families.entries[number];
  const malformed = {
    ...pack,
    recipes: cyclicRecipes,
    rendererCapabilities: createKpEquationRendererCapabilityRegistry([]),
    families: createKpEquationFamilyRegistry([malformedFamily])
  } as KpEquationExtensionPack;
  const result = validateKpEquationExtensionPack(malformed);
  assert.equal(result.status, "invalid");
  assert.deepEqual(result.diagnostics.map(({ code, path }) => ({ code, path })), [
    { code: "pack.recipe.role-incompatible", path: "$.recipes[0].motifUses[0].roleIds" },
    { code: "pack.motif.capability-missing", path: "$.motifs[0].schema.requiredRendererCapabilityIds[0]" },
    { code: "pack.family.disposition-invalid", path: "$.families[0].disposition" },
    { code: "pack.family.member-missing", path: "$.families[0].rendererCapabilityIds[0]" },
    { code: "pack.recipe.dependency-cycle", path: "$.recipes" }
  ]);
});

function validPack(): KpEquationExtensionPack {
  const schema = defineKpMotifSchema({
    id: vocabulary.motifs.functionWrapV1,
    familyId: vocabulary.families.structuralWrapV1,
    operationKinds: [vocabulary.operations.wrapFunctionV1],
    roles: [
      { id: "continuant", cardinality: "exactly-one", materialKind: "continuant" }
    ],
    requiredRendererCapabilityIds: [vocabulary.rendererCapabilities.nativeKatexV1]
  });
  const recipeId = createKpRecipeId("recipe.function-application.v1");
  return composeKpEquationExtensionPack({
    id: "equation-pack.validator-fixture.v1",
    operations: createKpEquationOperationRegistry([{
      id: vocabulary.operations.wrapFunctionV1,
      familyId: vocabulary.families.structuralWrapV1,
      recipeIds: [recipeId],
      semanticAuthorityIds: []
    }]),
    recipes: createKpEquationRecipeRegistry([{
      id: recipeId,
      familyId: vocabulary.families.structuralWrapV1,
      operationKinds: [vocabulary.operations.wrapFunctionV1],
      motifUses: [{
        id: "wrap",
        motifId: vocabulary.motifs.functionWrapV1,
        roleIds: ["continuant"]
      }],
      dependencyRecipeIds: [],
      causalGrammarIds: []
    }]),
    motifs: createKpEquationMotifRegistry([{
      id: vocabulary.motifs.functionWrapV1,
      familyId: vocabulary.families.structuralWrapV1,
      schema
    }]),
    rendererCapabilities: createKpEquationRendererCapabilityRegistry([{
      id: vocabulary.rendererCapabilities.nativeKatexV1,
      motifIds: [vocabulary.motifs.functionWrapV1]
    }]),
    families: createKpEquationFamilyRegistry([{
      id: vocabulary.families.structuralWrapV1,
      disposition: "active",
      operationKindIds: [vocabulary.operations.wrapFunctionV1],
      recipeIds: [recipeId],
      motifIds: [vocabulary.motifs.functionWrapV1],
      rendererCapabilityIds: [vocabulary.rendererCapabilities.nativeKatexV1]
    }])
  });
}
