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

export interface KpMatrixMatrixRendererCellPlan {
  readonly id: string;
  readonly semanticIndex: number;
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly leftSelectorIds: readonly string[];
  readonly rightSelectorIds: readonly string[];
  readonly resultSelectorId: string;
  readonly leftValues: readonly number[];
  readonly rightValues: readonly number[];
  readonly result: number;
  readonly intermediateObjectId: string;
  readonly cellLatex: string;
  readonly start: number;
  readonly end: number;
  readonly sourceSignatures: Readonly<Record<string, KpOrganicMotionSignature>>;
}

export interface KpMatrixMatrixRendererPlan {
  readonly id: string;
  readonly kind: "matrix-matrix-renderer-plan";
  readonly cells: readonly KpMatrixMatrixRendererCellPlan[];
  readonly sourceReleaseStart: number;
  readonly sourceReleaseEnd: number;
  readonly structureRevealStart: number;
  readonly structureRevealEnd: number;
}

export interface KpMatrixMatrixCellFrame {
  readonly semanticIndex: number;
  readonly status: "upcoming" | "active" | "resolved";
  readonly localProgress: number;
  readonly salience: number;
  readonly calculationOpacity: number;
  readonly resultRevealProgress: number;
}

export interface KpMatrixMatrixCompositionProgressFrame {
  readonly kind: "matrix-matrix-cell-composition";
  readonly semanticProgress: number;
  readonly cells: readonly KpMatrixMatrixCellFrame[];
  readonly activeCellIndex: number | undefined;
  readonly resolvedThroughCellIndex: number | undefined;
  readonly sourceOpacity: number;
  readonly structureRevealProgress: number;
  readonly sourceReflowProgress: number;
  readonly targetSettlementProgress: number;
}

export function sampleKpMatrixMatrixCompositionProgress(input: {
  readonly plan: KpMatrixMatrixRendererPlan;
  readonly progress: number;
}): KpMatrixMatrixCompositionProgressFrame {
  const semanticProgress = clamp01(input.progress);
  const cells = input.plan.cells.map((cell) => {
    const localProgress = windowProgress(semanticProgress, cell.start, cell.end);
    const status = semanticProgress < cell.start
      ? "upcoming" as const
      : semanticProgress >= cell.end
        ? "resolved" as const
        : "active" as const;
    const salience = status !== "active"
      ? 0
      : localProgress < 0.2
        ? smooth(localProgress / 0.2)
        : localProgress <= 0.74
          ? 1
          : 1 - smooth((localProgress - 0.74) / 0.26);
    return {
      semanticIndex: cell.semanticIndex,
      status,
      localProgress,
      salience,
      calculationOpacity: status === "active"
        ? smooth(windowProgress(localProgress, 0.1, 0.3))
        : 0,
      resultRevealProgress: smooth(windowProgress(localProgress, 0.62, 0.9))
    };
  });
  return {
    kind: "matrix-matrix-cell-composition",
    semanticProgress,
    cells,
    activeCellIndex: cells
      .filter((cell) => cell.status === "active")
      .sort((left, right) => right.salience - left.salience)
      .at(0)?.semanticIndex,
    resolvedThroughCellIndex: cells.filter((cell) =>
      cell.status === "resolved" || cell.resultRevealProgress >= 1
    ).at(-1)?.semanticIndex,
    sourceOpacity: 1 - smooth(windowProgress(
      semanticProgress,
      input.plan.sourceReleaseStart,
      input.plan.sourceReleaseEnd
    )),
    structureRevealProgress: smooth(windowProgress(
      semanticProgress,
      input.plan.structureRevealStart,
      input.plan.structureRevealEnd
    )),
    sourceReflowProgress: smooth(windowProgress(semanticProgress, 0.035, 0.13)),
    targetSettlementProgress: smooth(windowProgress(semanticProgress, 0.76, 0.96))
  };
}

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

function windowProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

function smooth(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Matrix-matrix composition progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}
