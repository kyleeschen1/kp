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
import { kpCanonicalHomomorphicCausalPhaseGrammar } from
  "../../domain-ir/homomorphic-causal-phases.ts";
import {
  KP_EXPONENTIAL_DIFFERENCE_TO_QUOTIENT_LAW_ID,
  KP_EXPONENTIAL_SUM_TO_PRODUCT_LAW_ID
} from "../../semantic/exponential-homomorphism-law.ts";
import {
  kpExponentialHomomorphismEquationVocabulary,
  kpExponentialHomomorphismMotifSchema
} from "../exponential-homomorphism-motif.ts";

const vocabulary = kpExponentialHomomorphismEquationVocabulary;

export const kpExponentialHomomorphismEquationExtensionPackId =
  "equation-pack.exponential-homomorphism.v1";

export const kpExponentialSumToProductOperationRegistration = Object.freeze({
  id: vocabulary.operations.product,
  familyId: vocabulary.family,
  recipeIds: Object.freeze([vocabulary.recipe]),
  semanticAuthorityIds: Object.freeze([
    KP_EXPONENTIAL_SUM_TO_PRODUCT_LAW_ID
  ]),
  plannerSummary:
    "Distribute one power application over an additive exponent into an ordered product of successor powers."
} as const satisfies KpEquationOperationRegistration);

export const kpExponentialDifferenceToQuotientOperationRegistration =
  Object.freeze({
    id: vocabulary.operations.quotient,
    familyId: vocabulary.family,
    recipeIds: Object.freeze([vocabulary.recipe]),
    semanticAuthorityIds: Object.freeze([
      KP_EXPONENTIAL_DIFFERENCE_TO_QUOTIENT_LAW_ID
    ]),
    plannerSummary:
      "Distribute one power application over a subtractive exponent into numerator and denominator successor powers."
  } as const satisfies KpEquationOperationRegistration);

export const kpExponentialHomomorphismRecipeRegistration = Object.freeze({
  id: vocabulary.recipe,
  familyId: vocabulary.family,
  operationKinds: Object.freeze([
    vocabulary.operations.product,
    vocabulary.operations.quotient
  ]),
  motifUses: Object.freeze([Object.freeze({
    id: "exponential-power-crossover",
    motifId: vocabulary.motif,
    roleIds: Object.freeze(
      kpExponentialHomomorphismMotifSchema.roles.map(({ id }) => id)
    )
  })]),
  dependencyRecipeIds: Object.freeze([]),
  causalGrammarIds: Object.freeze([
    kpCanonicalHomomorphicCausalPhaseGrammar.id
  ])
} as const satisfies KpEquationRecipeRegistration);

export const kpExponentialHomomorphismMotifRegistration = Object.freeze({
  id: vocabulary.motif,
  familyId: vocabulary.family,
  schema: kpExponentialHomomorphismMotifSchema
} as const satisfies KpEquationMotifRegistration);

export const kpExponentialHomomorphismRendererCapabilityRegistration =
  Object.freeze({
    id: vocabulary.rendererCapability,
    motifIds: Object.freeze([vocabulary.motif])
  });

export function createKpExponentialHomomorphismEquationExtensionPack() {
  return composeKpEquationExtensionPack({
    id: kpExponentialHomomorphismEquationExtensionPackId,
    operations: createKpEquationOperationRegistry([
      kpExponentialSumToProductOperationRegistration,
      kpExponentialDifferenceToQuotientOperationRegistration
    ]),
    recipes: createKpEquationRecipeRegistry([
      kpExponentialHomomorphismRecipeRegistration
    ]),
    motifs: createKpEquationMotifRegistry([
      kpExponentialHomomorphismMotifRegistration
    ]),
    rendererCapabilities: createKpEquationRendererCapabilityRegistry([
      kpExponentialHomomorphismRendererCapabilityRegistration
    ]),
    families: createKpEquationFamilyRegistry([{
      id: vocabulary.family,
      disposition: "active",
      operationKindIds: [
        vocabulary.operations.product,
        vocabulary.operations.quotient
      ],
      recipeIds: [vocabulary.recipe],
      motifIds: [vocabulary.motif],
      rendererCapabilityIds: [vocabulary.rendererCapability]
    }])
  });
}

export const kpExponentialHomomorphismRecipePhaseIds = Object.freeze(
  kpCanonicalHomomorphicCausalPhaseGrammar.phases.map(({ id }) => id)
);
