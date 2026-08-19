export interface KpEquationSeriesVerifiedSemanticContract {
  readonly kind: string;
  readonly authority: unknown;
}

export interface KpEquationSeriesVerifiedAdjacencyEvidence {
  readonly adjacencyId: string;
  readonly fromStateId: string;
  readonly toStateId: string;
  readonly correspondenceIds: readonly string[];
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
}

/**
 * Tool-neutral source pin shared by governed equation families. Specialized
 * validators must still recognize the branded contract they consume; this
 * envelope cannot mint semantic authority by itself.
 */
export interface KpEquationSeriesVerifiedSemanticSource {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly operationIds: readonly string[];
  readonly entityIds: readonly string[];
  readonly assumptionEvidenceIds: readonly string[];
  readonly semanticContracts?:
    readonly KpEquationSeriesVerifiedSemanticContract[] | undefined;
  readonly adjacencyEvidence?:
    readonly KpEquationSeriesVerifiedAdjacencyEvidence[] | undefined;
}

export interface KpEquationSeriesGovernedSourceRequirement {
  readonly sourcePin: Readonly<{
    sourceId: string;
    revisionId: string;
  }>;
  readonly operationId: string;
  readonly requiredEntityIds?: readonly string[] | undefined;
  readonly requiredAssumptionEvidenceIds?: readonly string[] | undefined;
  readonly requiredSemanticContractKinds?: readonly string[] | undefined;
  readonly requiredAdjacency?: Readonly<{
    readonly adjacencyId: string;
    readonly fromStateId: string;
    readonly toStateId: string;
  }> | undefined;
  readonly requiredCorrespondenceIds?: readonly string[] | undefined;
}

export type KpEquationSeriesGovernedSourceResolution =
  | Readonly<{
      readonly status: "resolved";
      readonly source: KpEquationSeriesVerifiedSemanticSource;
    }>
  | Readonly<{
      readonly status:
        | "missing-source"
        | "revision-mismatch"
        | "ambiguous-source"
        | "operation-unavailable"
        | "entities-unavailable"
        | "evidence-unavailable"
        | "contracts-unavailable"
        | "adjacency-unavailable"
        | "correspondences-unavailable";
      readonly sourceId: string;
      readonly revisionId: string;
      readonly missingIds: readonly string[];
    }>;

/**
 * This resolver selects available evidence; it never verifies or constructs
 * semantic truth. Family validators still authenticate branded contracts.
 */
export function resolveKpEquationSeriesGovernedSource(input: {
  readonly requirement: KpEquationSeriesGovernedSourceRequirement;
  readonly sources: readonly KpEquationSeriesVerifiedSemanticSource[];
}): KpEquationSeriesGovernedSourceResolution {
  const sourceIdMatches = input.sources.filter(({ sourceId }) =>
    sourceId === input.requirement.sourcePin.sourceId
  );
  if (sourceIdMatches.length === 0) return unavailable(
    "missing-source",
    input.requirement,
    [input.requirement.sourcePin.sourceId]
  );
  const exactMatches = sourceIdMatches.filter(({ revisionId }) =>
    revisionId === input.requirement.sourcePin.revisionId
  );
  if (exactMatches.length === 0) return unavailable(
    "revision-mismatch",
    input.requirement,
    sourceIdMatches.map(({ revisionId }) => revisionId)
  );
  if (exactMatches.length > 1) return unavailable(
    "ambiguous-source",
    input.requirement,
    exactMatches.map(({ sourceId, revisionId }) => `${sourceId}@${revisionId}`)
  );
  const source = exactMatches[0]!;
  if (!source.operationIds.includes(input.requirement.operationId)) {
    return unavailable(
      "operation-unavailable",
      input.requirement,
      [input.requirement.operationId]
    );
  }
  const missingEntities = missing(
    input.requirement.requiredEntityIds ?? [],
    source.entityIds
  );
  if (missingEntities.length > 0) return unavailable(
    "entities-unavailable",
    input.requirement,
    missingEntities
  );
  const missingEvidence = missing(
    input.requirement.requiredAssumptionEvidenceIds ?? [],
    source.assumptionEvidenceIds
  );
  if (missingEvidence.length > 0) return unavailable(
    "evidence-unavailable",
    input.requirement,
    missingEvidence
  );
  const contractKinds = (source.semanticContracts ?? []).map(({ kind }) => kind);
  const missingContracts = missing(
    input.requirement.requiredSemanticContractKinds ?? [],
    contractKinds
  );
  if (missingContracts.length > 0) return unavailable(
    "contracts-unavailable",
    input.requirement,
    missingContracts
  );
  const requiredAdjacency = input.requirement.requiredAdjacency;
  if (requiredAdjacency !== undefined) {
    const adjacencyEvidence = (source.adjacencyEvidence ?? []).find(
      (candidate) =>
        candidate.adjacencyId === requiredAdjacency.adjacencyId &&
        candidate.fromStateId === requiredAdjacency.fromStateId &&
        candidate.toStateId === requiredAdjacency.toStateId
    );
    if (adjacencyEvidence === undefined) return unavailable(
      "adjacency-unavailable",
      input.requirement,
      [
        `${requiredAdjacency.adjacencyId}:` +
        `${requiredAdjacency.fromStateId}->${requiredAdjacency.toStateId}`
      ]
    );
    const missingCorrespondences = missing(
      input.requirement.requiredCorrespondenceIds ?? [],
      adjacencyEvidence.correspondenceIds
    );
    if (missingCorrespondences.length > 0) return unavailable(
      "correspondences-unavailable",
      input.requirement,
      missingCorrespondences
    );
  }
  return Object.freeze({ status: "resolved" as const, source });
}

function unavailable(
  status: Exclude<
    KpEquationSeriesGovernedSourceResolution["status"],
    "resolved"
  >,
  requirement: KpEquationSeriesGovernedSourceRequirement,
  missingIds: readonly string[]
): KpEquationSeriesGovernedSourceResolution {
  return deepFreeze({
    status,
    sourceId: requirement.sourcePin.sourceId,
    revisionId: requirement.sourcePin.revisionId,
    missingIds: [...missingIds]
  });
}

function missing(
  required: readonly string[],
  available: readonly string[]
): readonly string[] {
  return required.filter((id) => !available.includes(id));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
