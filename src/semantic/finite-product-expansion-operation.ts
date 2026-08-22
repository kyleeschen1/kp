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
import {
  deriveKpFiniteBinderExpansionKernel,
  type KpFiniteBinderExpansionKernelResult,
  type KpFiniteBinderSharedLineageEdge
} from "./finite-binder-expansion-kernel.ts";

export const KP_FINITE_PRODUCT_EXPAND_OPERATION = createKpOperationKind(
  "operation.equation.finite-product-expand.v1"
);

export type KpFiniteProductExpansionLineageEdge =
  | KpFiniteBinderSharedLineageEdge
  | Readonly<{
      sourceId: KpFiniteBinderSemanticId;
      targetId: KpFiniteBinderSemanticId;
      relation: "product-operator-establishes-adjacency";
      ordinal: number;
    }>;

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
 * Product connective topology remains local after shared instance derivation;
 * implicit adjacency must never acquire additive paint through the kernel.
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
  const shared = deriveKpFiniteBinderExpansionKernel({
    source,
    members: input.target.factors,
    scopeProof: input.scopeProof,
    rangeProof: input.rangeProof
  });
  if (shared.status !== "verified") return invalidFromKernel(shared);
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
  const instances = shared.kernel.instances;
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
  const lineage: KpFiniteProductExpansionLineageEdge[] = [
    ...shared.kernel.lineage
  ];
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
        instances,
        adjacencies
      },
      scopeProof: input.scopeProof,
      rangeProof: input.rangeProof,
      lineage,
      consumedSourceOccurrenceIds: shared.kernel.consumedSourceOccurrenceIds,
      identityPolicy: shared.kernel.identityPolicy,
      arithmeticPolicy:
        "describe-expansion-never-evaluate-product" as const
    }
  });
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

function invalidFromKernel(
  result: Extract<KpFiniteBinderExpansionKernelResult, {
    status: "invalid-expansion";
  }>
): KpFiniteProductExpansionOperationResult {
  const code = {
    "finite-binder-kernel.proof-mismatch":
      "finite-product-expansion.proof-mismatch",
    "finite-binder-kernel.member-count-mismatch":
      "finite-product-expansion.factor-count-mismatch",
    "finite-binder-kernel.member-order-mismatch":
      "finite-product-expansion.factor-order-mismatch",
    "finite-binder-kernel.body-template-mismatch":
      "finite-product-expansion.body-template-mismatch"
  } as const;
  return invalid(code[result.diagnostic.code], result.diagnostic.message);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
