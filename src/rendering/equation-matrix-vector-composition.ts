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

export interface KpMatrixVectorRendererRowPlan {
  readonly id: string;
  readonly semanticIndex: number;
  readonly matrixSelectorIds: readonly string[];
  readonly vectorSelectorIds: readonly string[];
  readonly resultSelectorId: string;
  readonly rowValues: readonly number[];
  readonly vectorValues: readonly number[];
  readonly result: number;
  readonly intermediateObjectId: string;
  readonly rowLatex: string;
  readonly start: number;
  readonly end: number;
  readonly sourceSignatures: Readonly<Record<string, KpOrganicMotionSignature>>;
}

export interface KpMatrixVectorRendererPlan {
  readonly id: string;
  readonly kind: "matrix-vector-renderer-plan";
  readonly rows: readonly KpMatrixVectorRendererRowPlan[];
  readonly semanticDurationMs: number;
  readonly semanticActionCount: number;
  readonly sourceReleaseStart: number;
  readonly sourceReleaseEnd: number;
  readonly structureRevealStart: number;
  readonly structureRevealEnd: number;
}

export interface KpMatrixVectorRowFrame {
  readonly semanticIndex: number;
  readonly status: "upcoming" | "active" | "resolved";
  readonly localProgress: number;
  readonly salience: number;
  readonly calculationOpacity: number;
  readonly resultRevealProgress: number;
}

export interface KpMatrixVectorCompositionProgressFrame {
  readonly kind: "matrix-vector-row-composition";
  readonly semanticProgress: number;
  readonly semanticDurationMs: number;
  readonly semanticActionCount: number;
  readonly rows: readonly KpMatrixVectorRowFrame[];
  readonly activeRowIndex: number | undefined;
  readonly resolvedThroughRowIndex: number | undefined;
  readonly sourceOpacity: number;
  readonly structureRevealProgress: number;
  readonly sourceReflowProgress: number;
  readonly targetSettlementProgress: number;
}

export function sampleKpMatrixVectorCompositionProgress(input: {
  readonly plan: KpMatrixVectorRendererPlan;
  readonly progress: number;
}): KpMatrixVectorCompositionProgressFrame {
  const semanticProgress = clamp01(input.progress);
  const rows = input.plan.rows.map((row) => {
    const localProgress = windowProgress(semanticProgress, row.start, row.end);
    const status = semanticProgress < row.start
      ? "upcoming" as const
      : semanticProgress >= row.end
        ? "resolved" as const
        : "active" as const;
    const salience = status !== "active"
      ? 0
      : localProgress < 0.22
        ? smooth(localProgress / 0.22)
        : localProgress <= 0.72
          ? 1
          : 1 - smooth((localProgress - 0.72) / 0.28);
    return {
      semanticIndex: row.semanticIndex,
      status,
      localProgress,
      salience,
      calculationOpacity: status === "upcoming"
        ? 0
        : status === "active"
          ? smooth(windowProgress(localProgress, 0.12, 0.32))
          : 0.34,
      resultRevealProgress: smooth(windowProgress(localProgress, 0.62, 0.9))
    };
  });
  return {
    kind: "matrix-vector-row-composition",
    semanticProgress,
    semanticDurationMs: input.plan.semanticDurationMs,
    semanticActionCount: input.plan.semanticActionCount,
    rows,
    activeRowIndex: rows
      .filter((row) => row.status === "active")
      .sort((left, right) => right.salience - left.salience)
      .at(0)?.semanticIndex,
    resolvedThroughRowIndex: rows.filter((row) =>
      row.status === "resolved" || row.resultRevealProgress >= 1
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
    sourceReflowProgress: smooth(windowProgress(semanticProgress, 0.04, 0.14)),
    targetSettlementProgress: smooth(windowProgress(semanticProgress, 0.72, 0.96))
  };
}

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

function windowProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

function smooth(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Matrix-vector composition progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}
