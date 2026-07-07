import type { SaddleDenominatorAnimationIntent } from "../semantic/animation.ts";
import {
  createSaddleSurface3D,
  type Surface3DObject
} from "../semantic/graph.ts";
import {
  sampleSaddleSurfaceMorph,
  type SaddleSurfaceMorphSample
} from "../rendering/graph-svg.ts";

export interface NumberTweenInput {
  from: number;
  to: number;
  durationMs: number;
  easing: "ease-in-out" | "linear";
  frameCount: number;
}

export interface NumberTweenFrame {
  timeMs: number;
  progress: number;
  easedProgress: number;
  value: number;
}

export interface SaddleDenominatorAnimationFrame
  extends SaddleSurfaceMorphSample {
  timeMs: number;
  easedProgress: number;
}

export function createNumberTweenFrames(
  input: NumberTweenInput
): readonly NumberTweenFrame[] {
  if (!Number.isFinite(input.durationMs) || input.durationMs <= 0) {
    throw new Error("Tween durationMs must be positive.");
  }

  if (!Number.isInteger(input.frameCount) || input.frameCount < 2) {
    throw new Error("Tween frameCount must be an integer of at least 2.");
  }

  return Array.from({ length: input.frameCount }, (_, index) => {
    const progress = roundCoordinate(index / (input.frameCount - 1));
    const easedProgress = roundCoordinate(easeProgress(progress, input.easing));
    const value = roundCoordinate(
      input.from + (input.to - input.from) * easedProgress
    );

    return {
      timeMs: roundCoordinate(input.durationMs * progress),
      progress,
      easedProgress,
      value
    };
  });
}

export function sampleSaddleDenominatorAnimationFrames(
  surface: Surface3DObject,
  intent: SaddleDenominatorAnimationIntent,
  frameCount: number
): readonly SaddleDenominatorAnimationFrame[] {
  if (surface.id !== intent.targetId) {
    throw new Error(
      `Animation ${intent.id} targets ${intent.targetId}, not ${surface.id}.`
    );
  }

  const sourceSurface = createSaddleSurface3D({
    id: surface.id,
    graphId: surface.graphId,
    denominator: intent.from,
    xDomain: surface.xDomain,
    yDomain: surface.yDomain,
    xSampleCount: surface.xSampleCount,
    ySampleCount: surface.ySampleCount
  });

  return createNumberTweenFrames({
    from: intent.from,
    to: intent.to,
    durationMs: intent.durationMs,
    easing: intent.easing,
    frameCount
  }).map((frame) => {
    const sample = sampleSaddleSurfaceMorph(sourceSurface, {
      targetDenominator: intent.to,
      progress: frame.easedProgress
    });

    return {
      ...sample,
      timeMs: frame.timeMs,
      easedProgress: frame.easedProgress
    };
  });
}

function easeProgress(
  progress: number,
  easing: NumberTweenInput["easing"]
): number {
  const boundedProgress = clamp(progress, 0, 1);

  return easing === "linear"
    ? boundedProgress
    : (1 - Math.cos(Math.PI * boundedProgress)) / 2;
}

function roundCoordinate(value: number): number {
  const rounded = Number(value.toFixed(3));

  return Object.is(rounded, -0) ? 0 : rounded;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
