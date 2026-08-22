import {
  createKpFiniteBinderSemanticId,
  type KpFiniteBinderBodyInstance,
  type KpFiniteBinderSemanticId,
  type KpFiniteBinderSource
} from "../domain-ir/finite-binder-vocabulary.ts";
import type { KpVerifiedFiniteBinderRange } from
  "./finite-binder-range.ts";
import type { KpVerifiedFiniteBinderScope } from
  "./finite-binder-scope-proof.ts";

export const KP_FINITE_BINDER_EXPANSION_KERNEL_AUTHORITY =
  "semantic-operation.finite-binder-expansion-kernel.v1" as const;

export interface KpFiniteBinderExpansionMember {
  readonly ordinal: number;
  readonly indexValue: number;
  readonly bodySymbol: string;
}

export interface KpFiniteBinderSharedLineageEdge {
  readonly sourceId: KpFiniteBinderSemanticId;
  readonly targetId: KpFiniteBinderSemanticId;
  readonly relation:
    | "body-template-instantiates"
    | "bound-reference-substitutes-integer"
    | "lower-bound-materializes-reference"
    | "upper-bound-materializes-reference";
  readonly ordinal: number;
}

export interface KpVerifiedFiniteBinderExpansionKernel {
  readonly schemaVersion: "kp.finite-binder-expansion-kernel.v1";
  readonly kind: "finite-binder-expansion-kernel";
  readonly authority: typeof KP_FINITE_BINDER_EXPANSION_KERNEL_AUTHORITY;
  readonly instances: readonly [
    KpFiniteBinderBodyInstance,
    ...KpFiniteBinderBodyInstance[]
  ];
  readonly lineage: readonly KpFiniteBinderSharedLineageEdge[];
  readonly consumedSourceOccurrenceIds: readonly KpFiniteBinderSemanticId[];
  readonly identityPolicy: "derive-distinct-occurrences-never-clone-identity";
}

export type KpFiniteBinderExpansionKernelResult =
  | Readonly<{
      status: "verified";
      kernel: KpVerifiedFiniteBinderExpansionKernel;
    }>
  | Readonly<{
      status: "invalid-expansion";
      diagnostic: Readonly<{
        code:
          | "finite-binder-kernel.proof-mismatch"
          | "finite-binder-kernel.member-count-mismatch"
          | "finite-binder-kernel.member-order-mismatch"
          | "finite-binder-kernel.body-template-mismatch";
        message: string;
      }>;
    }>;

/**
 * This kernel owns only laws demonstrated by both sum and product pressure
 * callers. Connective topology stays outside so an operator cannot acquire
 * another operator's paint, arithmetic, or choreography through reuse.
 */
export function deriveKpFiniteBinderExpansionKernel(input: Readonly<{
  source: KpFiniteBinderSource;
  members: readonly KpFiniteBinderExpansionMember[];
  scopeProof: KpVerifiedFiniteBinderScope;
  rangeProof: KpVerifiedFiniteBinderRange;
}>): KpFiniteBinderExpansionKernelResult {
  const { source } = input;
  if (input.scopeProof.sourceId !== source.id ||
      input.rangeProof.sourceId !== source.id ||
      input.scopeProof.binderDeclarationId !== source.binder.id ||
      input.rangeProof.binderDeclarationId !== source.binder.id) {
    return invalid(
      "finite-binder-kernel.proof-mismatch",
      "Scope and range proofs must belong to the normalized source."
    );
  }
  if (input.members.length !== input.rangeProof.cardinality) {
    return invalid(
      "finite-binder-kernel.member-count-mismatch",
      "The expanded target must contain exactly one member per range value."
    );
  }
  const bodySymbol = source.body.freeSymbols[0];
  const sourceReference = source.body.references[0];
  if (bodySymbol === undefined || source.body.freeSymbols.length !== 1 ||
      sourceReference === undefined || source.body.references.length !== 1 ||
      input.members.some((member) => member.bodySymbol !== bodySymbol)) {
    return invalid(
      "finite-binder-kernel.body-template-mismatch",
      "Every target member must instantiate the one-reference source body."
    );
  }
  if (input.members.some((member, ordinal) =>
    member.ordinal !== ordinal ||
    member.indexValue !== input.rangeProof.values[ordinal]
  )) {
    return invalid(
      "finite-binder-kernel.member-order-mismatch",
      "Target indices must match the verified inclusive range in order."
    );
  }
  const instances = input.members.map((member) => {
    const namespace =
      `${source.id}.instance.${integerIdPart(member.indexValue)}.${member.ordinal}`;
    return {
      id: createKpFiniteBinderSemanticId(namespace),
      role: "body-instance" as const,
      ordinal: member.ordinal,
      indexValue: member.indexValue,
      derivedFrom: source.body.id,
      references: [{
        id: createKpFiniteBinderSemanticId(`${namespace}.reference`),
        role: "instantiated-reference" as const,
        value: member.indexValue,
        derivedFrom: sourceReference.id,
        boundBy: source.binder.id
      }]
    };
  });
  const [firstInstance, ...remainingInstances] = instances;
  if (firstInstance === undefined) {
    return invalid(
      "finite-binder-kernel.member-count-mismatch",
      "Expansion requires at least one target member."
    );
  }
  const lineage: KpFiniteBinderSharedLineageEdge[] = [];
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
  const lastInstance = instances.at(-1)!;
  lineage.push({
    sourceId: source.lowerBound.id,
    targetId: firstInstance.references[0]!.id,
    relation: "lower-bound-materializes-reference",
    ordinal: 0
  }, {
    sourceId: source.upperBound.id,
    targetId: lastInstance.references[0]!.id,
    relation: "upper-bound-materializes-reference",
    ordinal: lastInstance.ordinal
  });
  return deepFreeze({
    status: "verified" as const,
    kernel: {
      schemaVersion: "kp.finite-binder-expansion-kernel.v1" as const,
      kind: "finite-binder-expansion-kernel" as const,
      authority: KP_FINITE_BINDER_EXPANSION_KERNEL_AUTHORITY,
      instances: [firstInstance, ...remainingInstances],
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
        "derive-distinct-occurrences-never-clone-identity" as const
    }
  });
}

function integerIdPart(value: number): string {
  return value < 0 ? `neg-${Math.abs(value)}` : String(value);
}

function invalid(
  code: Extract<KpFiniteBinderExpansionKernelResult, {
    status: "invalid-expansion";
  }>["diagnostic"]["code"],
  message: string
): KpFiniteBinderExpansionKernelResult {
  return deepFreeze({
    status: "invalid-expansion" as const,
    diagnostic: { code, message }
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
