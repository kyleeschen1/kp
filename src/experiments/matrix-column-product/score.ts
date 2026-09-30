import { MatrixColumnGap, matrixEnvironment, type MatrixEnvironment } from "./environment.ts";
export { MatrixColumnGap, matrixEnvironment, type MatrixEnvironment, type MatrixCell } from "./environment.ts";
export type Column = 0 | 1;
export const actions = ["initial", "lift", "pivot", "copy", "dot", "evaluate", "place"] as const;
export type Action = typeof actions[number];
export interface MatrixScene {
  readonly column: Column;
  readonly action: Action;
  readonly ordinal: number;
}
export interface Milestone {
  readonly name: string;
  readonly cue: string;
  readonly scene: MatrixScene;
}

/** Exemplar-local facade: env is immutable truth; scene records presentation.
 * It admits only the ordered motif supported by this adapter, never a fallback. */
export class MatrixState {
  readonly env: MatrixEnvironment;
  readonly scene: MatrixScene;
  constructor(env: MatrixEnvironment, ordinal = -1) {
    if (!Number.isInteger(ordinal) || ordinal < -1 || ordinal > 12) throw new MatrixColumnGap("Unknown matrix scene milestone.");
    this.env = env;
    this.scene = Object.freeze({ ordinal, column: ordinal > 6 ? 1 : 0,
      action: ordinal <= 0 ? "initial" : actions[(ordinal - 1) % 6 + 1]! });
    Object.freeze(this);
  }
  private advance(action: Action, column: Column) {
    const next = new MatrixState(this.env, this.scene.ordinal + 1);
    if (next.scene.action !== action || next.scene.column !== column || next.scene.ordinal > 12) {
      throw new MatrixColumnGap(`Unsupported ${action}(${column}) after ${this.scene.action}.`);
    }
    return next;
  }
  show() { return this.advance("initial", 0); }
  lift(column: Column) { return this.advance("lift", column); }
  pivot() { return this.advance("pivot", this.scene.column); }
  copy() { return this.advance("copy", this.scene.column); }
  dot() { return this.advance("dot", this.scene.column); }
  evaluate() { return this.advance("evaluate", this.scene.column); }
  place() { return this.advance("place", this.scene.column); }
}

class MatrixStory {
  readonly state: MatrixState;
  readonly steps: readonly Milestone[];
  constructor(state: MatrixState, steps: readonly Milestone[] = []) {
    this.state = state; this.steps = Object.freeze([...steps]); Object.freeze(this);
  }
  transform(name: string, cue: string, change: (state: MatrixState) => MatrixState) {
    const next = change(this.state);
    if (!name.trim() || this.steps.some(step => step.name === name) || next.env !== this.state.env ||
      next.scene.ordinal !== this.state.scene.ordinal + 1) {
      throw new MatrixColumnGap("Transforms need unique names, one supported step and the same env.");
    }
    return new MatrixStory(next, [...this.steps, Object.freeze({ name, cue, scene: next.scene })]);
  }
}

export function empty(env: MatrixEnvironment) { return new MatrixStory(new MatrixState(env)); }

// This is the actual executable authoring score, not a displayed pseudocode copy.
export function matrixColumnStory(env = matrixEnvironment()) {
  return empty(env)
    .transform("initial", "Each column of B meets both rows of A.", s => s.show())
    .transform("lift-first", "Lift a copy of the first column. B stays unchanged.", s => s.lift(0))
    .transform("pivot-first", "Turn the column into a row; keep its entry order.", s => s.pivot())
    .transform("copy-first", "The same column will meet the second row too.", s => s.copy())
    .transform("dot-first", "Pair corresponding entries from each row and the column.", s => s.dot())
    .transform("evaluate-first", "Multiply each pair, then add: 4 and 10.", s => s.evaluate())
    .transform("place-first", "Those two sums form the first column of the product.", s => s.place())
    .transform("lift-second", "Now lift a copy of the second column of B.", s => s.lift(1))
    .transform("pivot-second", "Turn the second column to meet the first row.", s => s.pivot())
    .transform("copy-second", "Copy it again for the second row.", s => s.copy())
    .transform("dot-second", "Use the same row–column pairing for both remaining entries.", s => s.dot())
    .transform("evaluate-second", "These sums are 4 and 8.", s => s.evaluate())
    .transform("complete", "Each result entry is one row–column dot product.", s => s.place());
}

// Candidate presentation cadence, separate from the domain's legacy timeline.
const durations: Readonly<Record<Action, number>> = {
  initial: 0, lift: 1800, pivot: 2100, copy: 1700, dot: 2300, evaluate: 2100, place: 2000,
};
export function timeline(story: ReturnType<typeof matrixColumnStory>) {
  if (story.steps.length !== 13) throw new MatrixColumnGap("A playable column story needs all thirteen milestones.");
  let total = 0;
  const stops = story.steps.map(step => { total += durations[step.scene.action]; return total; });
  return Object.freeze({ duration: total, stops: Object.freeze(stops.map(t => t / total)) });
}
export function sampleStory(story: ReturnType<typeof matrixColumnStory>, progress: number) {
  if (!Number.isFinite(progress)) throw new MatrixColumnGap("Progress must be finite.");
  const { stops } = timeline(story);
  const p = Math.max(0, Math.min(1, progress));
  const index = p === 0 ? 0 : stops.findIndex(stop => stop >= p);
  const step = story.steps[index]!;
  const from = stops[Math.max(0, index - 1)]!;
  return Object.freeze({ step, index, progress: p,
    local: index === 0 ? 1 : (p - from) / (stops[index]! - from) });
}
