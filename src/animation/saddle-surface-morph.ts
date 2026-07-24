import {
  compileExpression,
  type CompiledExpression
} from "../math/expression.ts";
import { createSaddleSurfaceExpression } from "../math/surface-examples.ts";
import type {
  GraphPoint3D,
  NumericDomain,
  Surface3DObject
} from "../semantic/graph.ts";

export interface SaddleSurfaceMorphInput {
  readonly targetDenominator: number;
  readonly progress: number;
}

export interface SaddleSurfaceMorphSample {
  readonly denominator: number;
  readonly progress: number;
  readonly grid: readonly (readonly GraphPoint3D[])[];
}

export function sampleSaddleSurfaceMorph(
  surface: Surface3DObject,
  input: SaddleSurfaceMorphInput
): SaddleSurfaceMorphSample {
  if (surface.parameterization?.kind !== "saddle") {
    throw new Error(`Surface ${surface.id} is not a parameterized saddle.`);
  }

  const progress = clamp(input.progress, 0, 1);
  const denominator = roundCoordinate(
    lerp(
      surface.parameterization.denominator,
      input.targetDenominator,
      progress
    )
  );
  const evaluateSurface = compileExpression(
    createSaddleSurfaceExpression(denominator)
  );

  return {
    denominator,
    progress,
    grid: sampleSurfaceGrid(surface, evaluateSurface)
  };
}

function sampleSurfaceGrid(
  surface: Surface3DObject,
  evaluateSurface: CompiledExpression
): readonly (readonly GraphPoint3D[])[] {
  return sampleDomain(surface.yDomain, surface.ySampleCount).map((y) =>
    sampleDomain(surface.xDomain, surface.xSampleCount).map((x) => ({
      x: roundCoordinate(x),
      y: roundCoordinate(y),
      z: roundCoordinate(evaluateSurface({ x, y }))
    }))
  );
}

function sampleDomain(
  domain: NumericDomain,
  sampleCount: number
): readonly number[] {
  const [min, max] = domain;
  const step = (max - min) / (sampleCount - 1);
  return Array.from({ length: sampleCount }, (_, index) => min + step * index);
}

function roundCoordinate(value: number): number {
  const rounded = Number(value.toFixed(3));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}
