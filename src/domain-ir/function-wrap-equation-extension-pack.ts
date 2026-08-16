import {
  composeKpEquationExtensionPack,
  createKpEquationFamilyRegistry,
  createKpEquationMotifRegistry,
  createKpEquationOperationRegistry,
  createKpEquationRecipeRegistry,
  createKpEquationRendererCapabilityRegistry,
  type KpEquationMotifRegistration,
  type KpEquationOperationRegistration,
  type KpEquationRecipeRegistration
} from "./equation-extension-registry.ts";
import { defineKpMotifSchema } from "./equation-motif-invocation.ts";
import { kpCanonicalEquationMotionVocabulary } from "./equation-motion-vocabulary.ts";

const vocabulary = kpCanonicalEquationMotionVocabulary;

export const kpFunctionWrapMotifSchema = defineKpMotifSchema({
  id: vocabulary.motifs.functionWrapV1,
  familyId: vocabulary.families.structuralWrapV1,
  operationKinds: [vocabulary.operations.wrapFunctionV1],
  roles: [
    { id: "argument", cardinality: "one-or-more", materialKind: "continuant" },
    { id: "function", cardinality: "one-or-more", materialKind: "syntax" },
    { id: "leading-enclosure", cardinality: "one-or-more", materialKind: "enclosure" },
    { id: "trailing-enclosure", cardinality: "one-or-more", materialKind: "enclosure" }
  ],
  requiredRendererCapabilityIds: [
    vocabulary.rendererCapabilities.nativeKatexV1
  ]
});

export const kpFunctionWrapOperationRegistration = Object.freeze({
  id: vocabulary.operations.wrapFunctionV1,
  familyId: vocabulary.families.structuralWrapV1,
  recipeIds: Object.freeze([vocabulary.recipes.functionApplicationV1])
} as const satisfies KpEquationOperationRegistration);

export const kpFunctionWrapRecipeRegistration = Object.freeze({
  id: vocabulary.recipes.functionApplicationV1,
  familyId: vocabulary.families.structuralWrapV1,
  operationKind: vocabulary.operations.wrapFunctionV1,
  motifUses: Object.freeze([Object.freeze({
    id: "function-wrap",
    motifId: vocabulary.motifs.functionWrapV1,
    roleIds: Object.freeze(kpFunctionWrapMotifSchema.roles.map(({ id }) => id))
  })]),
  dependencyRecipeIds: Object.freeze([])
} as const satisfies KpEquationRecipeRegistration);

export const kpFunctionWrapMotifRegistration = Object.freeze({
  id: vocabulary.motifs.functionWrapV1,
  familyId: vocabulary.families.structuralWrapV1,
  schema: kpFunctionWrapMotifSchema
} as const satisfies KpEquationMotifRegistration);

export function createKpFunctionWrapEquationExtensionPack() {
  return composeKpEquationExtensionPack({
    id: "equation-pack.function-wrap.v1",
    operations: createKpEquationOperationRegistry([
      kpFunctionWrapOperationRegistration
    ]),
    recipes: createKpEquationRecipeRegistry([
      kpFunctionWrapRecipeRegistration
    ]),
    motifs: createKpEquationMotifRegistry([
      kpFunctionWrapMotifRegistration
    ]),
    rendererCapabilities: createKpEquationRendererCapabilityRegistry([{
      id: vocabulary.rendererCapabilities.nativeKatexV1,
      motifIds: [vocabulary.motifs.functionWrapV1]
    }]),
    families: createKpEquationFamilyRegistry([{
      id: vocabulary.families.structuralWrapV1,
      disposition: "active",
      operationKindIds: [vocabulary.operations.wrapFunctionV1],
      recipeIds: [vocabulary.recipes.functionApplicationV1],
      motifIds: [vocabulary.motifs.functionWrapV1],
      rendererCapabilityIds: [
        vocabulary.rendererCapabilities.nativeKatexV1
      ]
    }])
  });
}
