import type { CheckedRowOperation } from '../../math/linear-system-row-operation.ts';
import type { createRowSession, RowTransaction } from './row-session.ts';
import type { CompiledRowStep, CompiledRowWorkbench } from './row-workbench-source.ts';

/** An annotation belongs to a committed authored operation, not a button index.
 * Undo/cancel therefore recover the appropriate story without stale claims. */
export function createRowAuthoredStory(model: CompiledRowWorkbench, session: ReturnType<typeof createRowSession>) {
  const annotations = new WeakMap<CheckedRowOperation, CompiledRowStep>();
  return {
    attach(transaction: RowTransaction, step: CompiledRowStep) { annotations.set(transaction.step, step); },
    annotation: (step: CheckedRowOperation) => annotations.get(step),
    current() {
      const { history, cursor } = session.snapshot();
      return cursor ? annotations.get(history[cursor - 1]!) : undefined;
    },
    next() {
      const { history, cursor } = session.snapshot();
      return history.slice(0, cursor).every((step, index) => annotations.get(step) === model.steps[index]) ? model.steps[cursor] : undefined;
    },
  };
}
