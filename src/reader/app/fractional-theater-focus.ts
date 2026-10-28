const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => value * value * (3 - 2 * value);
import { fractionalPassageIndex } from './fractional-rising-scroll.ts';

/** Compile measured geometry once. Ordinary spaced paragraphs have at most
 * two emphasized neighbors; retain the exact dense law for overlapping spans. */
export function compileFractionalTheaterFocus(input: {
  readonly positions: readonly number[];
  readonly heights: readonly number[];
  readonly stageOffset: number;
}): (position: number) => ReadonlyMap<number, number> {
  fractionalTheaterFocus({ ...input, position: 0 }); // Validate measured heights.
  const crossings = input.positions.map((bottom, index) => bottom - input.heights[index]! - input.stageOffset);
  if (crossings.some((crossing, index) => index > 0 && crossing < crossings[index - 1]! + 24)) {
    return position => new Map(fractionalTheaterFocus({ ...input, position })
      .flatMap((opacity, index) => opacity === .12 ? [] : [[index, opacity] as const]));
  }
  return position => {
    const result = new Map<number, number>();
    if (!crossings.length || position < crossings[0]!) return result;
    const index = fractionalPassageIndex(crossings, position);
    const incoming = ease(clamp((position - crossings[index]!) / 24));
    if (incoming > 0) result.set(index, .12 + .88 * incoming);
    if (index > 0 && incoming < 1) result.set(index - 1, .12 + .88 * (1 - incoming));
    return result;
  };
}

/** Pure scroll projection: paired text crossfades at the stage's top boundary. */
export function fractionalTheaterFocus(input: {
  readonly positions: readonly number[];
  readonly heights: readonly number[];
  readonly position: number;
  readonly stageOffset: number;
}) {
  const arrival = input.positions.map((bottom, index) => {
    const height = input.heights[index];
    if (height === undefined || !Number.isFinite(height) || height <= 0) throw new Error('Theater focus needs measured passage heights.');
    const crossing = bottom - height - input.stageOffset;
    return ease(clamp((input.position - crossing) / 24));
  });
  return arrival.map((incoming, index) => .12 + .88 * incoming * (1 - (arrival[index + 1] ?? 0)));
}

export function fractionalSliderPresence(position: number, completedAt: number) {
  return 1 - ease(clamp((position - completedAt) / 24));
}
