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

export const KP_FINITE_BINDER_EXPAND_OPERATION = createKpOperationKind(
  "operation.equation.finite-binder-expand.v1"
);

export interface KpFiniteBinderExpansionLineageEdge {
  readonly sourceId: KpFiniteBinderSemanticId;
  readonly targetId: KpFiniteBinderSemanticId;
  readonly relation:
    | "body-template-instantiates"
    | "bound-reference-substitutes-integer"
    | "operator-introduces-connector";
  readonly ordinal: number;
}

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
  if (input.scopeProof.sourceId !== source.id ||
      input.rangeProof.sourceId !== source.id ||
      input.scopeProof.binderDeclarationId !== source.binder.id ||
      input.rangeProof.binderDeclarationId !== source.binder.id) {
    return invalid(
      "finite-binder-expansion.proof-mismatch",
      "Scope and range proofs must belong to the normalized source."
    );
  }
  if (input.target.terms.length !== input.rangeProof.cardinality) {
    return invalid(
      "finite-binder-expansion.term-count-mismatch",
      "The expanded target must contain exactly one term per range value."
    );
  }
  const bodySymbol = source.body.freeSymbols[0];
  if (bodySymbol === undefined || source.body.freeSymbols.length !== 1 ||
      input.target.terms.some((term) => term.bodySymbol !== bodySymbol)) {
    return invalid(
      "finite-binder-expansion.body-template-mismatch",
      "Every target term must instantiate the source body template."
    );
  }
  if (input.target.terms.some((term, ordinal) =>
    term.ordinal !== ordinal ||
    term.indexValue !== input.rangeProof.values[ordinal]
  )) {
    return invalid(
      "finite-binder-expansion.term-order-mismatch",
      "Target indices must match the verified inclusive range in order."
    );
  }
  const sourceReference = source.body.references[0];
  if (sourceReference === undefined || source.body.references.length !== 1) {
    return invalid(
      "finite-binder-expansion.body-template-mismatch",
      "The current expansion operation requires one direct binder reference."
    );
  }
  const instances = input.target.terms.map((term) => {
    const namespace = `${source.id}.instance.${integerIdPart(term.indexValue)}.${term.ordinal}`;
    return {
      id: createKpFiniteBinderSemanticId(namespace),
      role: "body-instance" as const,
      ordinal: term.ordinal,
      indexValue: term.indexValue,
      derivedFrom: source.body.id,
      references: [{
        id: createKpFiniteBinderSemanticId(`${namespace}.reference`),
        role: "instantiated-reference" as const,
        value: term.indexValue,
        derivedFrom: sourceReference.id,
        boundBy: source.binder.id
      }]
    };
  });
  const [firstInstance, ...remainingInstances] = instances;
  if (firstInstance === undefined) {
    return invalid(
      "finite-binder-expansion.term-count-mismatch",
      "Expansion requires at least one target instance."
    );
  }
  const connectors = input.target.connectors.map((connector) => ({
    id: createKpFiniteBinderSemanticId(
      `${source.id}.connector.${connector.ordinal}`
    ),
    role: "additive-connector" as const,
    ordinal: connector.ordinal,
    rawLatex: connector.rawLatex
  }));
  const lineage: KpFiniteBinderExpansionLineageEdge[] = [];
  for (const instance of instances) {
    lineage.push({
      sourceId: source.body.id,
      targetId: instance.id,
      relation: "body-template-instantiates",
      ordinal: instance.ordinal
    });
    lineage.push({
      sourceId: sourceReference.id,
      targetId: instance.references[0]!.id,
      relation: "bound-reference-substitutes-integer",
      ordinal: instance.ordinal
    });
  }
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
        instances: [firstInstance, ...remainingInstances],
        connectors
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
      identityPolicy: "derive-distinct-occurrences-never-clone-identity" as const
    }
  });
}

function integerIdPart(value: number): string {
  return value < 0 ? `neg-${Math.abs(value)}` : String(value);
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

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
