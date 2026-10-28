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
    const start = passage.positionPx + availableHeight * 0.05;
    const end = Math.min(start + availableHeight * 0.32,
      (narrative.stops[index + 1]?.positionPx ?? Infinity) - 1);
    if (end <= start) throw new Error("Rising passages need room to clear before animation.");
    stops.push(
      { positionPx: passage.positionPx, progressPermille: previous.progressPermille },
      { positionPx: start, progressPermille: previous.progressPermille },
      { positionPx: end, progressPermille: passage.progressPermille }
    );
  }
  return { stops };
}
