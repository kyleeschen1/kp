/** Document scroll distance allocated while the real paragraph is held. */
export function documentPassageCadence(availableHeight: number) {
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
