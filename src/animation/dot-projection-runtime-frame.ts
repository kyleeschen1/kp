import type {
  KpAnimationAsset,
  KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import type { KpLawCheckResult, KpLawFailure } from "../semantic/asset-laws.ts";
import {
  kpVectorDotProjectionExemplarContract
} from "./vector-dot-projection-exemplar-contract.ts";
import {
  compileKpVectorDotProjectionSemanticModel,
  type KpVectorDotProjectionComponentLineage,
  type KpVectorDotProjectionSemanticModel
} from "./vector-dot-projection-semantic-model.ts";

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

export interface DotProjectionRuntimeFrame {
  readonly id: string;
  readonly kind: "dot-projection-runtime-frame";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly renderTargetId: string;
  readonly progress: number;
  readonly graphProgress: number;
  readonly semanticBeatId: string;
  readonly semanticBeatProgress: number;
  readonly leftVector: Vector2;
  readonly rightVector: Vector2;
  readonly sourceNormSquared: number;
  readonly targetNormSquared: number;
  readonly dotProduct: number;
  readonly projectionScale: number;
  readonly projectionVector: Vector2;
  readonly orthogonalVector: Vector2;
  readonly angleRadians: number | null;
  readonly dropPoint: Vector2;
  readonly projectionDropProgress: number;
  readonly residualRevealProgress: number;
  readonly rightAngleVisible: boolean;
  readonly componentPairs: readonly DotProjectionComponentPairFrame[];
  readonly componentLineage: readonly KpVectorDotProjectionComponentLineage[];
  readonly accessibleDescription: string;
  readonly activeTransformationIds: readonly string[];
}

export function sampleDotProjectionRuntimeFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
}): DotProjectionRuntimeFrame {
  const target = input.animation.renderTargets.find(
    (candidate) =>
      candidate.kind === "graph" &&
      candidate.metadata?.["graphMotionKind"] === "dot-projection-motion"
  );

  if (target === undefined) {
    throw new Error(
      `Animation ${input.animation.id} has no dot-projection graph target.`
    );
  }

  const leftVectorId = metadataString(
    target.metadata?.["leftVectorId"],
    "leftVectorId"
  );
  const rightVectorId = metadataString(
    target.metadata?.["rightVectorId"],
    "rightVectorId"
  );
  const projectionVectorId = metadataString(
    target.metadata?.["projectionVectorId"],
    "projectionVectorId"
  );
  const residualVectorId = metadataString(
    target.metadata?.["orthogonalVectorId"],
    "orthogonalVectorId"
  );
  const left = vectorValue(
    input.animation,
    leftVectorId
  );
  const right = vectorValue(
    input.animation,
    rightVectorId
  );
  const semanticResult = compileKpVectorDotProjectionSemanticModel({
    id: metadataString(target.metadata?.["semanticModelId"], "semanticModelId"),
    sourceVectorId: leftVectorId,
    targetVectorId: rightVectorId,
    projectionVectorId,
    residualVectorId,
    sourceVector: left,
    targetVector: right
  });
  if (semanticResult.status !== "compiled") {
    throw new Error(
      semanticResult.diagnostics[0]?.message ??
      "Dot-projection semantic model failed to compile."
    );
  }
  const model = semanticResult.model;
  const graphProgress = input.runtimeFrame.clock.direction === "rewind"
    ? 1 - input.runtimeFrame.clock.progress
    : input.runtimeFrame.clock.progress;
  const beat = semanticBeat(graphProgress);
  const projectionDropProgress = intervalProgress(graphProgress, 5 / 8, 6 / 8);
  const residualRevealProgress = intervalProgress(graphProgress, 6 / 8, 7 / 8);

  return {
    id: `dot-projection-frame.${input.runtimeFrame.id}.${target.id}`,
    kind: "dot-projection-runtime-frame",
    animationId: input.animation.id,
    runtimeFrameId: input.runtimeFrame.id,
    renderTargetId: target.id,
    progress: input.runtimeFrame.clock.progress,
    graphProgress,
    semanticBeatId: beat.id,
    semanticBeatProgress: beat.progress,
    leftVector: left,
    rightVector: right,
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
    activeTransformationIds: [...input.runtimeFrame.activeTransformationIds]
  };
}

export function checkDotProjectionRuntimeLaw(input: {
  readonly animation: KpAnimationAsset;
  readonly sampleProgresses?: readonly number[] | undefined;
  readonly epsilon?: number | undefined;
}): KpLawCheckResult {
  const samples = input.sampleProgresses ?? Array.from(
    { length: 65 },
    (_, index) => index / 64
  );
  const epsilon = input.epsilon ?? 1e-9;
  const failures: KpLawFailure[] = [];

  samples.forEach((progress, index) => {
    const forward = sampleAt(input.animation, "forward", progress);
    const rewind = sampleAt(input.animation, "rewind", 1 - progress);

    if (Math.abs(dot(forward.orthogonalVector, forward.rightVector)) > epsilon) {
      failures.push({
        path: `samples[${index}].orthogonalVector`,
        message: "Projection residual must be orthogonal to the target vector."
      });
    }

    if (
      !vectorNear(
        add(forward.projectionVector, forward.orthogonalVector),
        forward.leftVector,
        epsilon
      ) ||
      Math.abs(cross(forward.projectionVector, forward.rightVector)) > epsilon
    ) {
      failures.push({
        path: `samples[${index}].decomposition`,
        message: "Projection plus residual must equal the source and remain collinear with the target."
      });
    }

    if (
      forward.componentPairs.reduce((sum, pair) => sum + pair.product, 0) !==
      forward.dotProduct
    ) {
      failures.push({
        path: `samples[${index}].componentPairs`,
        message: "Indexed component products must sum to the dot product."
      });
    }

    if (
      !vectorNear(forward.dropPoint, rewind.dropPoint, epsilon) ||
      Math.abs(forward.dotProduct - rewind.dotProduct) > epsilon ||
      forward.semanticBeatId !== rewind.semanticBeatId ||
      JSON.stringify(forward.componentPairs) !==
        JSON.stringify(rewind.componentPairs)
    ) {
      failures.push({
        path: `samples[${index}].rewind`,
        message: `Mirrored projection rewind does not match forward progress ${progress}.`
      });
    }
  });

  return {
    lawId: "graph-runtime.dot-projection",
    passed: failures.length === 0,
    failures
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
  return [
    left[0] + (right[0] - left[0]) * progress,
    left[1] + (right[1] - left[1]) * progress
  ];
}

function sampleAt(
  animation: KpAnimationAsset,
  direction: KpAnimationAssetTransformationTreeDirection,
  progress: number
): DotProjectionRuntimeFrame {
  return sampleDotProjectionRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction,
      progress
    })
  });
}

function vectorValue(animation: KpAnimationAsset, id: string): Vector2 {
  const coordinates = (animation.bundle.objects.find(
    (object) => object.id === id
  )?.value as { readonly coordinates?: unknown } | undefined)?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    coordinates.some((value) => typeof value !== "number")
  ) {
    throw new Error(`Animation ${animation.id} vector ${id} must be two-dimensional.`);
  }

  return [coordinates[0] as number, coordinates[1] as number];
}

function dot(left: Vector2, right: Vector2): number {
  return left[0] * right[0] + left[1] * right[1];
}

function add(left: Vector2, right: Vector2): Vector2 {
  return [left[0] + right[0], left[1] + right[1]];
}

function cross(left: Vector2, right: Vector2): number {
  return left[0] * right[1] - left[1] * right[0];
}

function vectorNear(left: Vector2, right: Vector2, epsilon: number): boolean {
  return (
    Math.abs(left[0] - right[0]) <= epsilon &&
    Math.abs(left[1] - right[1]) <= epsilon
  );
}

function metadataString(value: unknown, key: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Dot-projection target requires ${key} metadata.`);
  }

  return value;
}
