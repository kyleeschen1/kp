import {
  planKpSemanticDuration,
  type KpSemanticDurationLongSequencePolicy,
  type KpSemanticDurationPlan
} from "./semantic-duration-planner.ts";
import {
  KP_MATRIX_MATRIX_CELL_MINIMUM_DURATION_MS,
  KP_MATRIX_MATRIX_ENVELOPE_LEAD_MS,
  KP_MATRIX_MATRIX_ENVELOPE_RELEASE_MS
} from "./matrix-matrix-duration-contract.ts";

export interface KpMatrixMatrixSemanticDuration {
  readonly kind: "matrix-matrix-semantic-duration";
  readonly work: KpSemanticDurationPlan;
  readonly leadDurationMs: number;
  readonly releaseDurationMs: number;
  readonly totalDurationMs: number;
}

export function createKpMatrixMatrixSemanticDuration(input: {
  readonly id: string;
  readonly cellCount: number;
  readonly longSequencePolicy?: KpSemanticDurationLongSequencePolicy | undefined;
}): KpMatrixMatrixSemanticDuration {
  if (!Number.isInteger(input.cellCount) || input.cellCount <= 0) {
    throw new Error("Matrix-matrix pacing requires a positive cell count.");
  }
  const result = planKpSemanticDuration({
    id: `${input.id}.cell-work`,
    actions: Array.from({ length: input.cellCount }, (_value, semanticRank) => ({
      id: `${input.id}.cell.${semanticRank}`,
      semanticRank,
      minimumDurationMs: KP_MATRIX_MATRIX_CELL_MINIMUM_DURATION_MS,
      repeatPatternId: `${input.id}.cell-dot-pattern`
    })),
    ...(input.cellCount <= 5
      ? {}
      : { longSequencePolicy: input.longSequencePolicy ?? "long-form" })
  });
  if (result.status !== "planned") {
    throw new Error(result.diagnostics[0]?.message ?? "Matrix-matrix duration failed.");
  }
  return {
    kind: "matrix-matrix-semantic-duration",
    work: result.plan,
    leadDurationMs: KP_MATRIX_MATRIX_ENVELOPE_LEAD_MS,
    releaseDurationMs: KP_MATRIX_MATRIX_ENVELOPE_RELEASE_MS,
    totalDurationMs:
      KP_MATRIX_MATRIX_ENVELOPE_LEAD_MS +
      result.plan.totalDurationMs +
      KP_MATRIX_MATRIX_ENVELOPE_RELEASE_MS
  };
}
