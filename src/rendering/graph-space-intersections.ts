import {
  compileExpression,
  type MathExpression
} from "../math/expression.ts";
import type { GraphPoint3D } from "../semantic/graph.ts";
import type { GraphLine3D } from "./projection.ts";

export interface LineSurfaceDepthSample {
  point: GraphPoint3D;
  signedDepth: number;
  surfaceZ: number;
}

export interface LineSurfaceIntersection extends LineSurfaceDepthSample {
  t: number;
}

export interface LineSurfaceIntersectionOptions {
  epsilon?: number;
  iterations?: number;
  sampleCount?: number;
}

export type LineSurfaceDepthFunction = (t: number) => LineSurfaceDepthSample;

const DEFAULT_INTERSECTION_EPSILON = 1e-9;
const DEFAULT_INTERSECTION_ITERATIONS = 32;
const DEFAULT_INTERSECTION_SAMPLE_COUNT = 64;

export function signedLineSurfaceDepthAt(
  line: GraphLine3D,
  surfaceExpression: MathExpression,
  t: number
): LineSurfaceDepthSample {
  return compileLineSurfaceDepthFunction(line, surfaceExpression)(t);
}

export function compileLineSurfaceDepthFunction(
  line: GraphLine3D,
  surfaceExpression: MathExpression
): LineSurfaceDepthFunction {
  const evaluateSurface = compileExpression(surfaceExpression);

  return (t) => {
    const point = interpolateGraphPoint3D(line.from, line.to, t);
    const surfaceZ = evaluateSurface({
      x: point.x,
      y: point.y
    });

    return {
      point,
      surfaceZ,
      signedDepth: point.z - surfaceZ
    };
  };
}

export function findLineSurfaceIntersections(
  line: GraphLine3D,
  surfaceExpression: MathExpression,
  options: LineSurfaceIntersectionOptions = {}
): readonly LineSurfaceIntersection[] {
  const depthAt = compileLineSurfaceDepthFunction(line, surfaceExpression);
  const sampleCount = Math.max(
    1,
    Math.floor(options.sampleCount ?? DEFAULT_INTERSECTION_SAMPLE_COUNT)
  );
  const epsilon = options.epsilon ?? DEFAULT_INTERSECTION_EPSILON;
  const intersections: LineSurfaceIntersection[] = [];
  let previous = lineSurfaceDepthAtT(depthAt, 0);

  if (isRootSample(previous, epsilon)) {
    pushDistinctIntersection(intersections, previous, epsilon);
  }

  for (let sampleIndex = 1; sampleIndex <= sampleCount; sampleIndex += 1) {
    const current = lineSurfaceDepthAtT(depthAt, sampleIndex / sampleCount);

    if (isRootSample(current, epsilon)) {
      pushDistinctIntersection(intersections, current, epsilon);
    } else if (hasSignChange(previous, current)) {
      pushDistinctIntersection(
        intersections,
        bisectLineSurfaceIntersection(
          depthAt,
          previous,
          current,
          options.iterations ?? DEFAULT_INTERSECTION_ITERATIONS,
          epsilon
        ),
        epsilon
      );
    }

    previous = current;
  }

  return intersections;
}

export function interpolateGraphPoint3D(
  from: GraphPoint3D,
  to: GraphPoint3D,
  t: number
): GraphPoint3D {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t
  };
}

function lineSurfaceDepthAtT(
  depthAt: LineSurfaceDepthFunction,
  t: number
): LineSurfaceIntersection {
  return {
    ...depthAt(t),
    t
  };
}

function bisectLineSurfaceIntersection(
  depthAt: LineSurfaceDepthFunction,
  from: LineSurfaceIntersection,
  to: LineSurfaceIntersection,
  iterations: number,
  epsilon: number
): LineSurfaceIntersection {
  let low = from;
  let high = to;

  for (let index = 0; index < iterations; index += 1) {
    const midpoint = lineSurfaceDepthAtT(depthAt, (low.t + high.t) / 2);

    if (isRootSample(midpoint, epsilon)) {
      return midpoint;
    }

    if (hasSignChange(low, midpoint)) {
      high = midpoint;
    } else {
      low = midpoint;
    }
  }

  return lineSurfaceDepthAtT(depthAt, (low.t + high.t) / 2);
}

function pushDistinctIntersection(
  intersections: LineSurfaceIntersection[],
  intersection: LineSurfaceIntersection,
  epsilon: number
): void {
  const previous = intersections[intersections.length - 1];

  if (
    previous !== undefined &&
    Math.abs(previous.t - intersection.t) <= epsilon
  ) {
    return;
  }

  intersections.push(intersection);
}

function isRootSample(
  intersection: LineSurfaceIntersection,
  epsilon: number
): boolean {
  return Math.abs(intersection.signedDepth) <= epsilon;
}

function hasSignChange(
  from: LineSurfaceIntersection,
  to: LineSurfaceIntersection
): boolean {
  return from.signedDepth * to.signedDepth < 0;
}
