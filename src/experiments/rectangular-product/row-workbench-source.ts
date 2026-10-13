import { constant, divide, variable } from '../../math/expression.ts';
import type { RowOperation } from '../../math/linear-system-row-operation.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows, type KpScalarExpression } from '../../math/typed-semantic-math.ts';
import { rowSystemPresentationGap } from './row-session.ts';
import { compileAuthoredRowSteps, parseAuthoredRowFactor as factor } from './row-authored-steps.ts';
export type { CompiledRowStep } from './row-authored-steps.ts';

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
const repair = (path: string, message: string) => ({ status: 'repair-required' as const, path, message });
const idPattern = /^[A-Za-z][\w.-]*$/;
const readable = (text: string) => text.trim().length > 0 && text.length <= 600;

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
  const sequence = compileAuthoredRowSteps(source.id, initial, source.steps);
  if (sequence.status !== 'compiled') return sequence;
  return Object.freeze({ status: 'compiled' as const, id: source.id, title: source.title, introduction: source.introduction,
    initial, unknowns, steps: sequence.steps });
}

export type CompiledRowWorkbench = Extract<ReturnType<typeof compileRowWorkbenchSource>, { status: 'compiled' }>;
export function requireRowWorkbenchSource(source: RowWorkbenchSource): CompiledRowWorkbench {
  const result = compileRowWorkbenchSource(source);
  if (result.status !== 'compiled') throw new Error(`${result.path}: ${result.message}`);
  return result;
}
