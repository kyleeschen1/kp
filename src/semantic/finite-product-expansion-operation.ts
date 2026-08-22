import {
  createKpFiniteBinderSemanticId,
  type KpFiniteBinderBodyInstance,
  type KpFiniteBinderSemanticId
} from "../domain-ir/finite-binder-vocabulary.ts";
import { createKpOperationKind } from
  "../domain-ir/equation-motion-vocabulary.ts";
import type { KpVerifiedFiniteBinderRange } from
  "./finite-binder-range.ts";
import type { KpVerifiedFiniteBinderScope } from
  "./finite-binder-scope-proof.ts";
import type {
  KpNormalizedFiniteProductSourceEndpoint,
  KpNormalizedFiniteProductTargetEndpoint
} from "./finite-product-endpoint-normalizer.ts";

export const KP_FINITE_PRODUCT_EXPAND_OPERATION = createKpOperationKind(
  "operation.equation.finite-product-expand.v1"
);

export interface KpFiniteProductExpansionLineageEdge {
  readonly sourceId: KpFiniteBinderSemanticId;
  readonly targetId: KpFiniteBinderSemanticId;
  readonly relation:
    | "body-template-instantiates"
    | "bound-reference-substitutes-integer"
    | "lower-bound-materializes-reference"
    | "upper-bound-materializes-reference"
    | "product-operator-establishes-adjacency";
  readonly ordinal: number;
}

export interface KpFiniteProductTargetAdjacency {
  readonly id: KpFiniteBinderSemanticId;
  readonly role: "implicit-multiplicative-adjacency";
  readonly ordinal: number;
  readonly betweenInstanceIds: readonly [
    KpFiniteBinderSemanticId,
    KpFiniteBinderSemanticId
  ];
  readonly paintPolicy: "no-explicit-connector-glyph";
}

export interface KpVerifiedFiniteProductExpansionOperation {
  readonly schemaVersion: "kp.finite-product-expansion-operation.v1";
  readonly kind: "finite-product-expansion-operation";
  readonly operation: typeof KP_FINITE_PRODUCT_EXPAND_OPERATION;
  readonly source: KpNormalizedFiniteProductSourceEndpoint;
  readonly target: Readonly<{
    endpoint: KpNormalizedFiniteProductTargetEndpoint;
    instances: readonly [
      KpFiniteBinderBodyInstance,
      ...KpFiniteBinderBodyInstance[]
    ];
    adjacencies: readonly KpFiniteProductTargetAdjacency[];
  }>;
  readonly scopeProof: KpVerifiedFiniteBinderScope;
  readonly rangeProof: KpVerifiedFiniteBinderRange;
  readonly lineage: readonly KpFiniteProductExpansionLineageEdge[];
  readonly consumedSourceOccurrenceIds: readonly KpFiniteBinderSemanticId[];
  readonly identityPolicy: "derive-distinct-occurrences-never-clone-identity";
  readonly arithmeticPolicy: "describe-expansion-never-evaluate-product";
}

export type KpFiniteProductExpansionOperationResult =
  | Readonly<{
      status: "verified";
      operation: KpVerifiedFiniteProductExpansionOperation;
    }>
  | Readonly<{
      status: "invalid-expansion";
      diagnostic: Readonly<{
        code:
          | "finite-product-expansion.proof-mismatch"
          | "finite-product-expansion.operator-mismatch"
          | "finite-product-expansion.factor-count-mismatch"
          | "finite-product-expansion.factor-order-mismatch"
          | "finite-product-expansion.body-template-mismatch"
          | "finite-product-expansion.adjacency-mismatch";
        message: string;
        repair: string;
      }>;
    }>;

/**
 * This caller deliberately remains product-owned through the pressure slice.
 * Its shape mirrors only the semantic laws under test; extraction into shared
 * binder machinery waits for the explicit cross-caller promotion slice.
 */
export function defineKpFiniteProductExpansionOperation(input: Readonly<{
  source: KpNormalizedFiniteProductSourceEndpoint;
  target: KpNormalizedFiniteProductTargetEndpoint;
  scopeProof: KpVerifiedFiniteBinderScope;
  rangeProof: KpVerifiedFiniteBinderRange;
}>): KpFiniteProductExpansionOperationResult {
  const source = input.source.semantic;
  if (source.operator.operator !== "product") {
    return invalid(
      "finite-product-expansion.operator-mismatch",
      "Finite-product pressure requires a product operator source."
    );
  }
  if (input.scopeProof.sourceId !== source.id ||
      input.rangeProof.sourceId !== source.id ||
      input.scopeProof.binderDeclarationId !== source.binder.id ||
      input.rangeProof.binderDeclarationId !== source.binder.id) {
    return invalid(
      "finite-product-expansion.proof-mismatch",
      "Scope and range proofs must belong to the normalized product source."
    );
  }
  if (input.target.factors.length !== input.rangeProof.cardinality) {
    return invalid(
      "finite-product-expansion.factor-count-mismatch",
      "The expanded target must contain exactly one factor per range value."
    );
  }
  const bodySymbol = source.body.freeSymbols[0];
  if (bodySymbol === undefined || source.body.freeSymbols.length !== 1 ||
      input.target.factors.some((factor) =>
        factor.bodySymbol !== bodySymbol
      )) {
    return invalid(
      "finite-product-expansion.body-template-mismatch",
      "Every target factor must instantiate the source body template."
    );
  }
  if (input.target.factors.some((factor, ordinal) =>
    factor.ordinal !== ordinal ||
    factor.indexValue !== input.rangeProof.values[ordinal]
  )) {
    return invalid(
      "finite-product-expansion.factor-order-mismatch",
      "Target indices must match the verified inclusive range in order."
    );
  }
  if (input.target.adjacencies.length !== input.target.factors.length - 1 ||
      input.target.adjacencies.some((adjacency, ordinal) =>
        adjacency.ordinal !== ordinal ||
        adjacency.betweenFactorOrdinals[0] !== ordinal ||
        adjacency.betweenFactorOrdinals[1] !== ordinal + 1 ||
        adjacency.rawLatex !== ""
      )) {
    return invalid(
      "finite-product-expansion.adjacency-mismatch",
      "Implicit product adjacency must connect each ordered factor pair exactly once."
    );
  }
  const sourceReference = source.body.references[0];
  if (sourceReference === undefined || source.body.references.length !== 1) {
    return invalid(
      "finite-product-expansion.body-template-mismatch",
      "The product pressure operation requires one direct binder reference."
    );
  }
  const instances = input.target.factors.map((factor) => {
    const namespace =
      `${source.id}.instance.${integerIdPart(factor.indexValue)}.${factor.ordinal}`;
    return {
      id: createKpFiniteBinderSemanticId(namespace),
      role: "body-instance" as const,
      ordinal: factor.ordinal,
      indexValue: factor.indexValue,
      derivedFrom: source.body.id,
      references: [{
        id: createKpFiniteBinderSemanticId(`${namespace}.reference`),
        role: "instantiated-reference" as const,
        value: factor.indexValue,
        derivedFrom: sourceReference.id,
        boundBy: source.binder.id
      }]
    };
  });
  const [firstInstance, ...remainingInstances] = instances;
  if (firstInstance === undefined) {
    return invalid(
      "finite-product-expansion.factor-count-mismatch",
      "Expansion requires at least one target factor."
    );
  }
  const adjacencies = input.target.adjacencies.map((adjacency) => ({
    id: createKpFiniteBinderSemanticId(
      `${source.id}.adjacency.${adjacency.ordinal}`
    ),
    role: "implicit-multiplicative-adjacency" as const,
    ordinal: adjacency.ordinal,
    betweenInstanceIds: [
      instances[adjacency.betweenFactorOrdinals[0]]!.id,
      instances[adjacency.betweenFactorOrdinals[1]]!.id
    ] as const,
    paintPolicy: "no-explicit-connector-glyph" as const
  }));
  const lineage: KpFiniteProductExpansionLineageEdge[] = [];
  for (const instance of instances) {
    lineage.push({
      sourceId: source.body.id,
      targetId: instance.id,
      relation: "body-template-instantiates",
      ordinal: instance.ordinal
    }, {
      sourceId: sourceReference.id,
      targetId: instance.references[0]!.id,
      relation: "bound-reference-substitutes-integer",
      ordinal: instance.ordinal
    });
  }
  const firstReference = instances[0]!.references[0]!;
  const lastInstance = instances.at(-1)!;
  lineage.push({
    sourceId: source.lowerBound.id,
    targetId: firstReference.id,
    relation: "lower-bound-materializes-reference",
    ordinal: 0
  }, {
    sourceId: source.upperBound.id,
    targetId: lastInstance.references[0]!.id,
    relation: "upper-bound-materializes-reference",
    ordinal: lastInstance.ordinal
  });
  for (const adjacency of adjacencies) {
    lineage.push({
      sourceId: source.operator.id,
      targetId: adjacency.id,
      relation: "product-operator-establishes-adjacency",
      ordinal: adjacency.ordinal
    });
  }
  return deepFreeze({
    status: "verified" as const,
    operation: {
      schemaVersion: "kp.finite-product-expansion-operation.v1" as const,
      kind: "finite-product-expansion-operation" as const,
      operation: KP_FINITE_PRODUCT_EXPAND_OPERATION,
      source: input.source,
      target: {
        endpoint: input.target,
        instances: [firstInstance, ...remainingInstances],
        adjacencies
      },
      scopeProof: input.scopeProof,
      rangeProof: input.rangeProof,
      lineage,
      consumedSourceOccurrenceIds: [
        source.operator.id,
        source.binder.id,
        source.lowerBound.id,
        source.upperBound.id,
        source.body.id,
        sourceReference.id
      ],
      identityPolicy:
        "derive-distinct-occurrences-never-clone-identity" as const,
      arithmeticPolicy:
        "describe-expansion-never-evaluate-product" as const
    }
  });
}

function integerIdPart(value: number): string {
  return value < 0 ? `neg-${Math.abs(value)}` : String(value);
}

function invalid(
  code: Extract<KpFiniteProductExpansionOperationResult, {
    status: "invalid-expansion";
  }>["diagnostic"]["code"],
  message: string
): KpFiniteProductExpansionOperationResult {
  return deepFreeze({
    status: "invalid-expansion" as const,
    diagnostic: {
      code,
      message,
      repair:
        "Regenerate the product target directly from the verified source scope and finite range."
    }
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
