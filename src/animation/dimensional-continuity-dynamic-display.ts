import type { ExactRationalDto } from "../../protocols/public-api.ts";

export const kpDimensionalContinuityDynamicDisplayDecimals = 2;

export function formatKpDimensionalContinuityDynamicDisplay(
  value: ExactRationalDto
): string {
  const numeric = Number(value.numerator) / Number(value.denominator);
  return numeric.toFixed(kpDimensionalContinuityDynamicDisplayDecimals);
}

export function kpDimensionalContinuityDynamicDisplayRelation(
  isInterpolating: boolean
): "=" | "\\approx" {
  return isInterpolating ? "\\approx" : "=";
}
