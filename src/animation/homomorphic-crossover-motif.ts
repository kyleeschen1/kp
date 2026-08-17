import {
  createKpFamilyId,
  createKpMotifId,
  createKpOperationKind,
  createKpRecipeId,
  createKpRendererCapabilityId
} from "../domain-ir/equation-motion-vocabulary.ts";
import { defineKpMotifSchema } from
  "../domain-ir/equation-motif-invocation.ts";

/**
 * Package-local vocabulary keeps the core ID parser open to new families.
 * The extension pack, rather than a central switch, owns these declarations.
 */
export const kpHomomorphicCrossoverEquationVocabulary = Object.freeze({
  family: createKpFamilyId("family.equation.log-homomorphism.v1"),
  recipe: createKpRecipeId(
    "recipe.equation.homomorphic-decomposition.v1"
  ),
  motif: createKpMotifId("motif.homomorphic-crossover.v1"),
  operations: Object.freeze({
    product: createKpOperationKind(
      "operation.equation.log-product-decomposition.v1"
    ),
    quotient: createKpOperationKind(
      "operation.equation.log-quotient-fusion.v1"
    )
  }),
  rendererCapability: createKpRendererCapabilityId(
    "renderer-capability.equation.homomorphic-crossover.v1"
  )
});

const vocabulary = kpHomomorphicCrossoverEquationVocabulary;

export const kpHomomorphicCrossoverMotifSchema = defineKpMotifSchema({
  id: vocabulary.motif,
  familyId: vocabulary.family,
  operationKinds: [
    vocabulary.operations.product,
    vocabulary.operations.quotient
  ],
  roles: [
    role("source-applications", "one-or-more", "syntax"),
    role("source-payloads", "one-or-more", "continuant"),
    role("source-enclosures", "one-or-more", "enclosure"),
    role("source-connector", "exactly-one", "connector"),
    role("target-applications", "one-or-more", "syntax"),
    role("target-payloads", "one-or-more", "continuant"),
    role("target-enclosures", "one-or-more", "enclosure"),
    role("target-connectors", "one-or-more", "connector")
  ],
  requiredRendererCapabilityIds: [vocabulary.rendererCapability]
});

export const kpHomomorphicCrossoverMotifDefinition = Object.freeze({
  id: vocabulary.motif,
  familyId: vocabulary.family,
  schema: kpHomomorphicCrossoverMotifSchema
});

export const kpHomomorphicCrossoverRendererCapabilityDefinition =
  Object.freeze({
    id: vocabulary.rendererCapability,
    motifId: vocabulary.motif,
    rendererNeutral: true as const
  });

function role(
  id: string,
  cardinality: "exactly-one" | "one-or-more",
  materialKind: "syntax" | "continuant" | "enclosure" | "connector"
) {
  return Object.freeze({ id, cardinality, materialKind });
}
