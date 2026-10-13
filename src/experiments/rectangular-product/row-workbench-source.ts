import { constant, divide, variable } from '../../math/expression.ts';
import { checkLinearSystemRowOperation, parseRowFactor, type CheckedRowOperation, type LinearSystem, type RowOperation } from '../../math/linear-system-row-operation.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows, type KpScalarExpression } from '../../math/typed-semantic-math.ts';
import { rowPresentationGap, rowSystemPresentationGap } from './row-session.ts';

export type RowSourceValue = number | string;
export type AuthoredRowOperation = Extract<RowOperation, { kind: 'swap' }>
  | { readonly kind: 'scale'; readonly row: number; readonly factor: RowSourceValue }
  | { readonly kind: 'add'; readonly sourceRow: number; readonly targetRow: number; readonly factor: RowSourceValue };
export interface RowWorkbenchSource {
  readonly id: string;
  readonly title: string;
  readonly introduction: string;
  readonly unknowns: readonly string[];
  readonly coefficients: readonly (readonly RowSourceValue[])[];
  readonly rhs: readonly RowSourceValue[];
  readonly steps: readonly {
    readonly id: string;
    readonly operation: AuthoredRowOperation;
    readonly during: string;
    readonly after: string;
  }[];
}
export interface CompiledRowStep {
  readonly id: string;
  readonly operation: RowOperation;
  readonly during: string;
  readonly after: string;
  readonly checked: CheckedRowOperation;
}
const repair = (path: string, message: string) => ({ status: 'repair-required' as const, path, message });
const idPattern = /^[A-Za-z][\w.-]*$/;
const readable = (text: string) => text.trim().length > 0 && text.length <= 600;
const factor = (value: RowSourceValue) => typeof value === 'number' && !Number.isSafeInteger(value)
  ? repair('value', 'Use safe integers or explicit fraction strings, such as "1/2".') : parseRowFactor(String(value));

/** Typed authoring boundary, not an arbitrary-JSON decoder. Validate the entire
 * sequence before exposing any partial story or evaluating authored claims. */
export function compileRowWorkbenchSource(source: RowWorkbenchSource) {
  if (!idPattern.test(source.id)) return repair('id', 'Supply a stable source identifier.');
  for (const key of ['title', 'introduction'] as const) if (!readable(source[key])) return repair(key, 'Supply nonempty text, up to 600 characters.');
  if (source.unknowns.length !== 3 || source.unknowns.some(name => !/^[A-Za-z]$/.test(name)) || new Set(source.unknowns).size !== 3)
    return repair('unknowns', 'Supply three distinct single-letter unknowns in their column order.');
  if (source.coefficients.length !== 2 || source.coefficients.some(row => row.length !== 3)) return repair('coefficients', 'This workbench supports exactly two rows and three columns.');
  if (source.rhs.length !== 2) return repair('rhs', 'Both equations need an independent right-hand side.');
  const rows: KpScalarExpression[][] = [], rhs: KpScalarExpression[] = [];
  for (let r = 0; r < 2; r++) {
    const row: KpScalarExpression[] = [];
    for (let c = 0; c < 4; c++) {
      const path = c === 3 ? `rhs.${r}` : `coefficients.${r}.${c}`;
      const result = factor(c === 3 ? source.rhs[r]! : source.coefficients[r]![c]!);
      if (result.status !== 'parsed') return repair(path, result.message);
      const q = result.value;
      // Reject before converting bigint leaves into the native scalar AST.
      if (q.numerator < -99n || q.numerator > 99n || q.denominator > 9n) return repair(path, 'This layout supports numerators -99…99 and denominators 1…9.');
      const value = createKpScalarExpression({ id: `${source.id}.${c === 3 ? `rhs.${r}` : `coefficient.${r}.${c}`}`,
        expression: divide(constant(Number(q.numerator)), constant(Number(q.denominator))) });
      if (c === 3) rhs.push(value); else row.push(value);
    }
    rows.push(row);
  }
  const initial = Object.freeze({ coefficients: createKpTypedMatrixFromRows({ id: `${source.id}.coefficients`, rows }), rhs: Object.freeze(rhs) });
  const initialGap = rowSystemPresentationGap(initial); if (initialGap) return repair('initial', initialGap);
  const unknowns = Object.freeze(source.unknowns.map((name, c) => createKpScalarExpression({ id: `${source.id}.input.${c}`, expression: variable(name) })));
  if (source.steps.length === 0 || source.steps.length > 24) return repair('steps', 'Supply one to 24 named steps.');
  const ids = new Set<string>(), steps: CompiledRowStep[] = [];
  let current: LinearSystem = initial;
  for (const [index, step] of source.steps.entries()) {
    const path = `steps.${index}`;
    if (!idPattern.test(step.id) || ids.has(step.id)) return repair(`${path}.id`, 'Step identifiers must be stable and unique.');
    ids.add(step.id);
    for (const key of ['during', 'after'] as const) if (!readable(step[key])) return repair(`${path}.${key}`, 'Supply nonempty text, up to 600 characters.');
    let operation: RowOperation;
    if (step.operation.kind === 'swap') operation = step.operation;
    else {
      const parsed = factor(step.operation.factor);
      if (parsed.status !== 'parsed') return repair(`${path}.operation.factor`, parsed.message);
      operation = { ...step.operation, factor: parsed.value };
    }
    const checked = checkLinearSystemRowOperation({ id: `${source.id}.step.${step.id}`, before: current, operation });
    if (checked.status !== 'checked') return repair(`${path}.operation.${checked.path}`, checked.message);
    const gap = rowPresentationGap(checked); if (gap) return repair(`${path}.presentation`, gap);
    steps.push(Object.freeze({ id: `${source.id}.step.${step.id}`, operation: checked.operation, during: step.during, after: step.after, checked }));
    current = checked.after;
  }
  return Object.freeze({ status: 'compiled' as const, id: source.id, title: source.title, introduction: source.introduction,
    initial, unknowns, steps: Object.freeze(steps) });
}
export type CompiledRowWorkbench = Extract<ReturnType<typeof compileRowWorkbenchSource>, { status: 'compiled' }>;
export function requireRowWorkbenchSource(source: RowWorkbenchSource): CompiledRowWorkbench {
  const result = compileRowWorkbenchSource(source);
  if (result.status !== 'compiled') throw new Error(`${result.path}: ${result.message}`);
  return result;
}
