import type { GraphPoint3D } from "../semantic/graph.ts";

export type GraphQuad3D = readonly [
  GraphPoint3D,
  GraphPoint3D,
  GraphPoint3D,
  GraphPoint3D
];

export interface ShadowPointProjectionInput {
  lightDirection: GraphPoint3D;
  planeZ: number;
  point: GraphPoint3D;
}

export interface ShadowQuadProjectionInput {
  corners: GraphQuad3D;
  lightDirection: GraphPoint3D;
  planeZ: number;
}

export function projectPointToShadowPlane(
  input: ShadowPointProjectionInput
): GraphPoint3D | undefined {
  if (input.lightDirection.z <= 0 || input.point.z < input.planeZ) {
    return undefined;
  }

  const distance = (input.point.z - input.planeZ) / input.lightDirection.z;

  return {
    x: input.point.x - input.lightDirection.x * distance,
    y: input.point.y - input.lightDirection.y * distance,
    z: input.planeZ
  };
}

export function projectQuadToShadowPlane(
  input: ShadowQuadProjectionInput
): GraphQuad3D | undefined {
  const first = projectPointToShadowPlane({
    lightDirection: input.lightDirection,
    planeZ: input.planeZ,
    point: input.corners[0]
  });
  const second = projectPointToShadowPlane({
    lightDirection: input.lightDirection,
    planeZ: input.planeZ,
    point: input.corners[1]
  });
  const third = projectPointToShadowPlane({
    lightDirection: input.lightDirection,
    planeZ: input.planeZ,
    point: input.corners[2]
  });
  const fourth = projectPointToShadowPlane({
    lightDirection: input.lightDirection,
    planeZ: input.planeZ,
    point: input.corners[3]
  });

  if (
    first === undefined ||
    second === undefined ||
    third === undefined ||
    fourth === undefined
  ) {
    return undefined;
  }

  return [first, second, third, fourth];
}
