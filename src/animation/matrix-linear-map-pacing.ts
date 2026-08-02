import type { KpAnimationAsset } from "./asset.ts";

export const kpMatrixLinearMapPacingId =
  "kp.matrix-linear-map.deliberate-holds.v1";

export const KP_MATRIX_LINEAR_MAP_LEAD_MS = 800;
export const KP_MATRIX_LINEAR_MAP_ROW_MS = 3_600;
export const KP_MATRIX_LINEAR_MAP_RELEASE_MS = 4_000;
export const KP_MATRIX_LINEAR_MAP_DURATION_MS =
  KP_MATRIX_LINEAR_MAP_LEAD_MS +
  2 * KP_MATRIX_LINEAR_MAP_ROW_MS +
  KP_MATRIX_LINEAR_MAP_RELEASE_MS;

export function hasKpMatrixLinearMapPacing(
  animation: KpAnimationAsset
): boolean {
  return animation.metadata?.["matrixLinearMapPacing"] ===
    kpMatrixLinearMapPacingId;
}
