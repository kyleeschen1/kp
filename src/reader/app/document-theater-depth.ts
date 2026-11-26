import { documentPassageIndex } from './document-theater-scroll.ts';

/** Presentation-only depth, sampled from the measured document clock. Never
 * infer it from transformed DOM bounds: that would feed paint back into motion. */
export function documentTheaterDepth(position: number, bottoms: readonly number[], heights: readonly number[], equationHeight: number) {
  const nearby = documentPassageIndex(bottoms, position);
  const smooth = (value: number) => {
    const t = Math.min(1, Math.max(0, value));
    return t * t * (3 - 2 * t);
  };
  let depth = 0;
  for (const index of [nearby, nearby + 1]) {
    const bottom = bottoms[index], height = heights[index];
    if (bottom === undefined || height === undefined) continue;
    // Descend before the paper reaches any part of the reserved equation box;
    // resurface only after the entire box clears, in either scroll direction.
    const clearance = equationHeight / 2 + 24;
    const entry = smooth((position - (bottom - height) + clearance) / 24);
    const exit = smooth((bottom + clearance - position) / 24);
    depth = Math.max(depth, entry * exit);
  }
  return depth;
}
