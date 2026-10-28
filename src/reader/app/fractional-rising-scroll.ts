import {
  sampleKpReaderScrollProgress,
  type KpReaderPiecewiseScrollGeometry
} from "../runtime/learner-public-api.ts";

/** Scroll distance allocated while the real paragraph is held in place. */
export function fractionalPassageCadence(availableHeight: number) {
  if (!Number.isFinite(availableHeight) || availableHeight <= 0) {
    throw new Error('Document passages require positive available height.');
  }
  const read = availableHeight * .12;
  const act = availableHeight * .32;
  // The exchange itself is the result-inspection interval. Release immediately
  // at completion instead of adding another blank scroll hold.
  const inspect = 0;
  return { read, act, inspect, hold: read + act + inspect };
}

/** Narrative anchors are natural bottoms of the actual paragraph blocks. */
export function createFractionalRisingScroll(
  narrative: KpReaderPiecewiseScrollGeometry,
  availableHeight: number
): KpReaderPiecewiseScrollGeometry {
  const cadence = fractionalPassageCadence(availableHeight);
  sampleKpReaderScrollProgress(0, narrative);
  const stops = [narrative.stops[0]!];
  for (let index = 1; index < narrative.stops.length; index++) {
    const passage = narrative.stops[index]!;
    const previous = narrative.stops[index - 1]!;
    if (passage.progressPermille === previous.progressPermille) {
      stops.push(passage);
      continue;
    }
    const start = passage.positionPx + cadence.read;
    const end = start + cadence.act;
    if ((narrative.stops[index + 1]?.positionPx ?? Infinity) <= end + cadence.inspect) {
      throw new Error('Document passages need room to read, act and inspect before the next arrival.');
    }
    stops.push(
      { positionPx: passage.positionPx, progressPermille: previous.progressPermille },
      { positionPx: start, progressPermille: previous.progressPermille },
      { positionPx: end, progressPermille: passage.progressPermille }
    );
  }
  return { stops };
}

export function fractionalPassageIndex(positions: readonly number[], position: number) {
  let low = 0, high = positions.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (positions[middle]! <= position) low = middle + 1;
    else high = middle;
  }
  return Math.max(0, low - 1);
}
