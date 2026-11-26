/** Integer reader checkpoints and equal semantic phases are different scales.
 * Interpolate between their exact boundaries instead of using an epsilon snap. */
export function projectEquationCheckpointProgress(progress: number, count: number): number {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1 || !Number.isInteger(count) || count < 1 || count > 1000)
    throw new Error('Require normalized progress and distinct integer phase checkpoints.');
  const p = progress * 1000;
  for (let i = 1; i <= count; i++) {
    const start = Math.round((i - 1) * 1000 / count), end = Math.round(i * 1000 / count);
    if (p <= end) return ((i - 1) + (p - start) / (end - start)) / count;
  }
  return 1;
}
