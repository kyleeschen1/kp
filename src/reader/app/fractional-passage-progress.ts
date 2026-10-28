import type { KpReaderPiecewiseScrollGeometry } from '../runtime/continuous-scroll-clock.ts';

/** Local operation ownership: equal equation states can occur in several holds. */
export function fractionalPassageOperation(start: number, end: number) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end > 1000 || end <= start) {
    throw new Error('A passage operation requires increasing checkpoints within 0–1000.');
  }
  const clamp = (value: number) => {
    if (!Number.isFinite(value)) throw new Error('Passage progress must be finite.');
    return Math.max(0, Math.min(1, value));
  };
  return {
    fraction: (progress: number) => clamp((progress - start) / (end - start)),
    seek(geometry: KpReaderPiecewiseScrollGeometry, fraction: number) {
      const amount = clamp(fraction);
      const index = geometry.stops.findIndex((stop, i) => stop.progressPermille === start
        && geometry.stops[i + 1]?.progressPermille === end);
      const source = geometry.stops[index];
      const target = geometry.stops[index + 1];
      if (index < 0 || source === undefined || target === undefined || target.positionPx <= source.positionPx) {
        throw new Error('Passage operation is missing its increasing scroll interval.');
      }
      return {
        progress: start + (end - start) * amount,
        position: source.positionPx + (target.positionPx - source.positionPx) * amount
      };
    }
  };
}
