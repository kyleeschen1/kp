import type {
  KpAnimationAsset,
  KpAnimationAssetTransformationTreeDirection
} from "./asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import { secantTangentStateAt } from "./derivative-tangent-adapter.ts";
import type { KpLawCheckResult, KpLawFailure } from "../semantic/asset-laws.ts";

export interface DerivativeTangentRuntimeFrame {
  readonly id: string;
  readonly kind: "derivative-tangent-runtime-frame";
  readonly animationId: string;
  readonly runtimeFrameId: string;
  readonly renderTargetId: string;
  readonly graphId: string;
  readonly curveId: string;
  readonly sourceExpressionId: string;
  readonly derivativeExpressionId: string;
  readonly contextLatex: string;
  readonly differenceQuotientLatex: string;
  readonly derivativeDisplayLatex: string;
  readonly convergenceLatex: string;
  readonly currentSampleLatex: string;
  readonly progress: number;
  readonly graphProgress: number;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly h: number;
  readonly movingX: number;
  readonly movingY: number;
  readonly secantSlope: number;
  readonly secantIntercept: number;
  readonly tangentSlope: number;
  readonly tangentIntercept: number;
  readonly movingPointOpacity: number;
  readonly derivativeRevealProgress: number;
  readonly secantSegment: readonly [
    readonly [number, number],
    readonly [number, number]
  ];
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
  const sourceExpressionId = metadataString(
    target.metadata?.["sourceExpressionId"],
    "sourceExpressionId"
  );
  const contextLatex = metadataString(target.metadata?.["contextLatex"], "contextLatex");
  const differenceQuotientLatex = metadataString(
    target.metadata?.["differenceQuotientLatex"],
    "differenceQuotientLatex"
  );
  const derivativeDisplayLatex = metadataString(
    target.metadata?.["derivativeDisplayLatex"],
    "derivativeDisplayLatex"
  );
  const convergenceLatex = metadataString(
    target.metadata?.["convergenceLatex"],
    "convergenceLatex"
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
  const h = sourceState.h + (targetState.h - sourceState.h) * graphProgress;
  const state = secantTangentStateAt(sourceState.anchorX, h);
  const lineHalfWidth = 1.25;
  const leftX = state.anchorX - lineHalfWidth;
  const rightX = state.anchorX + lineHalfWidth;
  const movingPointOpacity = Math.min(1, Math.max(0, h / sourceState.h));
  const derivativeRevealProgress = smoothstep(0.55, 1, graphProgress);

  return {
    id: `derivative-tangent-frame.${input.runtimeFrame.id}.${target.id}`,
    kind: "derivative-tangent-runtime-frame",
    animationId: input.animation.id,
    runtimeFrameId: input.runtimeFrame.id,
    renderTargetId: target.id,
    graphId,
    curveId,
    sourceExpressionId,
    derivativeExpressionId,
    contextLatex,
    differenceQuotientLatex,
    derivativeDisplayLatex,
    convergenceLatex,
    currentSampleLatex:
      `h=${formatLatexNumber(h)},\\quad m_{\\mathrm{sec}}=${formatLatexNumber(state.secantSlope)}`,
    progress: input.runtimeFrame.clock.progress,
    graphProgress,
    ...state,
    movingPointOpacity,
    derivativeRevealProgress,
    secantSegment: [
      [leftX, state.secantSlope * leftX + state.secantIntercept],
      [rightX, state.secantSlope * rightX + state.secantIntercept]
    ],
    tangentSegment: [
      [leftX, state.tangentSlope * leftX + state.tangentIntercept],
      [rightX, state.tangentSlope * rightX + state.tangentIntercept]
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

    const expectedFiniteSlope =
      forward.h === 0
        ? forward.tangentSlope
        : (forward.movingY - forward.anchorY) / forward.h;

    if (!nearlyEqual(forward.secantSlope, expectedFiniteSlope, epsilon)) {
      failures.push({
        path: `samples[${index}].secantSlope`,
        message:
          `Secant slope ${forward.secantSlope} does not equal the finite difference quotient ${expectedFiniteSlope}.`
      });
    }

    if (
      !nearlyEqual(
        forward.anchorY,
        forward.secantSlope * forward.anchorX + forward.secantIntercept,
        epsilon
      ) ||
      !nearlyEqual(
        forward.movingY,
        forward.secantSlope * forward.movingX + forward.secantIntercept,
        epsilon
      )
    ) {
      failures.push({
        path: `samples[${index}].secant`,
        message: "Secant line does not pass through both sampled curve points."
      });
    }

    if (
      !nearlyEqual(forward.h, rewind.h, epsilon) ||
      !nearlyEqual(forward.movingX, rewind.movingX, epsilon) ||
      !nearlyEqual(forward.movingY, rewind.movingY, epsilon) ||
      !nearlyEqual(forward.secantSlope, rewind.secantSlope, epsilon) ||
      !nearlyEqual(forward.secantIntercept, rewind.secantIntercept, epsilon)
    ) {
      failures.push({
        path: `samples[${index}].rewind`,
        message: `Mirrored rewind tangent does not match forward progress ${progress}.`
      });
    }

    if (
      progress === 1 &&
      !nearlyEqual(forward.secantSlope, forward.tangentSlope, epsilon)
    ) {
      failures.push({
        path: `samples[${index}].limit`,
        message: "The h=0 secant limit does not settle onto the tangent slope."
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
    readonly anchorX?: unknown;
    readonly anchorY?: unknown;
    readonly h?: unknown;
    readonly movingX?: unknown;
    readonly movingY?: unknown;
    readonly secantSlope?: unknown;
    readonly secantIntercept?: unknown;
    readonly tangentSlope?: unknown;
    readonly tangentIntercept?: unknown;
  } | undefined;

  if (
    typeof value?.anchorX !== "number" ||
    typeof value.anchorY !== "number" ||
    typeof value.h !== "number" ||
    typeof value.movingX !== "number" ||
    typeof value.movingY !== "number" ||
    typeof value.secantSlope !== "number" ||
    typeof value.secantIntercept !== "number" ||
    typeof value.tangentSlope !== "number" ||
    typeof value.tangentIntercept !== "number"
  ) {
    throw new Error(
      `Animation ${animation.id} secant-tangent state ${objectId} must be numeric.`
    );
  }

  return value as {
    readonly anchorX: number;
    readonly anchorY: number;
    readonly h: number;
    readonly movingX: number;
    readonly movingY: number;
    readonly secantSlope: number;
    readonly secantIntercept: number;
    readonly tangentSlope: number;
    readonly tangentIntercept: number;
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

function formatLatexNumber(value: number): string {
  const rounded = Number(value.toFixed(2));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function smoothstep(start: number, end: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}
