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
  KpNormalizedFiniteSumSourceEndpoint,
  KpNormalizedFiniteSumTargetEndpoint
} from "./finite-sum-endpoint-normalizer.ts";
import {
  deriveKpFiniteBinderExpansionKernel,
  type KpFiniteBinderExpansionKernelResult,
  type KpFiniteBinderSharedLineageEdge
} from "./finite-binder-expansion-kernel.ts";

export const KP_FINITE_BINDER_EXPAND_OPERATION = createKpOperationKind(
  "operation.equation.finite-binder-expand.v1"
);

export type KpFiniteBinderExpansionLineageEdge =
  | KpFiniteBinderSharedLineageEdge
  | Readonly<{
      sourceId: KpFiniteBinderSemanticId;
      targetId: KpFiniteBinderSemanticId;
      relation: "operator-introduces-connector";
      ordinal: number;
    }>;

export interface KpFiniteBinderTargetConnector {
  readonly id: KpFiniteBinderSemanticId;
  readonly role: "additive-connector";
  readonly ordinal: number;
  readonly rawLatex: "+";
}

export interface KpVerifiedFiniteBinderExpansionOperation {
  readonly schemaVersion: "kp.finite-binder-expansion-operation.v1";
  readonly kind: "finite-binder-expansion-operation";
  readonly operation: typeof KP_FINITE_BINDER_EXPAND_OPERATION;
  readonly source: KpNormalizedFiniteSumSourceEndpoint;
  readonly target: Readonly<{
    endpoint: KpNormalizedFiniteSumTargetEndpoint;
    instances: readonly [KpFiniteBinderBodyInstance,
      ...KpFiniteBinderBodyInstance[]];
    connectors: readonly KpFiniteBinderTargetConnector[];
  }>;
  readonly scopeProof: KpVerifiedFiniteBinderScope;
  readonly rangeProof: KpVerifiedFiniteBinderRange;
  readonly lineage: readonly KpFiniteBinderExpansionLineageEdge[];
  readonly consumedSourceOccurrenceIds: readonly KpFiniteBinderSemanticId[];
  readonly identityPolicy: "derive-distinct-occurrences-never-clone-identity";
}

export type KpFiniteBinderExpansionOperationResult =
  | Readonly<{
      status: "verified";
      operation: KpVerifiedFiniteBinderExpansionOperation;
    }>
  | Readonly<{
      status: "invalid-expansion";
      diagnostic: Readonly<{
        code:
          | "finite-binder-expansion.proof-mismatch"
          | "finite-binder-expansion.term-count-mismatch"
          | "finite-binder-expansion.term-order-mismatch"
          | "finite-binder-expansion.body-template-mismatch";
        message: string;
        repair: string;
      }>;
    }>;

/**
 * One source template derives many target occurrences. None of those targets
 * inherit the template's semantic id; this prevents presentation layers from
 * painting a single source glyph as if it persisted into several positions.
 */
export function defineKpFiniteBinderExpansionOperation(input: Readonly<{
  source: KpNormalizedFiniteSumSourceEndpoint;
  target: KpNormalizedFiniteSumTargetEndpoint;
  scopeProof: KpVerifiedFiniteBinderScope;
  rangeProof: KpVerifiedFiniteBinderRange;
}>): KpFiniteBinderExpansionOperationResult {
  const source = input.source.semantic;
  const shared = deriveKpFiniteBinderExpansionKernel({
    source,
    members: input.target.terms,
    scopeProof: input.scopeProof,
    rangeProof: input.rangeProof
  });
  if (shared.status !== "verified") return invalidFromKernel(shared);
  const instances = shared.kernel.instances;
  const connectors = input.target.connectors.map((connector) => ({
    id: createKpFiniteBinderSemanticId(
      `${source.id}.connector.${connector.ordinal}`
    ),
    role: "additive-connector" as const,
    ordinal: connector.ordinal,
    rawLatex: connector.rawLatex
  }));
  const lineage: KpFiniteBinderExpansionLineageEdge[] = [
    ...shared.kernel.lineage
  ];
  for (const connector of connectors) {
    lineage.push({
      sourceId: source.operator.id,
      targetId: connector.id,
      relation: "operator-introduces-connector",
      ordinal: connector.ordinal
    });
  }
  return deepFreeze({
    status: "verified" as const,
    operation: {
      schemaVersion: "kp.finite-binder-expansion-operation.v1" as const,
      kind: "finite-binder-expansion-operation" as const,
      operation: KP_FINITE_BINDER_EXPAND_OPERATION,
      source: input.source,
      target: {
        endpoint: input.target,
        instances,
        connectors
      },
      scopeProof: input.scopeProof,
      rangeProof: input.rangeProof,
      lineage,
      consumedSourceOccurrenceIds: shared.kernel.consumedSourceOccurrenceIds,
      identityPolicy: shared.kernel.identityPolicy
    }
  });
}

function invalid(
  code: Extract<KpFiniteBinderExpansionOperationResult, {
    status: "invalid-expansion";
  }>["diagnostic"]["code"],
  message: string
): KpFiniteBinderExpansionOperationResult {
  return deepFreeze({
    status: "invalid-expansion" as const,
    diagnostic: {
      code,
      message,
      repair:
        "Regenerate the target directly from the verified source scope and finite range."
    }
  });
}

function invalidFromKernel(
  result: Extract<KpFiniteBinderExpansionKernelResult, {
    status: "invalid-expansion";
  }>
): KpFiniteBinderExpansionOperationResult {
  const code = {
    "finite-binder-kernel.proof-mismatch":
      "finite-binder-expansion.proof-mismatch",
    "finite-binder-kernel.member-count-mismatch":
      "finite-binder-expansion.term-count-mismatch",
    "finite-binder-kernel.member-order-mismatch":
      "finite-binder-expansion.term-order-mismatch",
    "finite-binder-kernel.body-template-mismatch":
      "finite-binder-expansion.body-template-mismatch"
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
