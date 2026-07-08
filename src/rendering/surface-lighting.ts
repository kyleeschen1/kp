import type { GraphPoint3D, NumericDomain } from "../semantic/graph.ts";

export type SurfaceFacing = "back" | "front";

export interface SurfaceLight {
  direction: GraphPoint3D;
  ambient: number;
  diffuse: number;
  depthHaze: number;
  specular: number;
  rim: number;
}

export interface SurfaceQuadFillInput {
  center: GraphPoint3D;
  depthHaze: number;
  facing: SurfaceFacing;
  light: SurfaceLight;
  normal: GraphPoint3D;
  viewDirection: GraphPoint3D;
  xDomain: NumericDomain;
  yDomain: NumericDomain;
}

export const DEFAULT_SURFACE_LIGHT: SurfaceLight = {
  direction: { x: -0.35, y: -0.45, z: 0.82 },
  ambient: 0.45,
  diffuse: 0.4,
  depthHaze: 1,
  specular: 0.12,
  rim: 0.08
};

export function surfaceQuadFill(input: SurfaceQuadFillInput): string {
  const maxX = Math.max(Math.abs(input.xDomain[0]), Math.abs(input.xDomain[1]));
  const maxY = Math.max(Math.abs(input.yDomain[0]), Math.abs(input.yDomain[1]));
  const zSpan = Math.max((Math.max(maxX, maxY) ** 2) / 4, 1);
  const normalizedHeight = clamp((input.center.z + zSpan) / (zSpan * 2), 0, 1);
  const normal = normalizePoint3D(input.normal);
  const lightDirection = normalizePoint3D(input.light.direction);
  const viewDirection = normalizePoint3D(input.viewDirection);
  const diffuseAlignment = Math.max(0, dotPoint3D(normal, lightDirection));
  const specularAlignment = diffuseAlignment === 0
    ? 0
    : Math.max(
        0,
        dotPoint3D(reflectPoint3D(lightDirection, normal), viewDirection)
      );
  const rimAlignment = 1 - Math.abs(dotPoint3D(normal, viewDirection));
  const brightness = clamp(
    input.light.ambient +
      diffuseAlignment * input.light.diffuse +
      Math.pow(specularAlignment, 16) * input.light.specular +
      Math.pow(rimAlignment, 2) * input.light.rim,
    0,
    0.9
  );
  const hue = input.facing === "front"
    ? 188 + Math.round(normalizedHeight * 18)
    : 206 + Math.round(normalizedHeight * 18);
  const baseSaturation = input.facing === "front" ? 58 : 48;
  const baseLightness = input.facing === "front"
    ? 42 + brightness * 20
    : 62 + brightness * 10;
  const haze = input.depthHaze * input.light.depthHaze;
  const saturation = Math.round(
    clamp(baseSaturation - haze * 8, 34, 64)
  );
  const lightness = Math.round(
    clamp(baseLightness + haze * 6, 35, 78)
  );

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function normalizePoint3D(point: GraphPoint3D): GraphPoint3D {
  const length = Math.hypot(point.x, point.y, point.z);

  if (length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  return {
    x: point.x / length,
    y: point.y / length,
    z: point.z / length
  };
}

function dotPoint3D(left: GraphPoint3D, right: GraphPoint3D): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function reflectPoint3D(vector: GraphPoint3D, normal: GraphPoint3D): GraphPoint3D {
  const scale = 2 * dotPoint3D(normal, vector);

  return normalizePoint3D({
    x: scale * normal.x - vector.x,
    y: scale * normal.y - vector.y,
    z: scale * normal.z - vector.z
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
