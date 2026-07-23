import type { EasingName } from "../rendering/equation-motion-plan.ts";
import {
  kpRadicalConventionalMorphProfile
} from "./radical-morph-profile.ts";

export const kpRadicalNativeSettlementStart =
  kpRadicalConventionalMorphProfile.settlement.start;
export const kpRadicalNativeSettlementEnd =
  kpRadicalConventionalMorphProfile.settlement.end;
export const kpRadicalNativeSettlementGeometryTolerancePx = 0.25;

export interface KpRadicalNativeSettlementFrame {
  readonly phase:
    | "material-fragments"
    | "waiting-for-native-geometry"
    | "native-handoff"
    | "native-geometry";
  readonly geometryReady: boolean;
  readonly maximumGeometryResidualPx: number;
  readonly progress: number;
  readonly fragmentOpacity: number;
  readonly nativeOpacity: number;
}

export function sampleKpRadicalNativeSettlement(input: {
  readonly semanticProgress: number;
  readonly fragmentRects: readonly KpRadicalSettlementRect[];
  readonly nativeRect: KpRadicalSettlementRect;
  readonly geometryTolerancePx?: number | undefined;
  readonly handoffStart?: number | undefined;
  readonly handoffEnd?: number | undefined;
  readonly easing?: EasingName | undefined;
}): KpRadicalNativeSettlementFrame {
  const semanticProgress = clamp01(input.semanticProgress);
  const maximumGeometryResidualPx = input.fragmentRects.reduce(
    (maximum, rect) => Math.max(maximum, rectResidual(rect, input.nativeRect)),
    0
  );
  const tolerance = input.geometryTolerancePx ??
    kpRadicalNativeSettlementGeometryTolerancePx;
  const geometryReady = input.fragmentRects.length > 0 &&
    maximumGeometryResidualPx <= tolerance;
  const handoffStart = input.handoffStart ??
    kpRadicalNativeSettlementStart;
  const handoffEnd = input.handoffEnd ??
    kpRadicalNativeSettlementEnd;
  if (handoffEnd <= handoffStart) {
    throw new Error("Radical native settlement requires an ordered handoff window.");
  }
  const requestedProgress = sampleEasing(
    input.easing ?? kpRadicalConventionalMorphProfile.settlement.easing,
    intervalProgress(semanticProgress, handoffStart, handoffEnd)
  );
  // Native ink cannot crossfade safely while semantic fragment anchors are
  // still in transit; a delayed font/layout pass therefore holds ownership.
  const progress = geometryReady ? requestedProgress : 0;
  const phase = progress >= 1
    ? "native-geometry"
    : progress > 0
      ? "native-handoff"
      : semanticProgress >= handoffStart
        ? "waiting-for-native-geometry"
        : "material-fragments";
  return {
    phase,
    geometryReady,
    maximumGeometryResidualPx,
    progress,
    fragmentOpacity: 1 - progress,
    nativeOpacity: progress
  };
}

export interface KpRadicalSettlementRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

function rectResidual(
  left: KpRadicalSettlementRect,
  right: KpRadicalSettlementRect
): number {
  return Math.max(
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.height - right.height)
  );
}

function intervalProgress(value: number, start: number, end: number): number {
  return clamp01((value - start) / (end - start));
}

function sampleEasing(easing: EasingName, value: number): number {
  switch (easing) {
    case "linear":
      return value;
    case "ease-in":
      return value * value;
    case "ease-out":
      return 1 - (1 - value) * (1 - value);
    case "ease-in-out":
      return value * value * (3 - 2 * value);
    default:
      return assertNever(easing);
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function assertNever(value: never): never {
  throw new Error(`Unhandled radical settlement easing ${value}.`);
}
