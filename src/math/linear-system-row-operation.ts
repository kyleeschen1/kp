import { addKpRationals, createKpRational, divideKpRationals, multiplyKpRationals, negateKpRational, type KpNormalizedRational } from '../../domains/math/exact-rational.ts';
import { constant, divide } from './expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows, type KpScalarValue, type KpScalarExpression, type KpTypedMatrix } from './typed-semantic-math.ts';
import { readExactRowValue } from './row-exact-value.ts';
export { readExactRowValue } from './row-exact-value.ts';

export interface LinearSystem { readonly coefficients: KpTypedMatrix; readonly rhs: readonly KpScalarValue[] }
export type RowOperation =
  | { readonly kind: 'swap'; readonly first: number; readonly second: number }
  | { readonly kind: 'scale'; readonly row: number; readonly factor: KpNormalizedRational }
  | { readonly kind: 'add'; readonly sourceRow: number; readonly targetRow: number; readonly factor: KpNormalizedRational };
const repair = (path: string, message: string) => ({ status: 'repair-required' as const, path, message });
const limit = BigInt(Number.MAX_SAFE_INTEGER);
const fits = (n: KpNormalizedRational) => n.numerator >= -limit && n.numerator <= limit && n.denominator <= limit;
export function parseRowFactor(text: string) {
  const match = /^\s*([+-]?\d{1,15})(?:\s*\/\s*([+-]?\d{1,15}))?\s*$/.exec(text);
  if (!match || (match[2] && BigInt(match[2]) === 0n)) return repair('factor', 'Enter an integer or fraction with a nonzero denominator, such as -2 or 1/2.');
  return { status: 'parsed' as const, value: createKpRational(BigInt(match[1]!), BigInt(match[2] ?? '1')) };
}
const expression = (n: KpNormalizedRational) => divide(constant(Number(n.numerator)), constant(Number(n.denominator)));
const frozenSystem = (system: LinearSystem) => Object.freeze({ coefficients: system.coefficients, rhs: Object.freeze([...system.rhs]) });

/** Elementary operations act on the complete constraint, including its RHS.
 * Exact residual identities and an explicit inverse justify solution-set preservation. */
export function checkLinearSystemRowOperation(input: { readonly id: string; readonly before: LinearSystem; readonly operation: RowOperation }) {
  const { id, before } = input, op = input.operation, matrix = before.coefficients;
  if (!/^[A-Za-z][\w.-]*$/.test(id)) return repair('id', 'Supply a stable operation identifier.');
  if (before.rhs.length !== matrix.rowCount) return repair('rhs', 'Every equation needs its right-hand side.');
  const rows = op.kind === 'swap' ? [op.first, op.second] : op.kind === 'scale' ? [op.row] : [op.sourceRow, op.targetRow];
  if (rows.some(r => !Number.isInteger(r) || r < 0 || r >= matrix.rowCount) || (rows.length === 2 && rows[0] === rows[1]))
    return repair('rows', 'Choose existing rows, with distinct source and target.');
  const values = matrix.rows.map((row, r) => [...row, before.rhs[r]!]);
  if (values.flat().some(v => !readExactRowValue(v))) return repair('entries', 'This checker accepts exact integer and rational entries.');
  const existingIds = new Set(values.flat().map(v => v.id));
  const generatedIds = [`${id}.multiple`, ...values[0]!.flatMap((_, c) => [`${id}.result.${c}`, `${id}.scaled.${c}`])];
  if (generatedIds.some(value => existingIds.has(value))) return repair('id', 'New values must not reuse existing entry identifiers.');
  const beforeSnapshot = frozenSystem(before);
  if (op.kind === 'swap') {
    const nextRows = [...matrix.rows], rhs = [...before.rhs];
    [nextRows[op.first], nextRows[op.second]] = [matrix.rows[op.second]!, matrix.rows[op.first]!];
    [rhs[op.first], rhs[op.second]] = [before.rhs[op.second]!, before.rhs[op.first]!];
    const operation = Object.freeze({ ...op });
    return Object.freeze({ status: 'checked' as const, id, operation, inverse: operation, before: beforeSnapshot,
      after: frozenSystem({ coefficients: createKpTypedMatrixFromRows({ id: `${id}.coefficients`, rows: nextRows }), rhs }),
      contributions: Object.freeze([]), witness: Object.freeze({ relation: 'same-solution-set' as const,
        lawId: 'law.linear-algebra.row-swap', residualIdentity: 'Exchange the two residuals; exchanging them again recovers the original system.' }) });
  }
  if (op.factor.denominator === 0n) return repair('factor', 'The denominator must be nonzero.');
  const factor = createKpRational(op.factor.numerator, op.factor.denominator);
  if (!fits(factor)) return repair('factor', 'The exact factor exceeds safe rational storage.');
  if (op.kind === 'scale' && factor.numerator === 0n) return repair('factor', 'Scaling by zero loses an equation and is not invertible.');
  const operation = Object.freeze({ ...op, factor });
  const targetRow = op.kind === 'scale' ? op.row : op.targetRow, sourceRow = op.kind === 'scale' ? op.row : op.sourceRow;
  const lawId = op.kind === 'scale' ? 'law.linear-algebra.row-scaling' : 'law.linear-algebra.row-replacement';
  const multiplier = createKpScalarExpression({ id: `${id}.multiple`, expression: expression(factor) });
  const contributions: { readonly column: number; readonly role: 'rhs' | 'coefficient'; readonly target: KpScalarValue; readonly source: KpScalarValue;
    readonly multiplier: KpScalarExpression; readonly scaled: KpScalarExpression; readonly result: KpScalarExpression }[] = [];
  for (let column = 0; column <= matrix.columnCount; column++) {
    const target = values[targetRow]![column]!, source = values[sourceRow]![column]!;
    const scaledValue = multiplyKpRationals(factor, readExactRowValue(source)!);
    const resultValue = op.kind === 'scale' ? scaledValue : addKpRationals(readExactRowValue(target)!, scaledValue);
    // The AST stores Number leaves: check exact bounds before converting, never after rounding.
    if (!fits(scaledValue) || !fits(resultValue)) return repair(`entries.${column}`, 'The exact result or intermediate exceeds safe rational storage.');
    const scaled = createKpScalarExpression({ id: `${id}.scaled.${column}`, expression: expression(scaledValue),
      provenance: { kind: 'derived', sourceIds: [source.id, multiplier.id], methodId: lawId } });
    const result = createKpScalarExpression({ id: `${id}.result.${column}`, expression: expression(resultValue),
      provenance: { kind: 'derived', sourceIds: op.kind === 'scale' ? [target.id, multiplier.id] : [target.id, source.id, multiplier.id], methodId: lawId } });
    contributions.push(Object.freeze({ column, role: column === matrix.columnCount ? 'rhs' as const : 'coefficient' as const,
      source, target, multiplier, scaled, result }));
  }
  const inverse: RowOperation = op.kind === 'scale' ? { kind: 'scale', row: op.row, factor: divideKpRationals(createKpRational(1n), factor) }
    : { kind: 'add', sourceRow: op.sourceRow, targetRow: op.targetRow, factor: negateKpRational(factor) };
  return Object.freeze({ status: 'checked' as const, id, operation, inverse: Object.freeze(inverse), before: beforeSnapshot,
    after: frozenSystem({ coefficients: createKpTypedMatrixFromRows({ id: `${id}.coefficients`,
      rows: matrix.rows.map((row, r) => r === targetRow ? contributions.slice(0, -1).map(p => p.result) : row),
      provenance: { kind: 'derived', sourceIds: [matrix.id, multiplier.id], methodId: lawId } }),
      rhs: before.rhs.map((value, r) => r === targetRow ? contributions.at(-1)!.result : value) }),
    contributions: Object.freeze(contributions), witness: Object.freeze({ relation: 'same-solution-set' as const, lawId,
      residualIdentity: op.kind === 'scale' ? 'target-next = factor * target; divide by the nonzero factor to recover target.'
        : 'target-next = target + factor * source; source-next = source; subtract factor * source to recover target.' }) });
}
export type CheckedRowOperation = Extract<ReturnType<typeof checkLinearSystemRowOperation>, { status: 'checked' }>;
