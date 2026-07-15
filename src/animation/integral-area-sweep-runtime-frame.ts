import type {
  KpAnimationAsset,
  KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import { areaSweepStateAt } from "./integral-area-sweep-adapter.ts";
import type { KpLawCheckResult, KpLawFailure } from "../semantic/asset-laws.ts";

export interface IntegralAreaSweepRuntimeFrame {
  readonly id: string;
  readonly kind: "integral-area-sweep-runtime-frame";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly renderTargetId: string;
  readonly graphId: string;
  readonly curveId: string;
  readonly expressionId: string;
  readonly progress: number;
  readonly graphProgress: number;
  readonly lowerBound: number;
  readonly upperBound: number;
  readonly accumulatedArea: number;
  readonly integrandAtUpperBound: number;
  readonly areaPolygon: readonly (readonly [number, number])[];
  readonly activeTransformationIds: readonly string[];
}

export function sampleIntegralAreaSweepRuntimeFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly sampleCount?: number | undefined;
}): IntegralAreaSweepRuntimeFrame {
  const target = input.animation.renderTargets.find(
    (candidate) =>
      candidate.kind === "graph" &&
      candidate.metadata?.["graphMotionKind"] === "integral-area-sweep"
  );

  if (target === undefined) {
    throw new Error(
      `Animation ${input.animation.id} has no integral area-sweep target.`
    );
  }

  const sourceState = stateValue(
    input.animation,
    metadataString(target.metadata?.["sourceStateId"], "sourceStateId")
  );
  const targetState = stateValue(
    input.animation,
    metadataString(target.metadata?.["targetStateId"], "targetStateId")
  );
  const graphProgress = input.runtimeFrame.clock.direction === "rewind"
    ? 1 - input.runtimeFrame.clock.progress
    : input.runtimeFrame.clock.progress;
  const upperBound =
    sourceState.upperBound +
    (targetState.upperBound - sourceState.upperBound) * graphProgress;
  const state = areaSweepStateAt(upperBound);
  const sampleCount = Math.max(2, Math.floor(input.sampleCount ?? 25));
  const curvePoints = Array.from({ length: sampleCount }, (_, index) => {
    const x = upperBound * (index / (sampleCount - 1));
    return [x, x ** 2] as const;
  });

  return {
    id: `integral-area-frame.${input.runtimeFrame.id}.${target.id}`,
    kind: "integral-area-sweep-runtime-frame",
    animationId: input.animation.id,
    runtimeFrameId: input.runtimeFrame.id,
    renderTargetId: target.id,
    graphId: metadataString(target.metadata?.["graphId"], "graphId"),
    curveId: metadataString(target.metadata?.["curveId"], "curveId"),
    expressionId: metadataString(
      target.metadata?.["expressionId"],
      "expressionId"
    ),
    progress: input.runtimeFrame.clock.progress,
    graphProgress,
    ...state,
    areaPolygon: [[0, 0], ...curvePoints, [upperBound, 0]],
    activeTransformationIds: [...input.runtimeFrame.activeTransformationIds]
  };
}

export function checkIntegralAreaSweepRuntimeLaw(input: {
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

    if (!near(forward.accumulatedArea, forward.upperBound ** 3 / 3, epsilon)) {
      failures.push({
        path: `samples[${index}].accumulatedArea`,
        message: `Accumulated area does not equal x^3/3 at x=${forward.upperBound}.`
      });
    }

    if (!near(forward.integrandAtUpperBound, forward.upperBound ** 2, epsilon)) {
      failures.push({
        path: `samples[${index}].integrandAtUpperBound`,
        message: `Accumulation derivative does not equal the integrand at x=${forward.upperBound}.`
      });
    }

    if (
      !near(forward.upperBound, rewind.upperBound, epsilon) ||
      !near(forward.accumulatedArea, rewind.accumulatedArea, epsilon)
    ) {
      failures.push({
        path: `samples[${index}].rewind`,
        message: `Mirrored area-sweep rewind does not match forward progress ${progress}.`
      });
    }
  });

  return {
    lawId: "graph-runtime.integral-area-sweep",
    passed: failures.length === 0,
    failures
  };
}

function sampleAt(
  animation: KpAnimationAsset,
  direction: KpAnimationAssetTransformationTreeDirection,
  progress: number
): IntegralAreaSweepRuntimeFrame {
  return sampleIntegralAreaSweepRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction,
      progress
    })
  });
}

function stateValue(animation: KpAnimationAsset, objectId: string) {
  const value = animation.bundle.objects.find(
    (object) => object.id === objectId
  )?.value as {
    readonly lowerBound?: unknown;
    readonly upperBound?: unknown;
    readonly accumulatedArea?: unknown;
    readonly integrandAtUpperBound?: unknown;
  } | undefined;

  if (
    typeof value?.lowerBound !== "number" ||
    typeof value.upperBound !== "number" ||
    typeof value.accumulatedArea !== "number" ||
    typeof value.integrandAtUpperBound !== "number"
  ) {
    throw new Error(
      `Animation ${animation.id} area state ${objectId} must be numeric.`
    );
  }

  return value as {
    readonly lowerBound: number;
    readonly upperBound: number;
    readonly accumulatedArea: number;
    readonly integrandAtUpperBound: number;
  };
}

function metadataString(value: unknown, key: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Integral area-sweep target requires ${key} metadata.`);
  }

  return value;
}

function near(left: number, right: number, epsilon: number): boolean {
  return Math.abs(left - right) <= epsilon;
}
