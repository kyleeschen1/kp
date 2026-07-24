import {
  sampleKpOrganicMotion
} from "../animation/organic-motion-primitives.ts";
import type {
  KpMatrixMatrixCompositionProgressFrame,
  KpMatrixMatrixRendererPlan
} from "../animation/matrix-matrix-composition-progress.ts";
import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import type {
  KpEquationTokenMotionFrameToken,
  KpEquationTokenMotionPose
} from "./semantic-equation-token-renderer.ts";

export {
  sampleKpMatrixMatrixCompositionProgress
} from "../animation/matrix-matrix-composition-progress.ts";
export type {
  KpMatrixMatrixCellFrame,
  KpMatrixMatrixCompositionProgressFrame,
  KpMatrixMatrixRendererCellPlan,
  KpMatrixMatrixRendererPlan
} from "../animation/matrix-matrix-composition-progress.ts";

export function sampleKpEquationMatrixMatrixRelation(input: {
  readonly plan: KpMatrixMatrixRendererPlan;
  readonly frame: KpMatrixMatrixCompositionProgressFrame;
  readonly relation: KpMeasuredEquationTransitionRelationGeometry;
  readonly sourceTokens: readonly AnnotatedMotionToken[];
  readonly targetTokens: readonly AnnotatedMotionToken[];
}): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (input.relation.lifecycle !== "exit" && input.relation.lifecycle !== "enter") {
    return undefined;
  }
  const sourceSelectors = selectorByMotionId(input.relation.source);
  const targetSelectors = selectorByMotionId(input.relation.target);
  const sourceBaseX = -72 * input.frame.sourceReflowProgress;
  const targetBaseX = 72 * (1 - input.frame.targetSettlementProgress);
  return [
    ...input.sourceTokens.map((token) => {
      const selectorId = sourceSelectors.get(token.motionId);
      const activeCell = input.plan.cells
        .map((cell) => ({
          cell,
          frame: input.frame.cells.find(
            (candidate) => candidate.semanticIndex === cell.semanticIndex
          )!
        }))
        .filter(({ cell, frame }) =>
          selectorId !== undefined &&
          frame.status === "active" &&
          (cell.leftSelectorIds.includes(selectorId) ||
            cell.rightSelectorIds.includes(selectorId))
        )
        .sort((left, right) => right.frame.salience - left.frame.salience)
        .at(0)?.cell;
      if (activeCell === undefined || selectorId === undefined) {
        return frameToken(token, "source", {
          ...stationary(input.frame.sourceOpacity),
          x: sourceBaseX
        });
      }
      const cellFrame = input.frame.cells.find(
        (candidate) => candidate.semanticIndex === activeCell.semanticIndex
      )!;
      const signature = activeCell.sourceSignatures[selectorId];
      const organic = signature === undefined
        ? { x: 0, y: 0, scaleAlong: 1 }
        : sampleKpOrganicMotion({
            signature,
            progress: cellFrame.localProgress,
            microMotionAmplitude: 0.52,
            deformationCeiling: 0.012
          });
      const isLeft = activeCell.leftSelectorIds.includes(selectorId);
      const meet = Math.sin(Math.PI * cellFrame.localProgress) * cellFrame.salience;
      return frameToken(token, "source", {
        opacity: input.frame.sourceOpacity,
        x: sourceBaseX + (isLeft ? 4 : -4) * meet + organic.x,
        y: (isLeft ? -1 : 1) * 2.4 * meet + organic.y,
        scale: 1 + 0.034 * cellFrame.salience + (organic.scaleAlong - 1)
      });
    }),
    ...input.targetTokens.map((token) => {
      const selectorId = targetSelectors.get(token.motionId);
      const cell = input.plan.cells.find(
        (candidate) => candidate.resultSelectorId === selectorId
      );
      if (cell === undefined) {
        return frameToken(token, "target", {
          opacity: input.frame.structureRevealProgress,
          x: targetBaseX,
          y: 0,
          scale: 1
        });
      }
      const cellFrame = input.frame.cells.find(
        (candidate) => candidate.semanticIndex === cell.semanticIndex
      )!;
      const reveal = cellFrame.resultRevealProgress;
      const arc = reveal === 0 || reveal === 1
        ? 0
        : Math.sin(Math.PI * reveal);
      const horizontalSign = cell.columnIndex % 2 === 0 ? -1 : 1;
      const verticalSign = cell.rowIndex % 2 === 0 ? -1 : 1;
      return frameToken(token, "target", {
        opacity: reveal,
        x: targetBaseX + horizontalSign * 7 * (1 - reveal),
        y: verticalSign * 5 * (1 - reveal) - 2 * arc,
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
