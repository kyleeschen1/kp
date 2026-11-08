import { documentPassageIndex } from './document-theater-scroll.ts';

export type DocumentReadingAttention =
  | { readonly kind: 'prose'; readonly presence: number }
  | { readonly kind: 'annotation'; readonly stateId: string; readonly presence: number };

const fadeDistance = 32; // Reading distance in pixels; pausing never expires a note.
const ease = (value: number) => {
  const unit = Math.min(1, Math.max(0, value));
  return unit * unit * (3 - 2 * unit);
};

/** Presence is separate from semantic focus. Prose withdraws completely before
 * a note enters; notes leave before the next passage or mathematical act. */
export function compileDocumentReadingAttention(input: {
  readonly states: readonly (string | undefined)[];
  readonly positions: readonly number[];
  readonly holds: readonly number[];
}) {
  if (input.states.length !== input.positions.length || input.holds.length !== input.positions.length)
    throw new Error('Reading attention requires one position and hold per passage.');
  input.positions.forEach((position, index) => {
    if (!Number.isFinite(position) || (index > 0 && position < input.positions[index - 1]!) ||
      !Number.isFinite(input.holds[index]) || input.holds[index]! < 0)
      throw new Error('Reading attention requires ordered finite positions and nonnegative holds.');
  });
  const windows = input.states.map((stateId, index) => {
    if (stateId === undefined) return undefined;
    const arrival = input.positions[index]!;
    const previousEnd = index === 0 ? arrival - 2 * fadeDistance : input.positions[index - 1]! + input.holds[index - 1]!;
    const next = input.positions[index + 1];
    const enter = Math.min(fadeDistance, (arrival - previousEnd) / 2);
    const leave = next === undefined ? fadeDistance : Math.min(fadeDistance, (next - arrival) / 3);
    if (!Number.isFinite(arrival) || !(enter > 0) || !(leave > 0) || !Number.isFinite(input.holds[index]) || input.holds[index]! < 0)
      throw new Error('Annotations require a native hold with room for an exclusive reading handoff.');
    return { stateId, arrival, enter, leave,
      withdrawal: next === undefined ? arrival + input.holds[index]! : next - 2 * leave };
  });
  return (sample: {
    readonly position: number;
    readonly readingDocument: boolean;
    readonly hasSelection: boolean;
    readonly motionMode: 'full' | 'essential';
  }): DocumentReadingAttention => {
    if (!Number.isFinite(sample.position)) throw new Error('Reading attention requires a finite playhead.');
    if (sample.readingDocument || sample.hasSelection) return { kind: 'prose', presence: 1 };
    const active = documentPassageIndex(input.positions, sample.position);
    for (const index of [active, active + 1]) {
      const window = windows[index];
      if (!window) continue;
      const { arrival, enter, withdrawal, leave } = window;
      const position = sample.position;
      if (sample.motionMode === 'essential') {
        if (position >= arrival && position < withdrawal + leave)
          return { kind: 'annotation', stateId: window.stateId, presence: 1 };
      } else if (position >= arrival - 2 * enter && position < withdrawal + leave) {
        if (position <= arrival - enter)
          return { kind: 'prose', presence: 1 - ease((position - arrival + 2 * enter) / enter) };
        return { kind: 'annotation', stateId: window.stateId,
          presence: ease((position - arrival + enter) / enter) * (1 - ease((position - withdrawal) / leave)) };
      }
    }
    return { kind: 'prose', presence: 1 };
  };
}

/** A passage's identity may remain current across a gap; its focus does not. */
export function documentStoryFocusActive(position: number, arrival: number, hold: number): boolean {
  return position >= arrival && position <= arrival + hold;
}
