import { fractionalPassageIndex } from './fractional-rising-scroll.ts';

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => value * value * (3 - 2 * value);
const revealDistance = 24; // Local exemplar: scroll distance, not elapsed time.
interface PassageWindows {
  readonly positions: readonly number[];
  readonly holds: readonly number[];
}

function validate(input: PassageWindows) {
  if (input.holds.length !== input.positions.length) throw new Error('Theater presence needs one hold per passage.');
  input.positions.forEach((position, index) => {
    if (!Number.isFinite(position) || (index > 0 && position < input.positions[index - 1]!) ||
        !Number.isFinite(input.holds[index]) || input.holds[index]! < 0) {
      throw new Error('Theater presence needs ordered finite positions and nonnegative holds.');
    }
  });
}

function withdrawalAt(input: PassageWindows, index: number) {
  // Completion releases physical motion, not readable context. Keep the old
  // explanation until its successor has fully arrived at the reading line.
  return Math.max(input.positions[index]! + input.holds[index]!, input.positions[index + 1] ?? -Infinity);
}

function presence(position: number, arrival: number, withdrawal: number) {
  return ease(clamp((position - arrival + revealDistance) / revealDistance)) *
    (1 - ease(clamp((position - withdrawal) / revealDistance)));
}

/** Compile once. The outgoing/incoming pair shares readability across a gap;
 * unusually overlapping holds retain the complete projection. */
export function compileFractionalTheaterFocus(input: PassageWindows): (position: number) => ReadonlyMap<number, number> {
  validate(input);
  const withdrawals = input.positions.map((_, index) => withdrawalAt(input, index));
  const dense = input.positions.some((position, index) => index > 1 &&
    position - revealDistance < withdrawals[index - 2]! + revealDistance);
  return position => {
    if (dense) return new Map(fractionalTheaterFocus({ ...input, position })
      .flatMap((opacity, index) => opacity === 0 ? [] : [[index, opacity] as const]));
    const index = fractionalPassageIndex(input.positions, position + revealDistance);
    const result = new Map<number, number>();
    for (const candidate of [index - 1, index]) {
      const arrival = input.positions[candidate];
      const opacity = arrival === undefined ? 0 : presence(position, arrival, withdrawals[candidate]!);
      if (opacity > 0) result.set(candidate, opacity);
    }
    return result;
  };
}

/** Readability bridges motion between holds. Flow still owns actual positions,
 * and the mathematical clock waits for the next explanation's reading phase. */
export function fractionalTheaterFocus(input: PassageWindows & { readonly position: number }) {
  validate(input);
  return input.positions.map((arrival, index) => presence(input.position, arrival, withdrawalAt(input, index)));
}

/** A neighboring paragraph stays faint behind the theater. Its natural sticky
 * position determines the trace; no DOM measurement or extra clock is needed. */
export function fractionalPassageTrace(input: {
  position: number; arrival: number; hold: number; height: number;
  frameTop: number; frameBottom: number;
}) {
  const travel = input.position - input.arrival;
  const bottom = travel < 0 ? -travel : travel <= input.hold ? 0 : input.hold - travel;
  const top = bottom - input.height;
  const distance = Math.max(input.frameTop - bottom, top - input.frameBottom, 0);
  return .08 * (1 - ease(clamp(distance / 96)));
}
