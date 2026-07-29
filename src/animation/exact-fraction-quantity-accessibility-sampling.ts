import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";

export type KpExactFractionQuantityAccessibilityMode =
  | "full-motion"
  | "reduced-motion"
  | "static"
  | "narrated";

/**
 * Non-full-motion modes sample only certified native endpoints. The generic
 * player may advance in equal fifths, while this exemplar's authored pacing
 * ends at 18/40/56/82/100%; this adapter is the sole conversion between those
 * two coordinates.
 */
export function settleKpExactFractionQuantityAccessibilityProgress(input: {
  readonly progress: number;
  readonly mode: KpExactFractionQuantityAccessibilityMode;
}): number {
  const bounded = Number.isFinite(input.progress)
    ? Math.max(0, Math.min(1, input.progress))
    : 0;
  if (input.mode === "full-motion") return bounded;
  const index = Math.min(
    manifest.checkpoints.length - 1,
    Math.max(0, Math.ceil(bounded * manifest.checkpoints.length) - 1)
  );
  return manifest.checkpoints[index]!.progressPermille / 1_000;
}
