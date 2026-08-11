import type {
  KpFractionCompositionArticleRuntimeRange
} from "./fraction-composition-runtime-ranges.ts";

export type KpFractionCompositionAttentionTempo =
  | "slow"
  | "deliberate"
  | "brisk";

export interface KpFractionCompositionAttentionPacingProfile {
  readonly tempo: KpFractionCompositionAttentionTempo;
  readonly millisecondsPerOperation: number;
  readonly fullTimelineDurationMs: number;
  readonly rangeDurationsMs: Readonly<Record<string, number>>;
}

export const kpFractionCompositionDefaultAttentionTempo =
  "deliberate" as const;

const millisecondsPerOperation:
Readonly<Record<KpFractionCompositionAttentionTempo, number>> = Object.freeze({
  slow: 3_000,
  deliberate: 2_400,
  brisk: 1_800
});

/**
 * Attention-stage tempo is a presentation profile over canonical normalized
 * progress. Semantic operation boundaries—not DOM distance—set its duration.
 */
export function createKpFractionCompositionAttentionPacingProfile(
  ranges: readonly KpFractionCompositionArticleRuntimeRange[],
  tempo: KpFractionCompositionAttentionTempo =
    kpFractionCompositionDefaultAttentionTempo
): KpFractionCompositionAttentionPacingProfile {
  const operationMs = millisecondsPerOperation[tempo];
  const operationCount = ranges.reduce(
    (total, range) => total + range.operationIds.length,
    0
  );
  if (operationCount === 0 || ranges.some(({ operationIds }) =>
    operationIds.length === 0
  )) {
    throw new Error("Attention pacing requires non-empty semantic operation ranges.");
  }
  return Object.freeze({
    tempo,
    millisecondsPerOperation: operationMs,
    fullTimelineDurationMs: operationCount * operationMs,
    rangeDurationsMs: Object.freeze(Object.fromEntries(ranges.map((range) => [
      range.path,
      range.operationIds.length * operationMs
    ])))
  });
}

export function readKpFractionCompositionAttentionTempo(
  search: string
): KpFractionCompositionAttentionTempo {
  const candidate = new URLSearchParams(search).get("attentionTempo");
  return candidate === "slow" || candidate === "brisk" ||
      candidate === "deliberate"
    ? candidate
    : kpFractionCompositionDefaultAttentionTempo;
}
