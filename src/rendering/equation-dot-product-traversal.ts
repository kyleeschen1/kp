import {
  sampleKpOrganicMotion
} from "../animation/organic-motion-primitives.ts";
import type {
  KpDotProductRendererPlan,
  KpDotProductTraversalProgressFrame
} from "../animation/dot-product-traversal-progress.ts";
import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import type {
  KpEquationTokenMotionFrameToken,
  KpEquationTokenMotionPose
} from "./semantic-equation-token-renderer.ts";

export {
  sampleKpDotProductTraversalProgress
} from "../animation/dot-product-traversal-progress.ts";
export type {
  KpDotProductContributionFrame,
  KpDotProductRendererContributionPlan,
  KpDotProductRendererPlan,
  KpDotProductTraversalProgressFrame
} from "../animation/dot-product-traversal-progress.ts";

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

function frameToken(
  token: AnnotatedMotionToken,
  side: "source" | "target",
  pose: KpEquationTokenMotionPose
): KpEquationTokenMotionFrameToken {
  return { motionId: token.motionId, side, pose };
}
