import {
  createKpFractionCompositionArticleRuntimeRanges
} from "./fraction-composition-runtime-ranges.ts";

export const kpFractionCompositionDistributionAttentionArcSchema =
  "kp.fraction-composition-distribution-attention-arc.v1" as const;
export const kpFractionCompositionDistributionAttentionArcRange =
  "distribute-and-normalize" as const;

export type KpFractionCompositionDistributionAttentionPhase =
  | "prepare"
  | "transform"
  | "settle";

export interface KpFractionCompositionDistributionAttentionArc {
  readonly kind: "kp-fraction-composition-distribution-attention-arc";
  readonly schemaVersion:
    typeof kpFractionCompositionDistributionAttentionArcSchema;
  readonly rangePath:
    typeof kpFractionCompositionDistributionAttentionArcRange;
  readonly phase: KpFractionCompositionDistributionAttentionPhase;
  readonly passage: "instruction" | "interpretation";
  readonly localProgress: number;
  readonly primaryAddresses: readonly string[];
  readonly contextAddresses: readonly string[];
  readonly timelineAuthority: "none";
}

const distributionRange = requireDistributionRange();

const prepareAddresses = Object.freeze([
  "solve/factor",
  "solve/grouped-sum"
]);
const transformAddresses = Object.freeze([
  ...prepareAddresses,
  "solve/distributed-variable-term",
  "solve/distributed-constant-term"
]);
const settledAddresses = Object.freeze([
  "solve/distributed-variable-term",
  "solve/distributed-constant-term"
]);
const equationContext = Object.freeze(["solve/equation"]);

export function isKpFractionCompositionDistributionAttentionArcRequested(
  search: string
): boolean {
  return new URLSearchParams(search).get("attentionArc") === "distribution";
}

/**
 * This local projection says what deserves attention around one canonical
 * range. The retained transport still owns timing, seeking, and settlement.
 */
export function projectKpFractionCompositionDistributionAttentionArc(input: {
  readonly globalProgress: number;
  readonly playing: boolean;
}): KpFractionCompositionDistributionAttentionArc {
  if (!Number.isFinite(input.globalProgress)) {
    throw new Error("Distribution attention progress must be finite.");
  }
  const localProgress = clamp(
    (input.globalProgress - distributionRange.start) /
      (distributionRange.end - distributionRange.start)
  );
  const phase: KpFractionCompositionDistributionAttentionPhase =
    localProgress >= 1
      ? "settle"
      : input.playing || localProgress > 0
        ? "transform"
        : "prepare";
  return Object.freeze({
    kind: "kp-fraction-composition-distribution-attention-arc" as const,
    schemaVersion: kpFractionCompositionDistributionAttentionArcSchema,
    rangePath: kpFractionCompositionDistributionAttentionArcRange,
    phase,
    passage: phase === "settle" ? "interpretation" : "instruction",
    localProgress,
    primaryAddresses: phase === "settle"
      ? settledAddresses
      : phase === "transform"
        ? transformAddresses
        : prepareAddresses,
    contextAddresses: equationContext,
    timelineAuthority: "none" as const
  });
}

export function projectKpFractionCompositionDistributionGlobalProgress(
  localProgress: number
): number {
  if (!Number.isFinite(localProgress) ||
      localProgress < 0 || localProgress > 1) {
    throw new Error("Distribution local progress must be between 0 and 1.");
  }
  return distributionRange.start +
    (distributionRange.end - distributionRange.start) * localProgress;
}

function clamp(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

function requireDistributionRange() {
  const range = createKpFractionCompositionArticleRuntimeRanges()
    .find(({ path }) =>
      path === kpFractionCompositionDistributionAttentionArcRange
    );
  if (range === undefined) {
    throw new Error("Fraction composition lacks its distribution range.");
  }
  return range;
}
