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

export type LineSurfaceDepthFunction = (t: number) => LineSurfaceDepthSample;

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
