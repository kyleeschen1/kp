import type { EasingName } from "./easing.ts";
import {
  kpRadicalConventionalMorphProfile
} from "./radical-morph-profile.ts";

export const kpRadicalNativeSettlementStart =
  kpRadicalConventionalMorphProfile.settlement.start;
export const kpRadicalNativeSettlementEnd =
  kpRadicalConventionalMorphProfile.settlement.end;
export const kpRadicalSourceNativeSettlementStart =
  kpRadicalConventionalMorphProfile.morph.start;
export const kpRadicalSourceNativeSettlementEnd =
  kpRadicalConventionalMorphProfile.morph.start + 0.04;
export const kpRadicalNativeSettlementGeometryTolerancePx = 0.25;

export interface KpRadicalNativeSettlementFrame {
  readonly endpoint: "source" | "target";
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
  return sampleKpRadicalCompositeNativeSettlement({
    ...input,
    endpoint: "target",
    handoffStart: input.handoffStart ??
      kpRadicalNativeSettlementStart,
    handoffEnd: input.handoffEnd ??
      kpRadicalNativeSettlementEnd
  });
}

export function sampleKpRadicalCompositeNativeSettlement(input: {
  readonly endpoint: "source" | "target";
  readonly semanticProgress: number;
  readonly fragmentRects: readonly KpRadicalSettlementRect[];
  readonly nativeRect: KpRadicalSettlementRect;
  readonly geometryTolerancePx?: number | undefined;
  readonly handoffStart: number;
  readonly handoffEnd: number;
  readonly easing?: EasingName | undefined;
}): KpRadicalNativeSettlementFrame {
  const semanticProgress = clamp01(input.semanticProgress);
  const compositeRect = composeKpRadicalSettlementRect(input.fragmentRects);
  const maximumGeometryResidualPx = compositeRect === undefined
    ? Number.POSITIVE_INFINITY
    : rectResidual(compositeRect, input.nativeRect);
  const tolerance = input.geometryTolerancePx ??
    kpRadicalNativeSettlementGeometryTolerancePx;
  const geometryReady = compositeRect !== undefined &&
    maximumGeometryResidualPx <= tolerance;
  const handoffStart = input.handoffStart;
  const handoffEnd = input.handoffEnd;
  if (handoffEnd <= handoffStart) {
    throw new Error("Radical native settlement requires an ordered handoff window.");
  }
  const handoffProgress = sampleEasing(
    input.easing ?? kpRadicalConventionalMorphProfile.settlement.easing,
    intervalProgress(semanticProgress, handoffStart, handoffEnd)
  );
  const handoffComplete = handoffProgress >= 1;
  const requestedNativeOpacity = input.endpoint === "target"
    ? handoffComplete ? 1 : 0
    : 1 - handoffProgress;
  // Treat the fraction as one measured block: the source may crossfade as a
  // group to hide renderer raster differences, but its children never transfer
  // independently or compare their boxes to the whole native parent.
  const requiresGeometry = input.endpoint === "target"
    ? semanticProgress >= handoffStart
    : semanticProgress > handoffStart && semanticProgress <= handoffEnd;
  const nativeOpacity = geometryReady || !requiresGeometry
    ? requestedNativeOpacity
    : input.endpoint === "source"
      ? 1
      : 0;
  const phase = !geometryReady && requiresGeometry
    ? "waiting-for-native-geometry"
    : handoffProgress > 0 && handoffProgress < 1
      ? "native-handoff"
    : nativeOpacity >= 1
      ? "native-geometry"
      : nativeOpacity > 0
        ? "native-handoff"
        : "material-fragments";
  return {
    endpoint: input.endpoint,
    phase,
    geometryReady,
    maximumGeometryResidualPx,
    progress: nativeOpacity,
    fragmentOpacity: 1 - nativeOpacity,
    nativeOpacity
  };
}

export interface KpRadicalSettlementRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export function composeKpRadicalSettlementRect(
  rects: readonly KpRadicalSettlementRect[]
): KpRadicalSettlementRect | undefined {
  if (rects.length === 0) return undefined;
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
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
