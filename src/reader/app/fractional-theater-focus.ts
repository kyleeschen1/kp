const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => value * value * (3 - 2 * value);

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
