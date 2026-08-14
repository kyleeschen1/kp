import type { KpEigenvectorPoint } from "./eigenvector-math.ts";

export const kpEigenvectorSvgViewport = Object.freeze({
  width: 520,
  height: 400,
  origin: [260, 210] as const,
  unit: 26
});

export function projectKpEigenvectorSvgPoint(
  coordinates: KpEigenvectorPoint
): KpEigenvectorPoint {
  return [
    kpEigenvectorSvgViewport.origin[0] +
      coordinates[0] * kpEigenvectorSvgViewport.unit,
    kpEigenvectorSvgViewport.origin[1] -
      coordinates[1] * kpEigenvectorSvgViewport.unit
  ];
}
