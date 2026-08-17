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
} from "../../domain-ir/equation-extension-registry.ts";
import {
  kpCanonicalFunctionWrapPhaseGrammar,
  kpFunctionWrapMotifSchema
} from "../function-wrap-motif.ts";
import { kpCanonicalEquationMotionVocabulary } from "../../domain-ir/equation-motion-vocabulary.ts";

const vocabulary = kpCanonicalEquationMotionVocabulary;

export const kpFunctionWrapEquationExtensionPackId =
  "equation-pack.function-wrap.v1";

export const kpFunctionWrapOperationRegistration = Object.freeze({
  id: vocabulary.operations.wrapFunctionV1,
  familyId: vocabulary.families.structuralWrapV1,
  recipeIds: Object.freeze([vocabulary.recipes.functionApplicationV1]),
  semanticAuthorityIds: Object.freeze([])
} as const satisfies KpEquationOperationRegistration);

export const kpFunctionWrapRecipeRegistration = Object.freeze({
  id: vocabulary.recipes.functionApplicationV1,
  familyId: vocabulary.families.structuralWrapV1,
  operationKinds: Object.freeze([vocabulary.operations.wrapFunctionV1]),
  motifUses: Object.freeze([Object.freeze({
    id: "function-wrap",
    motifId: vocabulary.motifs.functionWrapV1,
    roleIds: Object.freeze(kpFunctionWrapMotifSchema.roles.map(({ id }) => id))
  })]),
  dependencyRecipeIds: Object.freeze([]),
  causalGrammarIds: Object.freeze([])
} as const satisfies KpEquationRecipeRegistration);

export const kpFunctionWrapMotifRegistration = Object.freeze({
  id: vocabulary.motifs.functionWrapV1,
  familyId: vocabulary.families.structuralWrapV1,
  schema: kpFunctionWrapMotifSchema
} as const satisfies KpEquationMotifRegistration);

export function createKpFunctionWrapEquationExtensionPack() {
  return composeKpEquationExtensionPack({
    id: kpFunctionWrapEquationExtensionPackId,
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

export const kpFunctionWrapRecipePhaseIds = Object.freeze(
  kpCanonicalFunctionWrapPhaseGrammar.map(({ id }) => id)
);
