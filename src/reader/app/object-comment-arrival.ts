/** Provisional single-exemplar pose, sampled by the document's scroll clock.
 * Arrival finishes before the reading hold; withdrawal finishes before math. */
export interface ObjectCommentPose {
  readonly emergence: number;
  readonly withdrawal: number;
  readonly released?: boolean;
}
const unit = (value: number) => Math.max(0, Math.min(1, value));
export function objectCommentArrival(offset: number, approach: number, essential: boolean): ObjectCommentPose | undefined {
  if (!Number.isFinite(offset) || !Number.isFinite(approach) || approach < 80)
    throw new Error('Object commentary requires finite distance and a clear approach corridor.');
  if (offset < -approach || offset >= 100) return undefined;
  if (essential) return { emergence: 1, withdrawal: 0 };
  return { emergence: unit((offset + approach - 32) / (approach - 52)), withdrawal: unit((offset - 72) / 28) };
}
