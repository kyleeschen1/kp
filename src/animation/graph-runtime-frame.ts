import type {
  KpAnimationAsset,
  KpAnimationAssetRenderTarget,
  KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame,
  type KpAnimationRuntimeRenderTargetFrame
} from "./runtime-sampler.ts";
import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";
import type {
  KpAssetMetadataValue
} from "../semantic/asset.ts";

export interface SampleLinearMapVectorGraphRuntimeFrameInput {
  readonly animation: KpAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
}

export interface LinearMapVectorGraphRuntimeFrame {
  readonly id: string;
  readonly kind: "graph-vector-runtime-frame";
  readonly animationId: string;
  readonly renderTargetId: string;
  readonly graphId: string;
  readonly linearMapId: string;
  readonly sourceVectorId: string;
  readonly targetVectorId: string;
  readonly runtimeFrameId: string;
  readonly phaseId: string;
  readonly progress: number;
  readonly graphProgress: number;
  readonly beat?: number | undefined;
  readonly activeTransformationIds: readonly string[];
  readonly sourceCoordinates: readonly number[];
  readonly targetCoordinates: readonly number[];
  readonly currentCoordinates: readonly number[];
  readonly pathCoordinates: readonly (readonly number[])[];
}

export interface CheckLinearMapVectorGraphRewindLawInput {
  readonly animation: KpAnimationAsset;
  readonly sampleProgresses?: readonly number[] | undefined;
  readonly epsilon?: number | undefined;
}

export function sampleLinearMapVectorGraphRuntimeFrame(
  input: SampleLinearMapVectorGraphRuntimeFrameInput
): LinearMapVectorGraphRuntimeFrame {
  const target = findLinearMapVectorRenderTarget(input.animation);
  const activeTarget = findActiveRenderTarget(input.runtimeFrame, target.id);
  const graphId = target.objectIds?.find((objectId) =>
    objectId.startsWith("graph.")
  );
  const linearMapId = metadataString(target.metadata?.["linearMapId"]);
  const sourceVectorId = metadataString(target.metadata?.["sourceVectorId"]);
  const targetVectorId = metadataString(target.metadata?.["targetVectorId"]);

  if (graphId === undefined) {
    throw new Error(`Graph render target ${target.id} must reference a graph object.`);
  }

  if (
    linearMapId === undefined ||
    sourceVectorId === undefined ||
    targetVectorId === undefined
  ) {
    throw new Error(
      `Graph render target ${target.id} must define linear map and vector metadata.`
    );
  }

  const sourceCoordinates = vectorCoordinates(input.animation, sourceVectorId);
  const targetCoordinates = vectorCoordinates(input.animation, targetVectorId);
  const progress = input.runtimeFrame.clock.progress;
  const graphProgress = graphLocalProgress({
    direction: input.runtimeFrame.clock.direction,
    progress
  });
  const currentCoordinates = interpolateCoordinates({
    sourceCoordinates,
    targetCoordinates,
    progress: graphProgress
  });

  return {
    id: `graph-frame.${input.runtimeFrame.id}.${target.id}`,
    kind: "graph-vector-runtime-frame",
    animationId: input.animation.id,
    renderTargetId: target.id,
    graphId,
    linearMapId,
    sourceVectorId,
    targetVectorId,
    runtimeFrameId: input.runtimeFrame.id,
    phaseId: input.runtimeFrame.phase.phaseId,
    progress,
    graphProgress,
    ...(input.runtimeFrame.clock.beat === undefined
      ? {}
      : { beat: input.runtimeFrame.clock.beat }),
    activeTransformationIds: [...activeTarget.activeTransformationIds],
    sourceCoordinates,
    targetCoordinates,
    currentCoordinates,
    pathCoordinates: [sourceCoordinates, targetCoordinates]
  };
}

export function checkLinearMapVectorGraphRewindLaw(
  input: CheckLinearMapVectorGraphRewindLawInput
): KpLawCheckResult {
  const sampleProgresses = input.sampleProgresses ?? [0, 0.25, 0.5, 0.75, 1];
  const epsilon = input.epsilon ?? 1e-9;
  const failures: KpLawFailure[] = [];

  sampleProgresses.forEach((progress, index) => {
    const forward = sampleGraphRuntimeFrameAt({
      animation: input.animation,
      direction: "forward",
      progress
    });
    const rewind = sampleGraphRuntimeFrameAt({
      animation: input.animation,
      direction: "rewind",
      progress: 1 - progress
    });

    if (
      !coordinatesNearlyEqual(
        forward.currentCoordinates,
        rewind.currentCoordinates,
        epsilon
      )
    ) {
      failures.push({
        path: `sampleProgresses[${index}]`,
        message:
          `Graph rewind sample at ${1 - progress} did not match forward sample at ${progress}.`
      });
    }
  });

  return {
    lawId: "graph-runtime.linear-map-vector.rewind",
    passed: failures.length === 0,
    failures
  };
}

function sampleGraphRuntimeFrameAt(input: {
  readonly animation: KpAnimationAsset;
  readonly direction: KpAnimationAssetTransformationTreeDirection;
  readonly progress: number;
}): LinearMapVectorGraphRuntimeFrame {
  return sampleLinearMapVectorGraphRuntimeFrame({
    animation: input.animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation: input.animation,
      direction: input.direction,
      progress: input.progress
    })
  });
}

function findLinearMapVectorRenderTarget(
  animation: KpAnimationAsset
): KpAnimationAssetRenderTarget {
  const target = animation.renderTargets.find(
    (candidate) =>
      candidate.kind === "graph" &&
      candidate.metadata?.["graphMotionKind"] === "linear-map-vector-motion"
  );

  if (target === undefined) {
    throw new Error(
      `Animation ${animation.id} does not include a linear-map vector graph render target.`
    );
  }

  return target;
}

function findActiveRenderTarget(
  runtimeFrame: KpAnimationRuntimeFrame,
  renderTargetId: string
): KpAnimationRuntimeRenderTargetFrame {
  const target = runtimeFrame.activeRenderTargets.find(
    (candidate) => candidate.id === renderTargetId
  );

  if (target === undefined) {
    throw new Error(
      `Runtime frame ${runtimeFrame.id} does not activate render target ${renderTargetId}.`
    );
  }

  return target;
}

function vectorCoordinates(
  animation: KpAnimationAsset,
  vectorId: string
): readonly number[] {
  const object = animation.bundle.objects.find(
    (candidate) => candidate.id === vectorId
  );
  const coordinates = (object?.value as { readonly coordinates?: unknown })
    .coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length === 0 ||
    coordinates.some((coordinate) => typeof coordinate !== "number")
  ) {
    throw new Error(
      `Animation ${animation.id} vector ${vectorId} must define numeric coordinates.`
    );
  }

  return [...coordinates];
}

function graphLocalProgress(input: {
  readonly direction: KpAnimationAssetTransformationTreeDirection;
  readonly progress: number;
}): number {
  return input.direction === "rewind" ? 1 - input.progress : input.progress;
}

function interpolateCoordinates(input: {
  readonly sourceCoordinates: readonly number[];
  readonly targetCoordinates: readonly number[];
  readonly progress: number;
}): readonly number[] {
  if (input.sourceCoordinates.length !== input.targetCoordinates.length) {
    throw new Error("Vector coordinate dimensions must match.");
  }

  return input.sourceCoordinates.map((source, index) => {
    const target = input.targetCoordinates[index] ?? source;

    return source + (target - source) * input.progress;
  });
}

function coordinatesNearlyEqual(
  left: readonly number[],
  right: readonly number[],
  epsilon: number
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (value, index) => Math.abs(value - (right[index] ?? value)) <= epsilon
    )
  );
}

function metadataString(
  value: KpAssetMetadataValue | undefined
): string | undefined {
  return typeof value === "string" ? value : undefined;
}
