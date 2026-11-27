import type {
  KpAnimationAsset,
  KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import type { KpLawCheckResult, KpLawFailure } from "../semantic/asset-laws.ts";
import { sampleDotProjectionModel, type DotProjectionComponentPairFrame } from "./dot-projection-model-frame.ts";
export type { DotProjectionComponentPairFrame } from "./dot-projection-model-frame.ts";
import {
  compileKpVectorDotProjectionSemanticModel,
  type KpVectorDotProjectionComponentLineage
} from "./vector-dot-projection-semantic-model.ts";

type Vector2 = readonly [number, number];

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
  return {
    id: `dot-projection-frame.${input.runtimeFrame.id}.${target.id}`,
    kind: "dot-projection-runtime-frame",
    animationId: input.animation.id,
    runtimeFrameId: input.runtimeFrame.id,
    renderTargetId: target.id,
    progress: input.runtimeFrame.clock.progress,
    ...sampleDotProjectionModel(model, graphProgress),
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
