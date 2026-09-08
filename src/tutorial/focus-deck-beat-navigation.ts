import { settleKpFocusDeckTravel } from "./focus-deck-continuous-navigation.ts";

/** Accepted equation/code commitment policy; settlement respects visible travel. */
export function resolveKpFocusDeckGestureTarget(anchor: number, position: number, velocity: number, total: number) {
  if (![anchor, position, velocity, total].every(Number.isFinite) || !Number.isInteger(anchor) ||
      !Number.isInteger(total) || total < 1 || anchor < 0 || anchor > total) throw new Error("Invalid reasoning gesture bounds.");
  const displacement = position - anchor;
  const projected = Math.abs(displacement) >= .05 ? displacement + Math.max(-.4, Math.min(.4, velocity * 120)) : displacement;
  return settleKpFocusDeckTravel({ position, origin: anchor, lastCheckpoint: total,
    committed: Math.abs(projected) >= .25, direction: Math.sign(projected) });
}

/** One live beat feeds both the fraction and active passage. A narrow deadband
 * prevents midpoint jitter without waiting for exact endpoint settlement. */
export function resolveKpFocusDeckVisibleBeat(position: number, previous: number, total: number): number {
  if (![position, previous, total].every(Number.isFinite) || !Number.isInteger(previous) ||
      !Number.isInteger(total) || total < 1) throw new Error("Invalid visible beat.");
  const bounded = Math.max(0, Math.min(total, position));
  return bounded > previous + .55 || bounded < previous - .55
    ? Math.round(bounded) : Math.max(0, Math.min(total, previous));
}

/** A card can expose a strict subrange of its existing clock. This mapping owns
 * neither semantic identity nor timing: callers supply their verified stops. */
export function createKpFocusDeckCheckpointMap(values: readonly number[]) {
  const checkpoints = Object.freeze([...values]);
  if (checkpoints.length < 2 || checkpoints.some((value, index) =>
    !Number.isFinite(value) || value < 0 || value > 1 ||
    (index > 0 && value <= checkpoints[index - 1]!))) {
    throw new Error("Focus Card checkpoints must be finite, strictly increasing clock positions in [0, 1].");
  }
  const last = checkpoints.length - 1;
  return Object.freeze({
    checkpoints, last,
    progressAt(position: number): number {
      if (!Number.isFinite(position) || position < 0 || position > last) throw new Error("Focus Card position is outside its checkpoints.");
      const lower = Math.floor(position), upper = Math.ceil(position);
      return checkpoints[lower]! + (checkpoints[upper]! - checkpoints[lower]!) * (position - lower);
    },
    positionAt(progress: number): number {
      if (!Number.isFinite(progress) || progress < checkpoints[0]! || progress > checkpoints[last]!) throw new Error("Clock position is outside this Focus Card.");
      let lower = 0;
      for (let index = 1; index <= last; index++) if (checkpoints[index]! <= progress) lower = index;
      return lower === last ? last : lower + (progress - checkpoints[lower]!) / (checkpoints[lower + 1]! - checkpoints[lower]!);
    }
  });
}
