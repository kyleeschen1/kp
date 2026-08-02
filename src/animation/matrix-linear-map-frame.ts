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
  readonly accessibility: {
    readonly motionPolicy: "continuous" | "discrete";
    readonly checkpointProgress: number;
    readonly description: string;
    readonly liveNarration: string;
  };
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
    readonly currentBasisVectors: readonly (readonly number[])[];
    readonly currentVectorCoordinates: readonly number[];
    readonly transformedGridSegments: readonly {
      readonly id: string;
      readonly family: "first-basis" | "second-basis";
      readonly from: readonly number[];
      readonly to: readonly number[];
    }[];
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
  const requestedSemanticProgress = roundProgress(input.direction === "forward"
    ? clamp01(input.progress)
    : 1 - clamp01(input.progress));
  const effectiveSemanticProgress = input.accessibilityMode === "static"
    ? staticCheckpointProgress(input.plan, requestedSemanticProgress)
    : requestedSemanticProgress;
  const choreographyFrame = sampleKpMatrixVectorCompositionChoreography({
    choreography: input.plan.choreography,
    // Direction has already been normalized into semantic progress. Sampling
    // forward here prevents floating-point double inversion from drifting.
    progress: effectiveSemanticProgress,
    direction: "forward",
    accessibilityMode: input.accessibilityMode === "reduced-motion" ||
      input.accessibilityMode === "static"
      ? "reduced"
      : "full"
  });
  const progress = choreographyFrame.motion.semanticProgress;
  const discrete = input.accessibilityMode === "reduced-motion" ||
    input.accessibilityMode === "static";
  const rows = input.plan.operationBank.rows.map((row) => {
    const motion = choreographyFrame.motion.rows.find((candidate) =>
      candidate.semanticIndex === row.semanticIndex
    )!;
    const foldPhase = phaseFor(motion.status, motion.localProgress);
    return {
      semanticIndex: row.semanticIndex,
      status: motion.status,
      foldPhase,
      routeProgress: accessibleProgress(
        smooth(windowProgress(motion.localProgress, 0.02, 0.2)), discrete
      ),
      gatherProgress: accessibleProgress(
        smooth(windowProgress(motion.localProgress, 0.48, 0.76)), discrete
      ),
      coordinateProgress: accessibleProgress(
        motion.resultRevealProgress, discrete
      ),
      contributions: row.contributions.map((contribution) => ({
        columnIndex: contribution.columnIndex,
        matrixValue: contribution.matrixValue,
        vectorValue: contribution.vectorValue,
        product: contribution.product,
        productRevealProgress: accessibleProgress(
          smooth(windowProgress(
            motion.localProgress,
            0.18 + contribution.columnIndex * 0.06,
            0.42 + contribution.columnIndex * 0.06
          )),
          discrete
        )
      })),
      result: row.result
    };
  });
  const gridTransformProgress = accessibleProgress(
    smooth(windowProgress(progress, 0.64, 0.9)), discrete
  );
  const vectorMapProgress = accessibleProgress(
    smooth(windowProgress(progress, 0.72, 0.96)), discrete
  );
  const currentBasisVectors = input.plan.semantics.mappedBasisVectors.map(
    (vector) => vector.sourceCoordinates.map((coordinate, index) =>
      interpolate(
        coordinate,
        vector.targetCoordinates[index]!,
        gridTransformProgress
      )
    )
  );
  const currentVectorCoordinates = input.plan.semantics.inputCoordinates.map(
    (coordinate, index) => interpolate(
      coordinate,
      input.plan.semantics.outputCoordinates[index]!,
      vectorMapProgress
    )
  );
  const geometry = {
    visibility: accessibleProgress(
      smooth(windowProgress(progress, 0.54, 0.64)), discrete
    ),
    basisRevealProgress: accessibleProgress(
      smooth(windowProgress(progress, 0.58, 0.74)), discrete
    ),
    gridTransformProgress,
    sourceVectorRevealProgress: accessibleProgress(
      smooth(windowProgress(progress, 0.62, 0.76)), discrete
    ),
    vectorMapProgress,
    outputVectorRevealProgress: accessibleProgress(
      smooth(windowProgress(progress, 0.86, 1)), discrete
    ),
    inputCoordinates: input.plan.semantics.inputCoordinates,
    outputCoordinates: input.plan.semantics.outputCoordinates,
    mappedBasisVectors: input.plan.semantics.mappedBasisVectors.map(
      (vector) => vector.targetCoordinates
    ),
    currentBasisVectors,
    currentVectorCoordinates,
    transformedGridSegments: transformedGridSegments(currentBasisVectors)
  };
  const narration = narrationFor(rows, geometry.outputVectorRevealProgress);
  return {
    id: `${input.plan.id}.frame`,
    kind: "matrix-linear-map-frame",
    animationId: input.plan.animationId,
    timelineId: input.plan.timelineId,
    semanticProgress: progress,
    direction: input.direction,
    accessibilityMode: input.accessibilityMode,
    accessibility: {
      motionPolicy: discrete ? "discrete" : "continuous",
      checkpointProgress: progress,
      description: accessibleDescription(input.plan),
      liveNarration: narration
    },
    operationBank: {
      inputOpacity: 1,
      activeRowIndex: choreographyFrame.motion.activeRowIndex,
      rows
    },
    geometry,
    narration
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

function accessibleProgress(progress: number, discrete: boolean): number {
  return discrete ? (progress >= 0.5 ? 1 : 0) : progress;
}

function staticCheckpointProgress(
  plan: KpMatrixLinearMapPlan,
  progress: number
): number {
  const checkpoints = [
    0,
    ...plan.choreography.rows.map((row) => row.end),
    1
  ];
  return checkpoints.filter((checkpoint) => checkpoint <= progress).at(-1) ?? 0;
}

function accessibleDescription(plan: KpMatrixLinearMapPlan): string {
  const matrix = plan.semantics.matrix.rows.map((row) =>
    `[${row.join(", ")}]`
  ).join(", ");
  const basisImages = plan.semantics.mappedBasisVectors.map((vector, index) =>
    `T_A(e_${index + 1}) = [${vector.targetCoordinates.join(", ")}]`
  ).join("; ");
  return `Matrix A has rows ${matrix}. It maps v = [` +
    `${plan.semantics.inputCoordinates.join(", ")}] to [` +
    `${plan.semantics.outputCoordinates.join(", ")}]. Rows compute output ` +
    `coordinates; columns map standard basis vectors: ${basisImages}.`;
}

function transformedGridSegments(
  basis: readonly (readonly number[])[]
): KpMatrixLinearMapFrame["geometry"]["transformedGridSegments"] {
  const first = basis[0]!;
  const second = basis[1]!;
  const extent = 5;
  return Array.from({ length: extent + 1 }, (_, index) => [
    {
      id: `grid.first-basis.${index}`,
      family: "first-basis" as const,
      from: scaleCoordinates(second, index),
      to: addCoordinates(
        scaleCoordinates(second, index),
        scaleCoordinates(first, extent)
      )
    },
    {
      id: `grid.second-basis.${index}`,
      family: "second-basis" as const,
      from: scaleCoordinates(first, index),
      to: addCoordinates(
        scaleCoordinates(first, index),
        scaleCoordinates(second, extent)
      )
    }
  ]).flat();
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function scaleCoordinates(
  coordinates: readonly number[],
  factor: number
): readonly number[] {
  return coordinates.map((coordinate) => coordinate * factor);
}

function addCoordinates(
  left: readonly number[],
  right: readonly number[]
): readonly number[] {
  return left.map((coordinate, index) => coordinate + right[index]!);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Matrix linear-map progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function roundProgress(value: number): number {
  return Number(value.toFixed(12));
}
