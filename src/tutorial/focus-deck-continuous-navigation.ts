/** Continuous input is bounded by the lesson, never by an old gesture origin.
 * Discrete Next/Previous commands deliberately live outside this policy. */
export function boundKpFocusDeckTravel(position: number, lastCheckpoint: number): number {
  if (!Number.isFinite(position) || !Number.isInteger(lastCheckpoint) || lastCheckpoint < 1)
    throw new Error("Invalid Focus Card travel bounds.");
  return Math.max(0, Math.min(lastCheckpoint, position));
}

/** Extracted from supply-tax: a visibly reached checkpoint beats old intent.
 * Callers retain their input-specific commitment thresholds, not their own
 * competing rule for returning a multi-beat gesture to its starting beat. */
export function settleKpFocusDeckTravel(input: {
  position: number; origin: number; lastCheckpoint: number;
  committed: boolean; direction: number;
}): number {
  const { origin, lastCheckpoint } = input;
  if (!Number.isInteger(origin) || origin < 0 || origin > lastCheckpoint || !Number.isFinite(input.direction))
    throw new Error("Invalid Focus Card gesture origin.");
  const visible = Math.round(boundKpFocusDeckTravel(input.position, lastCheckpoint));
  return visible !== origin ? visible : input.committed && input.direction !== 0
    ? boundKpFocusDeckTravel(origin + Math.sign(input.direction), lastCheckpoint) : visible;
}
