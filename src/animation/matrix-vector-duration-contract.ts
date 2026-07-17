export const KP_MATRIX_VECTOR_ROW_MINIMUM_DURATION_MS = 1_000;
export const KP_MATRIX_VECTOR_ENVELOPE_LEAD_MS = 200;
export const KP_MATRIX_VECTOR_ENVELOPE_RELEASE_MS = 200;

export function matrixVectorSemanticDurationMs(rowCount: number): number {
  if (!Number.isInteger(rowCount) || rowCount <= 0) {
    throw new Error("Matrix-vector pacing requires a positive row count.");
  }
  return KP_MATRIX_VECTOR_ENVELOPE_LEAD_MS +
    rowCount * KP_MATRIX_VECTOR_ROW_MINIMUM_DURATION_MS +
    KP_MATRIX_VECTOR_ENVELOPE_RELEASE_MS;
}
