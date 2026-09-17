/** Viewport-relative DOMRect subtraction introduces tiny rounding differences
 * without a native layout change. Font identity remains an exact comparison. */
export function sameDerivationNativeMetrics(before: readonly (number | string)[], after: readonly (number | string)[]) {
  return before.length === after.length && after.every((value, i) => {
    const previous = before[i];
    return typeof value === 'number' && typeof previous === 'number'
      ? Number.isFinite(value) && Number.isFinite(previous) && Math.abs(value - previous) < .01
      : value === previous;
  });
}
