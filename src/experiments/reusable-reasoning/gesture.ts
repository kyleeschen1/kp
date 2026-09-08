import { settleKpFocusDeckTravel } from "../../tutorial/focus-deck-continuous-navigation.ts";

/** Exemplar commitment tuning; shared settlement respects visible travel. */
export function reasoningGestureTarget(anchor: number, position: number, velocity: number, total: number) {
  if (![anchor, position, velocity, total].every(Number.isFinite) || !Number.isInteger(anchor) ||
      !Number.isInteger(total) || total < 1 || anchor < 0 || anchor > total) throw new Error("Invalid reasoning gesture bounds.");
  const displacement = position - anchor;
  const projected = Math.abs(displacement) >= .05 ? displacement + Math.max(-.4, Math.min(.4, velocity * 120)) : displacement;
  return settleKpFocusDeckTravel({ position, origin: anchor, lastCheckpoint: total,
    committed: Math.abs(projected) >= .25, direction: Math.sign(projected) });
}

/** One live beat feeds both the fraction and active passage. A narrow deadband
 * prevents midpoint jitter without waiting for exact endpoint settlement. */
export function reasoningVisibleBeat(position: number, previous: number, total: number): number {
  if (![position, previous, total].every(Number.isFinite) || !Number.isInteger(previous) ||
      !Number.isInteger(total) || total < 1) throw new Error("Invalid visible beat.");
  const bounded = Math.max(0, Math.min(total, position));
  return bounded > previous + .55 || bounded < previous - .55
    ? Math.round(bounded) : Math.max(0, Math.min(total, previous));
}
