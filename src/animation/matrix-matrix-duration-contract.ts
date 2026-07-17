export const KP_MATRIX_MATRIX_CELL_MINIMUM_DURATION_MS = 1_000;
export const KP_MATRIX_MATRIX_ENVELOPE_LEAD_MS = 200;
export const KP_MATRIX_MATRIX_ENVELOPE_RELEASE_MS = 200;

export function matrixMatrixSemanticDurationMs(cellCount: number): number {
  if (!Number.isInteger(cellCount) || cellCount <= 0) {
    throw new Error("Matrix-matrix pacing requires a positive cell count.");
  }
  return KP_MATRIX_MATRIX_ENVELOPE_LEAD_MS +
    cellCount * KP_MATRIX_MATRIX_CELL_MINIMUM_DURATION_MS +
    KP_MATRIX_MATRIX_ENVELOPE_RELEASE_MS;
}
