import {
  createKpFamilyId,
  createKpMotifId,
  createKpOperationKind,
  createKpRecipeId,
  createKpRendererCapabilityId
} from "../domain-ir/equation-motion-vocabulary.ts";
import { defineKpMotifSchema } from
  "../domain-ir/equation-motif-invocation.ts";

export const kpExponentialHomomorphismEquationVocabulary = Object.freeze({
  family: createKpFamilyId(
    "family.equation.exponential-homomorphism.v1"
  ),
  operation: createKpOperationKind(
    "operation.equation.exponential-sum-to-product.v1"
  ),
  operations: Object.freeze({
    product: createKpOperationKind(
      "operation.equation.exponential-sum-to-product.v1"
    ),
    quotient: createKpOperationKind(
      "operation.equation.exponential-difference-to-quotient.v1"
    )
  }),
  recipe: createKpRecipeId(
    "recipe.equation.exponential-homomorphism.v1"
  ),
  motif: createKpMotifId("motif.exponential-power-crossover.v1"),
  rendererCapability: createKpRendererCapabilityId(
    "renderer-capability.equation.exponential-power-crossover.v1"
  )
});

const vocabulary = kpExponentialHomomorphismEquationVocabulary;

export const kpExponentialHomomorphismMotifSchema = defineKpMotifSchema({
  id: vocabulary.motif,
  familyId: vocabulary.family,
  operationKinds: [
    vocabulary.operations.product,
    vocabulary.operations.quotient
  ],
  roles: [
    role("source-power-application", "exactly-one", "syntax"),
    role("source-base", "exactly-one", "continuant"),
    role("source-exponent-payloads", "one-or-more", "continuant"),
    role("source-superscript-region", "exactly-one", "enclosure"),
    role("source-connectors", "one-or-more", "connector"),
    role("target-power-applications", "one-or-more", "syntax"),
    role("target-bases", "one-or-more", "continuant"),
    role("target-exponent-payloads", "one-or-more", "continuant"),
    role("target-superscript-regions", "one-or-more", "enclosure"),
    role("target-connectors", "one-or-more", "connector"),
    role("target-combination", "exactly-one", "syntax")
  ],
  requiredRendererCapabilityIds: [vocabulary.rendererCapability]
});

export const kpExponentialHomomorphismMotifDefinition = Object.freeze({
  id: vocabulary.motif,
  familyId: vocabulary.family,
  schema: kpExponentialHomomorphismMotifSchema
});

export const kpExponentialPowerCrossoverRendererCapabilityDefinition =
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
