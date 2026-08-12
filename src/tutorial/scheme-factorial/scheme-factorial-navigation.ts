export interface KpSchemeFactorialSeekPoint {
  readonly id: string;
  readonly progress: number;
}

export function findKpSchemeFactorialAdjacentCheckpoint(
  checkpoints: readonly KpSchemeFactorialSeekPoint[],
  progress: number,
  direction: -1 | 1
): KpSchemeFactorialSeekPoint | null {
  const epsilon = 1e-6;
  if (direction === 1) {
    return checkpoints.find((checkpoint) =>
      checkpoint.progress > progress + epsilon) ?? null;
  }
  for (let index = checkpoints.length - 1; index >= 0; index -= 1) {
    const checkpoint = checkpoints[index]!;
    if (checkpoint.progress < progress - epsilon) return checkpoint;
  }
  return null;
}
