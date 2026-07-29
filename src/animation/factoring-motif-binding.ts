import type {
  KpEquationTransitionLifecycleKind
} from "../domain-ir/public-api.ts";

export type KpFactoringContributorSelectorIds =
  readonly [string, string, ...string[]];

export interface KpFactorCommonTermMotifBinding {
  readonly kind: "factor-common-term-motif-binding";
  readonly id: string;
  readonly operation: "factorCommonTerm";
  readonly motif: "merge-fan-in";
  readonly direction: "forward" | "rewind";
  readonly relationRecordId: string;
  readonly lifecycle: "merge" | "split";
  readonly factorCopyIds: KpFactoringContributorSelectorIds;
  readonly commonFactorId: string;
  readonly contextCorrespondences: readonly {
    readonly recordId: string;
    readonly sourceSelectorId: string;
    readonly targetSelectorId: string;
  }[];
  // Parentheses belong to the structural beat, never to factor material or
  // coefficient continuants, so later renderers cannot merge them by accident.
  readonly structuralArtifactIds: readonly string[];
  readonly fusionPaintPolicy: "opaque-many-to-one";
  readonly synchronization: "simultaneous";
  readonly coefficientEvaluation: "deferred";
}

export interface KpFactorCommonTermMotifRelation {
  readonly recordId: string;
  readonly relation: string;
  readonly lifecycle: KpEquationTransitionLifecycleKind;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
}

export function compileKpFactorCommonTermMotifBinding(input: {
  readonly transitionId: string;
  readonly transformType: string;
  readonly motifKind?: string | undefined;
  readonly direction: "forward" | "rewind";
  readonly semanticStatus: "ready" | "fallback";
  readonly successorSynthesisCount: number;
  readonly relations: readonly KpFactorCommonTermMotifRelation[];
}): KpFactorCommonTermMotifBinding | undefined {
  if (input.transformType !== "factorCommonTerm") {
    return undefined;
  }
  if (input.semanticStatus !== "ready") {
    throw new Error(
      `Factoring transition ${input.transitionId} requires semantic lineage.`
    );
  }
  if (input.motifKind !== "merge-fan-in") {
    throw new Error(
      `Factoring transition ${input.transitionId} requires merge-fan-in.`
    );
  }
  if (input.successorSynthesisCount !== 0) {
    throw new Error(
      `Factoring transition ${input.transitionId} must defer coefficient evaluation.`
    );
  }

  const expectedLifecycle = input.direction === "forward" ? "merge" : "split";
  const fusionRelations = input.relations.filter(({ lifecycle }) =>
    lifecycle === "merge" || lifecycle === "split"
  );
  if (fusionRelations.length !== 1) {
    throw new Error(
      `Factoring transition ${input.transitionId} requires exactly one ` +
      "structural fusion lineage."
    );
  }
  const fusion = fusionRelations[0]!;
  const factorCopyIds = input.direction === "forward"
    ? fusion.sourceSelectorIds
    : fusion.targetSelectorIds;
  const commonFactorIds = input.direction === "forward"
    ? fusion.targetSelectorIds
    : fusion.sourceSelectorIds;
  if (
    fusion.relation !== "fan-in" ||
    fusion.lifecycle !== expectedLifecycle ||
    factorCopyIds.length < 2 ||
    commonFactorIds.length !== 1
  ) {
    throw new Error(
      `Factoring transition ${input.transitionId} has incoherent factor lineage.`
    );
  }

  const contextCorrespondences:
    KpFactorCommonTermMotifBinding["contextCorrespondences"][number][] = [];
  const structuralArtifactIds: string[] = [];
  for (const relation of input.relations) {
    if (relation.recordId === fusion.recordId) continue;
    // One-to-one persistence makes coefficient evaluation impossible inside
    // the factoring beat without teaching rendering what a coefficient is.
    if (
      relation.lifecycle === "persist" &&
      relation.sourceSelectorIds.length === 1 &&
      relation.targetSelectorIds.length === 1
    ) {
      contextCorrespondences.push({
        recordId: relation.recordId,
        sourceSelectorId: relation.sourceSelectorIds[0]!,
        targetSelectorId: relation.targetSelectorIds[0]!
      });
      continue;
    }
    if (
      (relation.lifecycle === "enter" &&
        relation.sourceSelectorIds.length === 0 &&
        relation.targetSelectorIds.length > 0) ||
      (relation.lifecycle === "exit" &&
        relation.sourceSelectorIds.length > 0 &&
        relation.targetSelectorIds.length === 0)
    ) {
      structuralArtifactIds.push(
        ...(relation.lifecycle === "enter"
          ? relation.targetSelectorIds
          : relation.sourceSelectorIds)
      );
      continue;
    }
    throw new Error(
      `Factoring transition ${input.transitionId} changes context in ` +
      `${relation.recordId}; coefficient evaluation must be a later beat.`
    );
  }

  return Object.freeze({
    kind: "factor-common-term-motif-binding" as const,
    id: `${input.transitionId}.factoring-choreography`,
    operation: "factorCommonTerm" as const,
    motif: "merge-fan-in" as const,
    direction: input.direction,
    relationRecordId: fusion.recordId,
    lifecycle: expectedLifecycle,
    factorCopyIds: Object.freeze([...factorCopyIds]) as
      KpFactoringContributorSelectorIds,
    commonFactorId: commonFactorIds[0]!,
    contextCorrespondences: Object.freeze(contextCorrespondences),
    structuralArtifactIds: Object.freeze(structuralArtifactIds),
    fusionPaintPolicy: "opaque-many-to-one" as const,
    synchronization: "simultaneous" as const,
    coefficientEvaluation: "deferred" as const
  });
}

export function assertKpFactorCommonTermMotifBinding(input: {
  readonly transitionId: string;
  readonly transformType: string;
  readonly motifKind?: string | undefined;
  readonly direction: "forward" | "rewind";
  readonly semanticStatus: "ready" | "fallback";
  readonly successorSynthesisCount: number;
  readonly relations: readonly KpFactorCommonTermMotifRelation[];
  readonly binding?: KpFactorCommonTermMotifBinding | undefined;
}): KpFactorCommonTermMotifBinding | undefined {
  const canonical = compileKpFactorCommonTermMotifBinding(input);
  if (canonical === undefined) {
    if (input.binding !== undefined) {
      throw new Error(
        `Non-factoring transition ${input.transitionId} carries a factoring binding.`
      );
    }
    return undefined;
  }
  if (
    input.binding === undefined ||
    !sameBinding(canonical, input.binding)
  ) {
    throw new Error(
      `Factoring transition ${input.transitionId} has a detached motif binding.`
    );
  }
  return input.binding;
}

function sameBinding(
  expected: KpFactorCommonTermMotifBinding,
  actual: KpFactorCommonTermMotifBinding
): boolean {
  return expected.kind === actual.kind &&
    expected.id === actual.id &&
    expected.operation === actual.operation &&
    expected.motif === actual.motif &&
    expected.direction === actual.direction &&
    expected.relationRecordId === actual.relationRecordId &&
    expected.lifecycle === actual.lifecycle &&
    expected.commonFactorId === actual.commonFactorId &&
    expected.fusionPaintPolicy === actual.fusionPaintPolicy &&
    expected.synchronization === actual.synchronization &&
    expected.coefficientEvaluation === actual.coefficientEvaluation &&
    sameValues(expected.factorCopyIds, actual.factorCopyIds) &&
    sameValues(
      expected.structuralArtifactIds,
      actual.structuralArtifactIds
    ) &&
    expected.contextCorrespondences.length ===
      actual.contextCorrespondences.length &&
    expected.contextCorrespondences.every((correspondence, index) => {
      const candidate = actual.contextCorrespondences[index];
      return candidate !== undefined &&
        candidate.recordId === correspondence.recordId &&
        candidate.sourceSelectorId === correspondence.sourceSelectorId &&
        candidate.targetSelectorId === correspondence.targetSelectorId;
    });
}

function sameValues(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}
