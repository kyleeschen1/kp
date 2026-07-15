import type {
  KpAnimationAsset,
  KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import type { KpLawCheckResult, KpLawFailure } from "../semantic/asset-laws.ts";

type Vector2 = readonly [number, number];

export interface DotProjectionRuntimeFrame {
  readonly id: string;
  readonly kind: "dot-projection-runtime-frame";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly renderTargetId: string;
  readonly progress: number;
  readonly graphProgress: number;
  readonly leftVector: Vector2;
  readonly rightVector: Vector2;
  readonly dotProduct: number;
  readonly projectionVector: Vector2;
  readonly orthogonalVector: Vector2;
  readonly angleRadians: number;
  readonly dropPoint: Vector2;
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

  const left = vectorValue(
    input.animation,
    metadataString(target.metadata?.["leftVectorId"], "leftVectorId")
  );
  const right = vectorValue(
    input.animation,
    metadataString(target.metadata?.["rightVectorId"], "rightVectorId")
  );
  const dotProduct = dot(left, right);
  const rightNormSquared = dot(right, right);

  if (rightNormSquared === 0) {
    throw new Error("Dot-projection target vector must be non-zero.");
  }

  const scale = dotProduct / rightNormSquared;
  const projection: Vector2 = [right[0] * scale, right[1] * scale];
  const orthogonal: Vector2 = [
    left[0] - projection[0],
    left[1] - projection[1]
  ];
  const graphProgress = input.runtimeFrame.clock.direction === "rewind"
    ? 1 - input.runtimeFrame.clock.progress
    : input.runtimeFrame.clock.progress;
  const leftNorm = Math.hypot(...left);
  const rightNorm = Math.hypot(...right);

  return {
    id: `dot-projection-frame.${input.runtimeFrame.id}.${target.id}`,
    kind: "dot-projection-runtime-frame",
    animationId: input.animation.id,
    runtimeFrameId: input.runtimeFrame.id,
    renderTargetId: target.id,
    progress: input.runtimeFrame.clock.progress,
    graphProgress,
    leftVector: left,
    rightVector: right,
    dotProduct,
    projectionVector: projection,
    orthogonalVector: orthogonal,
    angleRadians: Math.acos(dotProduct / (leftNorm * rightNorm)),
    dropPoint: [
      left[0] + (projection[0] - left[0]) * graphProgress,
      left[1] + (projection[1] - left[1]) * graphProgress
    ],
    activeTransformationIds: [...input.runtimeFrame.activeTransformationIds]
  };
}

export function checkDotProjectionRuntimeLaw(input: {
  readonly animation: KpAnimationAsset;
  readonly sampleProgresses?: readonly number[] | undefined;
  readonly epsilon?: number | undefined;
}): KpLawCheckResult {
  const samples = input.sampleProgresses ?? [0, 0.25, 0.5, 0.75, 1];
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
      !vectorNear(forward.dropPoint, rewind.dropPoint, epsilon) ||
      Math.abs(forward.dotProduct - rewind.dotProduct) > epsilon
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
