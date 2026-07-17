import {
  planKpSemanticDuration,
  type KpSemanticDurationLongSequencePolicy,
  type KpSemanticDurationPlan
} from "./semantic-duration-planner.ts";
import {
  KP_MATRIX_VECTOR_ENVELOPE_LEAD_MS,
  KP_MATRIX_VECTOR_ENVELOPE_RELEASE_MS,
  KP_MATRIX_VECTOR_ROW_MINIMUM_DURATION_MS
} from "./matrix-vector-duration-contract.ts";

export interface KpMatrixVectorSemanticDuration {
  readonly kind: "matrix-vector-semantic-duration";
  readonly work: KpSemanticDurationPlan;
  readonly leadDurationMs: number;
  readonly releaseDurationMs: number;
  readonly totalDurationMs: number;
}

export function createKpMatrixVectorSemanticDuration(input: {
  readonly id: string;
  readonly rowCount: number;
  readonly longSequencePolicy?: KpSemanticDurationLongSequencePolicy | undefined;
}): KpMatrixVectorSemanticDuration {
  if (!Number.isInteger(input.rowCount) || input.rowCount <= 0) {
    throw new Error("Matrix-vector pacing requires a positive row count.");
  }
  const result = planKpSemanticDuration({
    id: `${input.id}.row-work`,
    actions: Array.from({ length: input.rowCount }, (_value, semanticRank) => ({
      id: `${input.id}.row.${semanticRank}`,
      semanticRank,
      minimumDurationMs: KP_MATRIX_VECTOR_ROW_MINIMUM_DURATION_MS,
      repeatPatternId: `${input.id}.row-dot-pattern`
    })),
    ...(input.rowCount <= 5
      ? {}
      : { longSequencePolicy: input.longSequencePolicy ?? "long-form" })
  });
  if (result.status !== "planned") {
    throw new Error(result.diagnostics[0]?.message ?? "Matrix-vector duration failed.");
  }
  return {
    kind: "matrix-vector-semantic-duration",
    work: result.plan,
    leadDurationMs: KP_MATRIX_VECTOR_ENVELOPE_LEAD_MS,
    releaseDurationMs: KP_MATRIX_VECTOR_ENVELOPE_RELEASE_MS,
    totalDurationMs:
      KP_MATRIX_VECTOR_ENVELOPE_LEAD_MS +
      result.plan.totalDurationMs +
      KP_MATRIX_VECTOR_ENVELOPE_RELEASE_MS
  };
}
