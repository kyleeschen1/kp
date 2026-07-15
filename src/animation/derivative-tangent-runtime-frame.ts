import type {
  KpAnimationAsset,
  KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import { tangentStateAt } from "./derivative-tangent-adapter.ts";
import type { KpLawCheckResult, KpLawFailure } from "../semantic/asset-laws.ts";

export interface DerivativeTangentRuntimeFrame {
  readonly id: string;
  readonly kind: "derivative-tangent-runtime-frame";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly renderTargetId: string;
  readonly graphId: string;
  readonly curveId: string;
  readonly derivativeExpressionId: string;
  readonly progress: number;
  readonly graphProgress: number;
  readonly x: number;
  readonly y: number;
  readonly slope: number;
  readonly intercept: number;
  readonly tangentSegment: readonly [
    readonly [number, number],
    readonly [number, number]
  ];
  readonly activeTransformationIds: readonly string[];
}

export function sampleDerivativeTangentRuntimeFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
}): DerivativeTangentRuntimeFrame {
  const target = input.animation.renderTargets.find(
    (candidate) =>
      candidate.kind === "graph" &&
      candidate.metadata?.["graphMotionKind"] === "derivative-tangent-motion"
  );

  if (target === undefined) {
    throw new Error(
      `Animation ${input.animation.id} has no derivative tangent graph target.`
    );
  }

  const graphId = metadataString(target.metadata?.["graphId"], "graphId");
  const curveId = metadataString(target.metadata?.["curveId"], "curveId");
  const derivativeExpressionId = metadataString(
    target.metadata?.["derivativeExpressionId"],
    "derivativeExpressionId"
  );
  const sourceState = tangentStateValue(
    input.animation,
    metadataString(target.metadata?.["sourceStateId"], "sourceStateId")
  );
  const targetState = tangentStateValue(
    input.animation,
    metadataString(target.metadata?.["targetStateId"], "targetStateId")
  );
  const graphProgress = input.runtimeFrame.clock.direction === "rewind"
    ? 1 - input.runtimeFrame.clock.progress
    : input.runtimeFrame.clock.progress;
  const x = sourceState.x + (targetState.x - sourceState.x) * graphProgress;
  const state = tangentStateAt(x);
  const tangentHalfWidth = 0.75;
  const leftX = x - tangentHalfWidth;
  const rightX = x + tangentHalfWidth;

  return {
    id: `derivative-tangent-frame.${input.runtimeFrame.id}.${target.id}`,
    kind: "derivative-tangent-runtime-frame",
    animationId: input.animation.id,
    runtimeFrameId: input.runtimeFrame.id,
    renderTargetId: target.id,
    graphId,
    curveId,
    derivativeExpressionId,
    progress: input.runtimeFrame.clock.progress,
    graphProgress,
    ...state,
    tangentSegment: [
      [leftX, state.slope * leftX + state.intercept],
      [rightX, state.slope * rightX + state.intercept]
    ],
    activeTransformationIds: [...input.runtimeFrame.activeTransformationIds]
  };
}

export function checkDerivativeTangentRuntimeLaw(input: {
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

    if (!nearlyEqual(forward.slope, 3 * forward.x ** 2, epsilon)) {
      failures.push({
        path: `samples[${index}].slope`,
        message: `Tangent slope ${forward.slope} does not equal 3x^2 at x=${forward.x}.`
      });
    }

    if (!nearlyEqual(forward.y, forward.slope * forward.x + forward.intercept, epsilon)) {
      failures.push({
        path: `samples[${index}].point`,
        message: `Tangent line does not pass through the sampled curve point at x=${forward.x}.`
      });
    }

    if (
      !nearlyEqual(forward.x, rewind.x, epsilon) ||
      !nearlyEqual(forward.y, rewind.y, epsilon) ||
      !nearlyEqual(forward.slope, rewind.slope, epsilon) ||
      !nearlyEqual(forward.intercept, rewind.intercept, epsilon)
    ) {
      failures.push({
        path: `samples[${index}].rewind`,
        message: `Mirrored rewind tangent does not match forward progress ${progress}.`
      });
    }
  });

  return {
    lawId: "graph-runtime.derivative-tangent",
    passed: failures.length === 0,
    failures
  };
}

function sampleAt(
  animation: KpAnimationAsset,
  direction: KpAnimationAssetTransformationTreeDirection,
  progress: number
): DerivativeTangentRuntimeFrame {
  return sampleDerivativeTangentRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction,
      progress
    })
  });
}

function tangentStateValue(animation: KpAnimationAsset, objectId: string) {
  const object = animation.bundle.objects.find(
    (candidate) => candidate.id === objectId
  );
  const value = object?.value as {
    readonly x?: unknown;
    readonly y?: unknown;
    readonly slope?: unknown;
    readonly intercept?: unknown;
  } | undefined;

  if (
    typeof value?.x !== "number" ||
    typeof value.y !== "number" ||
    typeof value.slope !== "number" ||
    typeof value.intercept !== "number"
  ) {
    throw new Error(
      `Animation ${animation.id} tangent state ${objectId} must be numeric.`
    );
  }

  return value as {
    readonly x: number;
    readonly y: number;
    readonly slope: number;
    readonly intercept: number;
  };
}

function metadataString(value: unknown, key: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Derivative tangent target requires ${key} metadata.`);
  }

  return value;
}

function nearlyEqual(left: number, right: number, epsilon: number): boolean {
  return Math.abs(left - right) <= epsilon;
}
