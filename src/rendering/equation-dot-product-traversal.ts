import {
  sampleKpOrganicMotion,
  type KpOrganicMotionSignature
} from "../animation/organic-motion-primitives.ts";
import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import type {
  KpEquationTokenMotionFrameToken,
  KpEquationTokenMotionPose
} from "./semantic-equation-token-renderer.ts";

export interface KpDotProductRendererContributionPlan {
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

export interface KpDotProductRendererPlan {
  readonly id: string;
  readonly kind: "dot-product-renderer-plan";
  readonly resultSelectorId: string;
  readonly contributions: readonly KpDotProductRendererContributionPlan[];
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
  readonly plan: KpDotProductRendererPlan;
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

export function sampleKpEquationDotProductRelation(input: {
  readonly plan: KpDotProductRendererPlan;
  readonly frame: KpDotProductTraversalProgressFrame;
  readonly relation: KpMeasuredEquationTransitionRelationGeometry;
  readonly sourceTokens: readonly AnnotatedMotionToken[];
  readonly targetTokens: readonly AnnotatedMotionToken[];
}): readonly KpEquationTokenMotionFrameToken[] {
  const selectorByMotionId = new Map(
    input.relation.source?.motionIds.map((motionId, index) => [
      motionId,
      input.relation.source?.selectorIds[index]
    ]) ?? []
  );
  return [
    ...input.sourceTokens.map((token) => {
      const selectorId = selectorByMotionId.get(token.motionId);
      const contribution = input.plan.contributions.find(
        (candidate) =>
          candidate.leftSelectorId === selectorId ||
          candidate.rightSelectorId === selectorId
      );
      if (contribution === undefined) {
        return frameToken(token, "source", {
          opacity: 1 - input.frame.resultRevealProgress,
          x: 0,
          y: 0,
          scale: 1
        });
      }
      const contributionFrame = input.frame.contributions.find(
        (candidate) => candidate.id === contribution.id
      )!;
      const isLeft = contribution.leftSelectorId === selectorId;
      const organic = sampleKpOrganicMotion({
        signature: isLeft
          ? contribution.leftSignature
          : contribution.rightSignature,
        progress: contributionFrame.localProgress,
        microMotionAmplitude: 0.7,
        deformationCeiling: 0.018
      });
      const pairing = Math.sin(Math.PI * contributionFrame.localProgress) *
        contributionFrame.salience;
      return frameToken(token, "source", {
        opacity: 1 - input.frame.resultRevealProgress,
        x: (isLeft ? 5 : -5) * pairing + organic.x,
        y:
          (isLeft ? -1 : 1) *
            2.5 *
            Math.sin(Math.PI * contributionFrame.localProgress) +
          organic.y,
        scale:
          1 +
          0.045 * contributionFrame.salience +
          (organic.scaleAlong - 1)
      });
    }),
    ...input.targetTokens.map((token) => frameToken(token, "target", {
      opacity: input.frame.resultRevealProgress,
      x: 0,
      y: 5 * (1 - input.frame.resultRevealProgress),
      scale: 0.9 + 0.1 * input.frame.resultRevealProgress
    }))
  ];
}

function accumulationLatex(
  plan: KpDotProductRendererPlan,
  throughIndex: number | undefined
): string {
  if (throughIndex === undefined) return "";
  return plan.contributions.find(
    (contribution) => contribution.semanticIndex === throughIndex
  )?.partialSumLatex ?? "";
}

function frameToken(
  token: AnnotatedMotionToken,
  side: "source" | "target",
  pose: KpEquationTokenMotionPose
): KpEquationTokenMotionFrameToken {
  return { motionId: token.motionId, side, pose };
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
