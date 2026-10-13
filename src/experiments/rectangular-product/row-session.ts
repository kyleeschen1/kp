import { checkLinearSystemRowOperation, readExactRowValue, type CheckedRowOperation, type LinearSystem, type RowOperation } from '../../math/linear-system-row-operation.ts';

export interface RowTransaction { readonly step: CheckedRowOperation; readonly direction: 'forward' | 'rewind'; readonly action: 'apply' | 'undo' | 'redo' }
/** Local exemplar envelope, separate from the exact mathematical checker. */
export function rowPresentationGap(step: CheckedRowOperation): string | undefined {
  const values = [...step.after.coefficients.rows.flat(), ...step.after.rhs,
    ...step.contributions.flatMap(p => [p.multiplier, p.scaled])];
  if (step.before.coefficients.rowCount !== 2 || step.before.coefficients.columnCount !== 3) return 'This compact exemplar needs two equations and three unknowns.';
  if (values.some(v => { const q = readExactRowValue(v)!; return q.numerator < -99n || q.numerator > 99n || q.denominator > 9n; }))
    return 'This compact layout supports numerators from -99 to 99 and denominators up to 9. Try a smaller factor or undo a step.';
  return undefined;
}
export function createRowSession(initial: LinearSystem) {
  let history: readonly CheckedRowOperation[] = [], cursor = 0, serial = 0, pending: RowTransaction | undefined;
  const current = () => cursor ? history[cursor - 1]!.after : initial;
  const begin = (action: RowTransaction['action'], operation?: RowOperation) => {
    if (pending) return { status: 'repair-required' as const, path: 'playback', message: 'Finish or cancel the current operation first.' };
    const step = action === 'apply' && operation
      ? checkLinearSystemRowOperation({ id: `workbench.step-${++serial}`, before: current(), operation })
      : action === 'undo' ? history[cursor - 1] : action === 'redo' ? history[cursor] : undefined;
    if (!step) return { status: 'repair-required' as const, path: 'history', message: 'No operation is available here.' };
    if (step.status !== 'checked') return step;
    const gap = rowPresentationGap(step);
    if (gap) return { status: 'repair-required' as const, path: 'presentation', message: gap };
    pending = Object.freeze({ step, direction: action === 'undo' ? 'rewind' as const : 'forward' as const, action });
    return { status: 'pending' as const, transaction: pending };
  };
  return {
    current, begin,
    snapshot: () => Object.freeze({ history, cursor, pending }),
    // Object identity is the capability: stale async work cannot commit a reset or cancelled operation.
    commit(transaction: RowTransaction) {
      if (pending !== transaction) return false;
      if (transaction.action === 'apply') { history = Object.freeze([...history.slice(0, cursor), transaction.step]); cursor++; }
      else cursor += transaction.action === 'undo' ? -1 : 1;
      pending = undefined; return true;
    },
    cancel() { pending = undefined; },
    reset() { pending = undefined; history = []; cursor = 0; },
  };
}
