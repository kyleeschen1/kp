import type { KpAnimationAsset } from "./asset.ts";
import {
  createKpMatrixVectorCompositionChoreography,
  sampleKpMatrixVectorCompositionChoreography,
  type KpMatrixVectorCompositionChoreography
} from "./matrix-vector-composition-choreography.ts";
import {
  createKpMatrixVectorOperationBankContract,
  type KpMatrixVectorOperationBankContract
} from "./matrix-vector-operation-bank.ts";
import {
  deriveKpMatrixLinearMapSemantics,
  type KpMatrixLinearMapSemantics
} from "./matrix-linear-map-semantics.ts";

export type KpMatrixLinearMapAccessibilityMode =
  | "full-motion"
  | "reduced-motion"
  | "static"
  | "narrated";

export type KpMatrixLinearMapFoldPhase =
  | "waiting"
  | "route"
  | "products"
  | "gather"
  | "coordinate";

export interface KpMatrixLinearMapPlan {
  readonly id: string;
  readonly kind: "matrix-linear-map-plan";
  readonly animationId: string;
  readonly timelineId: string;
  readonly durationMs: number;
  readonly operationBank: KpMatrixVectorOperationBankContract;
  readonly choreography: KpMatrixVectorCompositionChoreography;
  readonly semantics: KpMatrixLinearMapSemantics;
}

export interface KpMatrixLinearMapFrame {
  readonly id: string;
  readonly kind: "matrix-linear-map-frame";
  readonly animationId: string;
  readonly timelineId: string;
  readonly semanticProgress: number;
  readonly direction: "forward" | "rewind";
  readonly accessibilityMode: KpMatrixLinearMapAccessibilityMode;
  readonly operationBank: {
    readonly inputOpacity: 1;
    readonly activeRowIndex: number | undefined;
    readonly rows: readonly {
      readonly semanticIndex: number;
      readonly status: "upcoming" | "active" | "resolved";
      readonly foldPhase: KpMatrixLinearMapFoldPhase;
      readonly routeProgress: number;
      readonly gatherProgress: number;
      readonly coordinateProgress: number;
      readonly contributions: readonly {
        readonly columnIndex: number;
        readonly matrixValue: number;
        readonly vectorValue: number;
        readonly product: number;
        readonly productRevealProgress: number;
      }[];
      readonly result: number;
    }[];
  };
  readonly geometry: {
    readonly visibility: number;
    readonly basisRevealProgress: number;
    readonly gridTransformProgress: number;
    readonly sourceVectorRevealProgress: number;
    readonly vectorMapProgress: number;
    readonly outputVectorRevealProgress: number;
    readonly inputCoordinates: readonly number[];
    readonly outputCoordinates: readonly number[];
    readonly mappedBasisVectors: readonly (readonly number[])[];
  };
  readonly narration: string;
}

export function createKpMatrixLinearMapPlan(
  animation: KpAnimationAsset
): KpMatrixLinearMapPlan {
  if (animation.timeline?.durationMs === undefined) {
    throw new Error(`Matrix linear-map animation ${animation.id} needs duration.`);
  }
  return {
    id: `matrix-linear-map.${animation.id}`,
    kind: "matrix-linear-map-plan",
    animationId: animation.id,
    timelineId: animation.timeline.id,
    durationMs: animation.timeline.durationMs,
    operationBank: createKpMatrixVectorOperationBankContract(animation),
    choreography: createKpMatrixVectorCompositionChoreography(animation),
    semantics: deriveKpMatrixLinearMapSemantics(animation)
  };
}

/** Samples both views from one playhead; renderers receive data, not clocks. */
export function sampleKpMatrixLinearMapFrame(input: {
  readonly plan: KpMatrixLinearMapPlan;
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly accessibilityMode: KpMatrixLinearMapAccessibilityMode;
}): KpMatrixLinearMapFrame {
  const choreographyFrame = sampleKpMatrixVectorCompositionChoreography({
    choreography: input.plan.choreography,
    progress: input.progress,
    direction: input.direction,
    accessibilityMode: input.accessibilityMode === "reduced-motion" ||
      input.accessibilityMode === "static"
      ? "reduced"
      : "full"
  });
  const progress = choreographyFrame.motion.semanticProgress;
  const rows = input.plan.operationBank.rows.map((row) => {
    const motion = choreographyFrame.motion.rows.find((candidate) =>
      candidate.semanticIndex === row.semanticIndex
    )!;
    const foldPhase = phaseFor(motion.status, motion.localProgress);
    return {
      semanticIndex: row.semanticIndex,
      status: motion.status,
      foldPhase,
      routeProgress: smooth(windowProgress(motion.localProgress, 0.02, 0.2)),
      gatherProgress: smooth(windowProgress(motion.localProgress, 0.48, 0.76)),
      coordinateProgress: motion.resultRevealProgress,
      contributions: row.contributions.map((contribution) => ({
        columnIndex: contribution.columnIndex,
        matrixValue: contribution.matrixValue,
        vectorValue: contribution.vectorValue,
        product: contribution.product,
        productRevealProgress: smooth(windowProgress(
          motion.localProgress,
          0.18 + contribution.columnIndex * 0.06,
          0.42 + contribution.columnIndex * 0.06
        ))
      })),
      result: row.result
    };
  });
  const geometry = {
    visibility: smooth(windowProgress(progress, 0.54, 0.64)),
    basisRevealProgress: smooth(windowProgress(progress, 0.58, 0.74)),
    gridTransformProgress: smooth(windowProgress(progress, 0.64, 0.9)),
    sourceVectorRevealProgress: smooth(windowProgress(progress, 0.62, 0.76)),
    vectorMapProgress: smooth(windowProgress(progress, 0.72, 0.96)),
    outputVectorRevealProgress: smooth(windowProgress(progress, 0.86, 1)),
    inputCoordinates: input.plan.semantics.inputCoordinates,
    outputCoordinates: input.plan.semantics.outputCoordinates,
    mappedBasisVectors: input.plan.semantics.mappedBasisVectors.map(
      (vector) => vector.targetCoordinates
    )
  };
  return {
    id: `${input.plan.id}.frame`,
    kind: "matrix-linear-map-frame",
    animationId: input.plan.animationId,
    timelineId: input.plan.timelineId,
    semanticProgress: progress,
    direction: input.direction,
    accessibilityMode: input.accessibilityMode,
    operationBank: {
      inputOpacity: 1,
      activeRowIndex: choreographyFrame.motion.activeRowIndex,
      rows
    },
    geometry,
    narration: narrationFor(rows, geometry.outputVectorRevealProgress)
  };
}

function phaseFor(
  status: "upcoming" | "active" | "resolved",
  progress: number
): KpMatrixLinearMapFoldPhase {
  if (status === "upcoming") return "waiting";
  if (status === "resolved") return "coordinate";
  if (progress < 0.18) return "route";
  if (progress < 0.48) return "products";
  if (progress < 0.76) return "gather";
  return "coordinate";
}

function narrationFor(
  rows: KpMatrixLinearMapFrame["operationBank"]["rows"],
  outputRevealProgress: number
): string {
  const active = rows.find((row) => row.status === "active");
  if (active !== undefined) {
    const products = active.contributions.map((item) =>
      `${item.matrixValue} times ${item.vectorValue}`
    ).join(" plus ");
    return `Row ${active.semanticIndex + 1}: ${products} gives coordinate ${active.result}.`;
  }
  if (outputRevealProgress > 0) {
    return "The same matrix maps v to the computed output vector.";
  }
  return "Use each matrix row as a dot product with the persistent input vector.";
}

function windowProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return Math.max(0, Math.min(1, (progress - start) / (end - start)));
}

function smooth(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}
