import { kpVectorDotProjectionExemplarContract } from './vector-dot-projection-exemplar-contract.ts';
import type { KpVectorDotProjectionSemanticModel } from './vector-dot-projection-semantic-model.ts';
type Vector2 = readonly [number, number];

export interface DotProjectionComponentPairFrame {
  readonly index: 0 | 1;
  readonly axis: "x" | "y";
  readonly product: number;
  readonly cumulativeDotProduct: number;
  readonly status: "pending" | "active" | "accumulated";
  readonly lineageId: string;
  readonly sourceGeometryId: string;
  readonly targetGeometryId: string;
  readonly projectionGeometryId: string;
}

/** Both catalogue and editable hosts sample the same domain-owned sequence.
 * A prepared model avoids recompilation during playback; no host owns timing. */
export function sampleDotProjectionModel(model: KpVectorDotProjectionSemanticModel, graphProgress: number) {
  if (!Number.isFinite(graphProgress) || graphProgress < 0 || graphProgress > 1)
    throw new RangeError('Projection progress must be between zero and one.');
  const beat = semanticBeat(graphProgress);
  const projectionDropProgress = intervalProgress(graphProgress, 5 / 8, 6 / 8);
  const residualRevealProgress = intervalProgress(graphProgress, 6 / 8, 7 / 8);

  return {
    graphProgress,
    semanticBeatId: beat.id,
    semanticBeatProgress: beat.progress,
    leftVector: model.sourceVector,
    rightVector: model.targetVector,
    sourceNormSquared: model.sourceNormSquared,
    targetNormSquared: model.targetNormSquared,
    dotProduct: model.dotProduct,
    projectionScale: model.projectionScale.value,
    projectionVector: model.projectionVector,
    orthogonalVector: model.residualVector,
    angleRadians: model.angleRadians,
    dropPoint: interpolate(
      model.sourceVector,
      model.projectionVector,
      projectionDropProgress
    ),
    projectionDropProgress,
    residualRevealProgress,
    rightAngleVisible: graphProgress >= 7 / 8,
    componentPairs: componentPairFrames(model, graphProgress),
    componentLineage: model.componentLineage,
    accessibleDescription: model.accessibleDescription,
  };
}

function componentPairFrames(
  model: KpVectorDotProjectionSemanticModel,
  graphProgress: number
): readonly DotProjectionComponentPairFrame[] {
  const activeIndex = graphProgress < 1 / 8
    ? -1
    : graphProgress < 2 / 8
      ? 0
      : graphProgress < 3 / 8
        ? 1
        : 2;
  return model.componentLineage.map((lineage) => Object.freeze({
    index: lineage.index,
    axis: lineage.axis,
    product: lineage.product,
    cumulativeDotProduct: lineage.cumulativeDotProduct,
    status: activeIndex > lineage.index
      ? "accumulated" as const
      : activeIndex === lineage.index
        ? "active" as const
        : "pending" as const,
    lineageId: lineage.id,
    sourceGeometryId: lineage.sourceGeometryId,
    targetGeometryId: lineage.targetGeometryId,
    projectionGeometryId: lineage.projectionGeometryId
  }));
}

function semanticBeat(progress: number): {
  readonly id: string;
  readonly progress: number;
} {
  const beatIds = kpVectorDotProjectionExemplarContract.beatIds;
  if (progress >= 1) {
    return { id: beatIds[beatIds.length - 1]!, progress: 1 };
  }
  const scaled = Math.max(0, progress) * beatIds.length;
  const index = Math.min(beatIds.length - 1, Math.floor(scaled));
  return { id: beatIds[index]!, progress: scaled - index };
}

function intervalProgress(
  progress: number,
  start: number,
  end: number
): number {
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

function interpolate(left: Vector2, right: Vector2, progress: number): Vector2 {
  if (progress === 0) return left;
  if (progress === 1) return right;
  return [
    left[0] + (right[0] - left[0]) * progress,
    left[1] + (right[1] - left[1]) * progress
  ];
}

