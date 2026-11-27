/** Document scroll distance allocated while the real paragraph is held.
 * Keep this self-contained: the compiler embeds it before reader hydration. */
export function documentPassageCadence(availableHeight: number) {
  if (!Number.isFinite(availableHeight) || availableHeight <= 0) {
    throw new Error('Document passages require positive available height.');
  }
  // A smaller stage must not increase the scroll gesture's sensitivity. Use
  // CSS-pixel distances near the established desktop pace; viewport height
  // still validates the mounted surface, but only layout depends on its size.
  const read = 100;
  const act = 280;
  // The exchange itself is the result-inspection interval. Release immediately
  // at completion instead of adding another blank scroll hold.
  const inspect = 0;
  return { read, act, inspect, hold: read + act + inspect };
}
