import {
  sampleKpReaderScrollProgress,
  type KpReaderPiecewiseScrollGeometry
} from "../runtime/continuous-scroll-clock.ts";

/** Local reading cadence; registered mathematical programs keep their clocks. */
export function createFractionalRisingScroll(
  narrative: KpReaderPiecewiseScrollGeometry,
  availableHeight: number
): KpReaderPiecewiseScrollGeometry {
  if (!Number.isFinite(availableHeight) || availableHeight <= 0) {
    throw new Error("Rising passages require positive available height.");
  }
  sampleKpReaderScrollProgress(0, narrative); // Validate the measured/authored boundary.
  const stops = [narrative.stops[0]!];
  for (let index = 1; index < narrative.stops.length; index += 1) {
    const passage = narrative.stops[index]!;
    const previous = narrative.stops[index - 1]!;
    const start = passage.positionPx + availableHeight * 0.14;
    // Reserve the next caption's exchange plus a result hold. Text must never
    // compete with an unfinished mathematical operation.
    const end = Math.min(start + availableHeight * 0.32,
      (narrative.stops[index + 1]?.positionPx ?? Infinity) - availableHeight * 0.28);
    if (end <= start) throw new Error("Captions need room to read before animation.");
    stops.push(
      { positionPx: passage.positionPx, progressPermille: previous.progressPermille },
      { positionPx: start, progressPermille: previous.progressPermille },
      { positionPx: end, progressPermille: passage.progressPermille }
    );
  }
  return { stops };
}

/** One scroll-derived projection for caption presence and the approaching cue. */
export function fractionalCaptionFrame(positions: readonly number[], position: number, height: number) {
  if (positions.length === 0) return undefined;
  let index = 0;
  while (index + 1 < positions.length && positions[index + 1]! <= position) index += 1;
  const start = positions[index]!;
  const next = positions[index + 1];
  const exchangeStart = next === undefined ? start + height * 0.46 : next - height * 0.18;
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  return {
    index,
    nextIndex: next === undefined ? undefined : index + 1,
    preview: next === undefined ? 0 : clamp((position - (next - height * .26)) / (height * .08)),
    exchange: next === undefined ? 0 : clamp((position - exchangeStart) / (next - exchangeStart))
  };
}
