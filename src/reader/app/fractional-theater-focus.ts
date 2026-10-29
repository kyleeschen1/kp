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

function presence(position: number, arrival: number, hold: number) {
  return ease(clamp((position - arrival + revealDistance) / revealDistance)) *
    (1 - ease(clamp((position - arrival - hold) / revealDistance)));
}

/** Compile measured holds once. Normal document spacing needs one lookup;
 * densely overlapping windows retain the same complete projection. */
export function compileFractionalTheaterFocus(input: PassageWindows): (position: number) => ReadonlyMap<number, number> {
  validate(input);
  const dense = input.positions.some((position, index) => index > 0 &&
    position - revealDistance < input.positions[index - 1]! + input.holds[index - 1]! + revealDistance);
  return position => {
    if (dense) return new Map(fractionalTheaterFocus({ ...input, position })
      .flatMap((opacity, index) => opacity === 0 ? [] : [[index, opacity] as const]));
    const index = fractionalPassageIndex(input.positions, position + revealDistance);
    const arrival = input.positions[index];
    const opacity = arrival === undefined ? 0 : presence(position, arrival, input.holds[index]!);
    return new Map(opacity > 0 ? [[index, opacity]] : []);
  };
}

/** Reveal close to arrival, retain through the whole hold, withdraw on release.
 * Keeping presence separate from flow preserves native search and reversal. */
export function fractionalTheaterFocus(input: PassageWindows & { readonly position: number }) {
  validate(input);
  return input.positions.map((arrival, index) => presence(input.position, arrival, input.holds[index]!));
}

/** A shorter symmetric window lets the control dissolve before its prose.
 * Both directions sample document position; no transition can lag a seek. */
export function fractionalSliderPresence(position: number, arrival: number, completedAt: number) {
  const distance = 12;
  return ease(clamp((position - arrival + distance) / distance)) *
    (1 - ease(clamp((position - completedAt) / distance)));
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
