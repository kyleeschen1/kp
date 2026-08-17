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
  kpHomomorphicCrossoverEquationVocabulary,
  kpHomomorphicCrossoverMotifSchema
} from "../homomorphic-crossover-motif.ts";

const vocabulary = kpHomomorphicCrossoverEquationVocabulary;

export const kpHomomorphicCrossoverEquationExtensionPackId =
  "equation-pack.homomorphic-crossover.v1";

export const kpLogProductHomomorphicOperationRegistration = Object.freeze({
  id: vocabulary.operations.product,
  familyId: vocabulary.family,
  recipeIds: Object.freeze([vocabulary.recipe]),
  semanticAuthorityIds: Object.freeze(["law.logarithm.product"])
} as const satisfies KpEquationOperationRegistration);

export const kpLogQuotientHomomorphicOperationRegistration = Object.freeze({
  id: vocabulary.operations.quotient,
  familyId: vocabulary.family,
  recipeIds: Object.freeze([vocabulary.recipe]),
  semanticAuthorityIds: Object.freeze(["law.logarithm.quotient"])
} as const satisfies KpEquationOperationRegistration);

export const kpHomomorphicCrossoverRecipeRegistration = Object.freeze({
  id: vocabulary.recipe,
  familyId: vocabulary.family,
  operationKinds: Object.freeze([
    vocabulary.operations.product,
    vocabulary.operations.quotient
  ]),
  motifUses: Object.freeze([Object.freeze({
    id: "homomorphic-crossover",
    motifId: vocabulary.motif,
    roleIds: Object.freeze(
      kpHomomorphicCrossoverMotifSchema.roles.map(({ id }) => id)
    )
  })]),
  dependencyRecipeIds: Object.freeze([]),
  causalGrammarIds: Object.freeze([
    kpCanonicalHomomorphicCausalPhaseGrammar.id
  ])
} as const satisfies KpEquationRecipeRegistration);

export const kpHomomorphicCrossoverMotifRegistration = Object.freeze({
  id: vocabulary.motif,
  familyId: vocabulary.family,
  schema: kpHomomorphicCrossoverMotifSchema
} as const satisfies KpEquationMotifRegistration);

export const kpHomomorphicCrossoverRendererCapabilityRegistration =
  Object.freeze({
    id: vocabulary.rendererCapability,
    motifIds: Object.freeze([vocabulary.motif])
  });

export function createKpHomomorphicCrossoverEquationExtensionPack() {
  return composeKpEquationExtensionPack({
    id: kpHomomorphicCrossoverEquationExtensionPackId,
    operations: createKpEquationOperationRegistry([
      kpLogProductHomomorphicOperationRegistration,
      kpLogQuotientHomomorphicOperationRegistration
    ]),
    recipes: createKpEquationRecipeRegistry([
      kpHomomorphicCrossoverRecipeRegistration
    ]),
    motifs: createKpEquationMotifRegistry([
      kpHomomorphicCrossoverMotifRegistration
    ]),
    rendererCapabilities: createKpEquationRendererCapabilityRegistry([
      kpHomomorphicCrossoverRendererCapabilityRegistration
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

export const kpHomomorphicCrossoverRecipePhaseIds = Object.freeze(
  kpCanonicalHomomorphicCausalPhaseGrammar.phases.map(({ id }) => id)
);
