import {
  kpPlaceValueAdditionVisualReference as reference
} from "../reader/compiler/place-value-addition-visual-reference.ts";

export type KpPlaceValueAdditionAccessibilityMode =
  | "full-motion"
  | "reduced-motion"
  | "static"
  | "narrated";

/**
 * Non-full-motion modes can only expose whole semantic checkpoints. Keeping
 * this conversion outside the renderer prevents reduced motion from becoming
 * an alternate animation implementation with different mathematical states.
 */
export function settleKpPlaceValueAdditionAccessibilityProgress(input: {
  readonly progress: number;
  readonly mode: KpPlaceValueAdditionAccessibilityMode;
}): number {
  const bounded = Number.isFinite(input.progress)
    ? Math.max(0, Math.min(1, input.progress))
    : 0;
  if (input.mode === "full-motion") return bounded;
  const index = Math.min(
    reference.beats.length - 1,
    Math.max(0, Math.ceil(bounded * reference.beats.length) - 1)
  );
  return reference.beats[index]!.endPermille / 1_000;
}
