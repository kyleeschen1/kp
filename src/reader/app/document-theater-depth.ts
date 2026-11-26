import { documentPassageIndex } from './document-theater-scroll.ts';

/** Presentation-only depth, sampled from the measured document clock. Never
 * infer it from transformed DOM bounds: that would feed paint back into motion. */
export function documentTheaterDepth(position: number, bottoms: readonly number[], heights: readonly number[]) {
  const nearby = documentPassageIndex(bottoms, position);
  const smooth = (value: number) => {
    const t = Math.min(1, Math.max(0, value));
    return t * t * (3 - 2 * t);
  };
  let depth = 0;
  for (const index of [nearby, nearby + 1]) {
    const bottom = bottoms[index], height = heights[index];
    if (bottom === undefined || height === undefined) continue;
    // The small lead lets the expression dip just before paper crosses it.
    const entry = smooth((position - (bottom - height) + 24) / 24);
    const exit = smooth((bottom + 24 - position) / 24);
    depth = Math.max(depth, entry * exit);
  }
  return depth;
}
