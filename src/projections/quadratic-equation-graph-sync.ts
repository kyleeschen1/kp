import {
  kpQuadraticBranchingTimelineId
} from "../animation/quadratic-branching-asset.ts";
import {
  createCanonicalKpQuadraticPresentationProfile
} from "../animation/quadratic-presentation-profile.ts";
import type { KpQuadraticMethodId } from "../semantic/quadratic-solution-method-graph.ts";
import {
  createCanonicalKpQuadraticParabolaGraphProjection,
  sampleKpQuadraticParabolaGraphFrame,
  type KpQuadraticParabolaGraphFrame
} from "./quadratic-parabola-graph.ts";
import {
  projectKpQuadraticReaderSurface,
  type KpQuadraticReaderSurfaceFrame
} from "../reader/app/quadratic-branching-surface.ts";

export interface KpQuadraticEquationGraphCorrespondence {
  readonly id: string;
  readonly branchId: string;
  readonly branchSign: "minus" | "plus";
  readonly solutionMemberId: string;
  readonly graphSelectorId:
    | "selector.quadratic.graph.root-two"
    | "selector.quadratic.graph.root-three";
}

export interface KpQuadraticEquationGraphFrame {
  readonly schemaVersion: "kp.quadratic-equation-graph-frame.v1";
  readonly id: string;
  readonly sharedClockId: typeof kpQuadraticBranchingTimelineId;
  readonly progress: number;
  readonly progressPermille: number;
  readonly direction: "forward" | "rewind";
  readonly equation: KpQuadraticReaderSurfaceFrame;
  readonly graph: KpQuadraticParabolaGraphFrame;
  readonly graphLocalProgress: number;
  readonly correspondences: readonly KpQuadraticEquationGraphCorrespondence[];
  readonly visibleGraphSelectorIds: readonly string[];
}

/**
 * Samples both views from one playhead. Direction is evidence about travel,
 * never a second interpretation of progress, so direct seek and rewind settle
 * on the same frame at the same playhead position.
 */
export function sampleKpQuadraticEquationGraphFrame(input: {
  readonly progress: number;
  readonly methodId: KpQuadraticMethodId;
  readonly direction?: "forward" | "rewind";
}): KpQuadraticEquationGraphFrame {
  if (!Number.isFinite(input.progress) || input.progress < 0 || input.progress > 1) {
    throw new Error("Quadratic equation-graph progress must be normalized.");
  }
  const direction = input.direction ?? "forward";
  const profile = createCanonicalKpQuadraticPresentationProfile();
  const graphProjection = createCanonicalKpQuadraticParabolaGraphProjection();
  const graphLocalProgress = normalize(
    Math.min(1, Math.max(0,
      (input.progress - profile.graphHandoffAt) /
        (1 - profile.graphHandoffAt)
    ))
  );
  const graph = sampleKpQuadraticParabolaGraphFrame({
    projection: graphProjection,
    progress: graphLocalProgress
  });
  const correspondences = graphProjection.roots.map((root) => Object.freeze({
    id: `correspondence.${input.methodId}.${root.branchSign}.graph`,
    branchId: `branch.${input.methodId}.${root.branchSign}`,
    branchSign: root.branchSign,
    solutionMemberId: root.solutionMemberId,
    graphSelectorId: root.selectorId
  }));
  return Object.freeze({
    schemaVersion: "kp.quadratic-equation-graph-frame.v1" as const,
    id:
      `frame.quadratic.equation-graph.${input.methodId}.` +
      `${direction}.${input.progress.toFixed(4)}`,
    sharedClockId: kpQuadraticBranchingTimelineId,
    progress: input.progress,
    progressPermille: Math.round(input.progress * 1_000),
    direction,
    equation: projectKpQuadraticReaderSurface({
      progress: input.progress,
      methodId: input.methodId
    }),
    graph,
    graphLocalProgress,
    correspondences: Object.freeze(correspondences),
    visibleGraphSelectorIds: graph.activeSelectorIds
  });
}

export function sameKpQuadraticEquationGraphSettlement(
  left: KpQuadraticEquationGraphFrame,
  right: KpQuadraticEquationGraphFrame
): boolean {
  return JSON.stringify({
    progress: left.progress,
    equation: left.equation,
    graph: left.graph,
    correspondences: left.correspondences
  }) === JSON.stringify({
    progress: right.progress,
    equation: right.equation,
    graph: right.graph,
    correspondences: right.correspondences
  });
}

function normalize(value: number): number {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}
