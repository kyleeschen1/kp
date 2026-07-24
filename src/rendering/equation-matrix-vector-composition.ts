import {
  sampleKpOrganicMotion
} from "../animation/organic-motion-primitives.ts";
import type {
  KpMatrixVectorCompositionProgressFrame,
  KpMatrixVectorRendererPlan
} from "../animation/matrix-vector-composition-progress.ts";
import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import type {
  KpEquationTokenMotionFrameToken,
  KpEquationTokenMotionPose
} from "./semantic-equation-token-renderer.ts";

export {
  sampleKpMatrixVectorCompositionProgress
} from "../animation/matrix-vector-composition-progress.ts";
export type {
  KpMatrixVectorCompositionProgressFrame,
  KpMatrixVectorRendererPlan,
  KpMatrixVectorRendererRowPlan,
  KpMatrixVectorRowFrame
} from "../animation/matrix-vector-composition-progress.ts";

export function sampleKpEquationMatrixVectorRelation(input: {
  readonly plan: KpMatrixVectorRendererPlan;
  readonly frame: KpMatrixVectorCompositionProgressFrame;
  readonly relation: KpMeasuredEquationTransitionRelationGeometry;
  readonly sourceTokens: readonly AnnotatedMotionToken[];
  readonly targetTokens: readonly AnnotatedMotionToken[];
}): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (input.relation.lifecycle !== "exit" && input.relation.lifecycle !== "enter") {
    return undefined;
  }
  const sourceSelectors = selectorByMotionId(input.relation.source);
  const targetSelectors = selectorByMotionId(input.relation.target);
  return [
    ...input.sourceTokens.map((token) => {
      const selectorId = sourceSelectors.get(token.motionId);
      const row = input.plan.rows.find((candidate) =>
        selectorId !== undefined &&
        (candidate.matrixSelectorIds.includes(selectorId) ||
          candidate.vectorSelectorIds.includes(selectorId))
      );
      if (row === undefined || selectorId === undefined) {
        return frameToken(token, "source", {
          ...stationary(input.frame.sourceOpacity),
          x: -64 * input.frame.sourceReflowProgress
        });
      }
      const rowFrame = input.frame.rows.find(
        (candidate) => candidate.semanticIndex === row.semanticIndex
      )!;
      const signature = row.sourceSignatures[selectorId];
      const organic = signature === undefined
        ? { x: 0, y: 0, scaleAlong: 1 }
        : sampleKpOrganicMotion({
            signature,
            progress: rowFrame.localProgress,
            microMotionAmplitude: 0.55,
            deformationCeiling: 0.014
          });
      const isMatrixEntry = row.matrixSelectorIds.includes(selectorId);
      const gather = Math.sin(Math.PI * rowFrame.localProgress) * rowFrame.salience;
      return frameToken(token, "source", {
        opacity: input.frame.sourceOpacity,
        x:
          -64 * input.frame.sourceReflowProgress +
          (isMatrixEntry ? 3.5 : -3.5) * gather +
          organic.x,
        y: (isMatrixEntry ? -1 : 1) * 2.2 * gather + organic.y,
        scale: 1 + 0.035 * rowFrame.salience + (organic.scaleAlong - 1)
      });
    }),
    ...input.targetTokens.map((token) => {
      const selectorId = targetSelectors.get(token.motionId);
      const row = input.plan.rows.find(
        (candidate) => candidate.resultSelectorId === selectorId
      );
      if (row === undefined) {
        return frameToken(token, "target", {
          opacity: input.frame.structureRevealProgress,
          x: 64 * (1 - input.frame.targetSettlementProgress),
          y: 0,
          scale: 1
        });
      }
      const rowFrame = input.frame.rows.find(
        (candidate) => candidate.semanticIndex === row.semanticIndex
      )!;
      const reveal = rowFrame.resultRevealProgress;
      const arc = reveal === 0 || reveal === 1
        ? 0
        : Math.sin(Math.PI * reveal);
      return frameToken(token, "target", {
        opacity: reveal,
        x:
          64 * (1 - input.frame.targetSettlementProgress) +
          (row.semanticIndex % 2 === 0 ? -7 : 7) * (1 - reveal),
        y: (row.semanticIndex % 2 === 0 ? -5 : 5) * (1 - reveal) - 2 * arc,
        scale: 1
      });
    })
  ];
}

function selectorByMotionId(
  endpoint: KpMeasuredEquationTransitionRelationGeometry["source"]
): ReadonlyMap<string, string> {
  return new Map(endpoint?.motionIds.map((motionId, index) => [
    motionId,
    endpoint.selectorIds[index]!
  ]) ?? []);
}

function stationary(opacity: number): KpEquationTokenMotionPose {
  return { opacity, x: 0, y: 0, scale: 1 };
}

function frameToken(
  token: AnnotatedMotionToken,
  side: "source" | "target",
  pose: KpEquationTokenMotionPose
): KpEquationTokenMotionFrameToken {
  return { motionId: token.motionId, side, pose };
}
