import type { KpOrganicMotionSignature } from "./organic-motion-primitives.ts";

export interface KpDotProductTraversalContributionPlan {
  readonly id: string;
  readonly semanticIndex: number;
  readonly leftSelectorId: string;
  readonly rightSelectorId: string;
  readonly leftValue: number;
  readonly rightValue: number;
  readonly product: number;
  readonly accumulatedValue: number;
  readonly productObjectId: string;
  readonly partialSumObjectId: string;
  readonly productLatex: string;
  readonly partialSumLatex: string;
  readonly start: number;
  readonly end: number;
  readonly leftSignature: KpOrganicMotionSignature;
  readonly rightSignature: KpOrganicMotionSignature;
}

export interface KpDotProductTraversalPlan {
  readonly id: string;
  readonly kind: "dot-product-renderer-plan";
  readonly resultSelectorId: string;
  readonly contributions: readonly KpDotProductTraversalContributionPlan[];
  readonly resultRevealStart: number;
  readonly resultRevealEnd: number;
}

export interface KpDotProductContributionFrame {
  readonly id: string;
  readonly semanticIndex: number;
  readonly status: "upcoming" | "active" | "accumulated";
  readonly localProgress: number;
  readonly salience: number;
  readonly productOpacity: number;
  readonly productScale: number;
  readonly accumulatedValue: number;
}

export interface KpDotProductTraversalProgressFrame {
  readonly kind: "dot-product-traversal";
  readonly semanticProgress: number;
  readonly actProgress: number;
  readonly contributions: readonly KpDotProductContributionFrame[];
  readonly activeContributionIndices: readonly number[];
  readonly accumulatedThroughIndex: number | undefined;
  readonly accumulationLatex: string;
  readonly accumulationOpacity: number;
  readonly resultRevealProgress: number;
}

export function sampleKpDotProductTraversalProgress(input: {
  readonly plan: KpDotProductTraversalPlan;
  readonly progress: number;
}): KpDotProductTraversalProgressFrame {
  const semanticProgress = clamp01(input.progress);
  const actProgress = windowProgress(semanticProgress, 0.14, 0.74);
  const resultRevealProgress = smooth(windowProgress(
    semanticProgress,
    input.plan.resultRevealStart,
    input.plan.resultRevealEnd
  ));
  const contributions = input.plan.contributions.map((contribution) => {
    const localProgress = windowProgress(
      actProgress,
      contribution.start,
      contribution.end
    );
    const status = semanticProgress < 0.14 || actProgress < contribution.start
      ? "upcoming" as const
      : actProgress >= contribution.end
        ? "accumulated" as const
        : "active" as const;
    const salience = status === "upcoming" || status === "accumulated"
      ? 0
      : localProgress < 0.28
        ? smooth(localProgress / 0.28)
        : localProgress <= 0.72
          ? 1
          : 1 - smooth((localProgress - 0.72) / 0.28);
    const productEntry = smooth(windowProgress(localProgress, 0.16, 0.52));
    const productOpacity = status === "upcoming"
      ? 0
      : status === "active"
        ? productEntry
        : 0.42 * (1 - resultRevealProgress);
    return {
      id: contribution.id,
      semanticIndex: contribution.semanticIndex,
      status,
      localProgress,
      salience,
      productOpacity,
      productScale: status === "accumulated"
        ? 0.84
        : 0.86 + 0.14 * productEntry,
      accumulatedValue: contribution.accumulatedValue
    };
  });
  const activeContributionIndices = contributions
    .filter((contribution) => contribution.salience > 0)
    .map((contribution) => contribution.semanticIndex);
  const accumulated = contributions.filter((contribution) =>
    contribution.status === "accumulated" ||
    contribution.localProgress >= 0.58
  );
  const accumulatedThroughIndex = accumulated.at(-1)?.semanticIndex;
  return {
    kind: "dot-product-traversal",
    semanticProgress,
    actProgress,
    contributions,
    activeContributionIndices,
    accumulatedThroughIndex,
    accumulationLatex: accumulationLatex(
      input.plan,
      accumulatedThroughIndex
    ),
    accumulationOpacity: accumulatedThroughIndex === undefined
      ? 0
      : 1 - resultRevealProgress,
    resultRevealProgress
  };
}

function accumulationLatex(
  plan: KpDotProductTraversalPlan,
  throughIndex: number | undefined
): string {
  if (throughIndex === undefined) return "";
  return plan.contributions.find(
    (contribution) => contribution.semanticIndex === throughIndex
  )?.partialSumLatex ?? "";
}

function windowProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

function smooth(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Dot-product traversal progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

// Legacy names describe their eventual consumer, not the neutral plan owner.
export type KpDotProductRendererContributionPlan =
  KpDotProductTraversalContributionPlan;
export type KpDotProductRendererPlan = KpDotProductTraversalPlan;
