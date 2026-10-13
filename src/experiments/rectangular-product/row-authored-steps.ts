import { checkLinearSystemRowOperation, parseRowFactor, type CheckedRowOperation, type LinearSystem, type RowOperation } from '../../math/linear-system-row-operation.ts';
import { rowPresentationGap } from './row-session.ts';
import type { RowSourceValue, RowWorkbenchSource } from './row-workbench-source.ts';

export interface CompiledRowStep {
  readonly id: string;
  readonly operation: RowOperation;
  readonly during: string;
  readonly after: string;
  readonly checked: CheckedRowOperation;
}
const repair = (path: string, message: string) => ({ status: 'repair-required' as const, path, message });
export const parseAuthoredRowFactor = (value: RowSourceValue) => typeof value === 'number' && !Number.isSafeInteger(value)
  ? repair('value', 'Use safe integers or explicit fraction strings, such as "1/2".') : parseRowFactor(String(value));

/** Compose existing referents without importing the workbench's initial-system
 * constructor into collection consumers or reconstructing their incoming math. */
export function compileAuthoredRowSteps(id: string, initial: LinearSystem, authored: RowWorkbenchSource['steps'], presentationGap = rowPresentationGap) {
  if (authored.length === 0 || authored.length > 24) return repair('steps', 'Supply one to 24 named steps.');
  const ids = new Set<string>(), steps: CompiledRowStep[] = [];
  let current: LinearSystem = initial;
  for (const [index, step] of authored.entries()) {
    const path = `steps.${index}`;
    if (!/^[A-Za-z][\w.-]*$/.test(step.id) || ids.has(step.id)) return repair(`${path}.id`, 'Step identifiers must be stable and unique.');
    ids.add(step.id);
    for (const key of ['during', 'after'] as const)
      if (!step[key].trim() || step[key].length > 600) return repair(`${path}.${key}`, 'Supply nonempty text, up to 600 characters.');
    let operation: RowOperation;
    if (step.operation.kind === 'swap') operation = step.operation;
    else {
      const parsed = parseAuthoredRowFactor(step.operation.factor);
      if (parsed.status !== 'parsed') return repair(`${path}.operation.factor`, parsed.message);
      operation = { ...step.operation, factor: parsed.value };
    }
    const checked = checkLinearSystemRowOperation({ id: `${id}.step.${step.id}`, before: current, operation });
    if (checked.status !== 'checked') return repair(`${path}.operation.${checked.path}`, checked.message);
    const gap = presentationGap(checked); if (gap) return repair(`${path}.presentation`, gap);
    steps.push(Object.freeze({ id: `${id}.step.${step.id}`, operation: checked.operation, during: step.during, after: step.after, checked }));
    current = checked.after;
  }
  return Object.freeze({ status: 'compiled' as const, steps: Object.freeze(steps) });
}
