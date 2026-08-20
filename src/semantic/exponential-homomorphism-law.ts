import {
  KP_HOMOMORPHIC_SEMANTIC_LAW_SCHEMA,
  defineKpHomomorphicSemanticLaw,
  type KpHomomorphicSemanticLaw
} from "../domain-ir/homomorphic-semantic-law.ts";

export const KP_EXPONENTIAL_SUM_TO_PRODUCT_LAW_ID =
  "law.exponential.sum-to-product" as const;

export const kpExponentialSumToProductLaw =
  defineKpExponentialSumToProductLaw({
    schemaVersion: KP_HOMOMORPHIC_SEMANTIC_LAW_SCHEMA,
    kind: "homomorphic-semantic-law",
    id: KP_EXPONENTIAL_SUM_TO_PRODUCT_LAW_ID,
    direction: "distribute-application",
    application: {
      kind: "power",
      sharedParameterRole: "role.exponential.shared-base",
      payloadRole: "role.exponential.ordered-exponent-operand"
    },
    sourceCombination: {
      kind: "sum",
      connectorRole: "role.exponential.source-additive-connector"
    },
    targetCombination: {
      kind: "product",
      connectorRole: "role.exponential.target-multiplicative-combination",
      applicationCardinality: "one-per-source-payload"
    },
    minimumPayloadCount: 2,
    domainAssumptionIds: [
      "assumption.exponential.base-positive-real",
      "assumption.exponential.exponents-real"
    ],
    invariants: [
      "ordered-payload-identity-persists",
      "derived-applications-are-successors-not-duplicates",
      "connector-law-does-not-imply-glyph-identity"
    ]
  });

export function defineKpExponentialSumToProductLaw(
  input: KpHomomorphicSemanticLaw
): KpHomomorphicSemanticLaw & Readonly<{
  id: typeof KP_EXPONENTIAL_SUM_TO_PRODUCT_LAW_ID;
  direction: "distribute-application";
}> {
  if (
    input.id !== KP_EXPONENTIAL_SUM_TO_PRODUCT_LAW_ID ||
    input.direction !== "distribute-application" ||
    input.application.kind !== "power" ||
    input.sourceCombination.kind !== "sum" ||
    input.targetCombination.kind !== "product" ||
    input.targetCombination.applicationCardinality !==
      "one-per-source-payload"
  ) {
    throw new Error(
      "The exponential sum law requires power application from an additive exponent to a product of successor applications."
    );
  }
  if (!input.domainAssumptionIds.includes(
    "assumption.exponential.base-positive-real"
  )) {
    throw new Error(
      "The bounded real exponential law requires a positive-real base assumption."
    );
  }
  return defineKpHomomorphicSemanticLaw(input) as
    KpHomomorphicSemanticLaw & Readonly<{
      id: typeof KP_EXPONENTIAL_SUM_TO_PRODUCT_LAW_ID;
      direction: "distribute-application";
    }>;
}
