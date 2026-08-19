export interface KpEquationSeriesVerifiedSemanticContract {
  readonly kind: string;
  readonly authority: unknown;
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
}
