/** Exemplar tuning, not a global motion policy. Distances are semantic beats. */
export function reasoningGestureTarget(anchor: number, position: number, velocity: number, total: number) {
  if (![anchor, position, velocity, total].every(Number.isFinite) || !Number.isInteger(anchor) ||
      !Number.isInteger(total) || total < 1 || anchor < 0 || anchor > total) throw new Error("Invalid reasoning gesture bounds.");
  const displacement = position - anchor;
  const projected = Math.abs(displacement) >= .05 ? displacement + Math.max(-.4, Math.min(.4, velocity * 120)) : displacement;
  const direction = Math.abs(projected) >= .25 ? Math.sign(projected) : 0;
  return Math.max(0, Math.min(total, anchor + direction));
}
