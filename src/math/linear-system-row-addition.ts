import { constant } from './expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows, type KpScalarValue, type KpScalarExpression, type KpTypedMatrix } from './typed-semantic-math.ts';

export interface RowAdditionInput {
  readonly id: string;
  readonly coefficients: KpTypedMatrix;
  readonly rhs: readonly KpScalarValue[];
  readonly sourceRow: number;
  readonly targetRow: number;
  readonly multiple: number;
}
const repair = (path: string, message: string) => ({ status: 'repair-required' as const, path, message });
const integer = (v: KpScalarValue) => v.expression.kind === 'constant' && Number.isSafeInteger(v.expression.value) ? v.expression.value : undefined;
interface RowContribution {
  readonly column: number;
  readonly role: 'rhs' | 'coefficient';
  readonly source: KpScalarValue;
  readonly target: KpScalarValue;
  readonly multiplier: KpScalarExpression;
  readonly scaled: number;
  readonly result: KpScalarExpression;
}

/** Exact integer row replacement. The RHS is mandatory, so a coefficient-only
 * change cannot accidentally acquire solution-set-preservation authority. */
export function checkLinearSystemRowAddition(input: RowAdditionInput) {
  const { coefficients, sourceRow, targetRow, multiple, id } = input;
  if (!/^[A-Za-z][\w.-]*$/.test(id)) return repair('id', 'Supply a stable operation identifier.');
  if (input.rhs.length !== coefficients.rowCount) return repair('rhs', 'Every equation needs its own right-hand side.');
  if (![sourceRow, targetRow].every(r => Number.isInteger(r) && r >= 0 && r < coefficients.rowCount) || sourceRow === targetRow)
    return repair('rows', 'Source and target must be distinct existing rows; self-addition is not this invertible operation.');
  if (!Number.isSafeInteger(multiple)) return repair('multiple', 'This exact checker supports safe integer multiples.');
  const before = coefficients.rows.map((row, r) => [...row, input.rhs[r]!]);
  const sourceIds = new Set(before.flat().map(value => value.id));
  if (sourceIds.has(`${id}.multiple`) || before[0]!.some((_, c) => sourceIds.has(`${id}.result.${c}`)))
    return repair('id', 'New operation values must not reuse an existing entry identifier.');
  if (before.some(row => row.some(v => integer(v) === undefined)))
    return repair('entries', 'This bounded checker requires safe integer coefficients and right-hand sides.');
  const multiplier = createKpScalarExpression({ id: `${id}.multiple`, expression: constant(multiple) });
  const contributions: RowContribution[] = [];
  for (let c = 0; c <= coefficients.columnCount; c++) {
    const source = before[sourceRow]![c]!, target = before[targetRow]![c]!;
    const a = BigInt(integer(target)!), b = BigInt(integer(source)!), k = BigInt(multiple);
    const scaled = k * b, sum = a + scaled;
    // Check exact intermediates before converting to Number; rounded arithmetic
    // must never be used as evidence for a reversible row operation.
    if ([scaled, sum].some(n => n > BigInt(Number.MAX_SAFE_INTEGER) || n < BigInt(Number.MIN_SAFE_INTEGER)))
      return repair(`entries.${c}`, 'The exact result or scaled contributor exceeds safe integer storage.');
    const result = createKpScalarExpression({ id: `${id}.result.${c}`, expression: constant(Number(sum)),
      provenance: { kind: 'derived', sourceIds: [target.id, source.id, multiplier.id], methodId: 'law.linear-algebra.row-replacement' } });
    contributions.push(Object.freeze({ column: c, role: c === coefficients.columnCount ? 'rhs' as const : 'coefficient' as const,
      source, target, multiplier, scaled: Number(scaled), result }));
  }
  const nextRows = coefficients.rows.map((row, r) => r === targetRow ? contributions.slice(0, -1).map(p => p.result) : row);
  const nextRhs = Object.freeze(input.rhs.map((value, r) => r === targetRow ? contributions.at(-1)!.result : value));
  const next = createKpTypedMatrixFromRows({ id: `${id}.coefficients`, rows: nextRows,
    provenance: { kind: 'derived', sourceIds: [coefficients.id, multiplier.id], methodId: 'law.linear-algebra.row-replacement' } });
  // For every x, e'_t = e_t + k e_s and e'_s = e_s. Subtracting k e'_s
  // recovers e_t. Thus simultaneous zero residuals agree in BOTH directions;
  // the argument does not depend on a sampled solution or matrix invertibility.
  return Object.freeze({ status: 'checked' as const, id, sourceRow, targetRow, multiple,
    before: Object.freeze({ coefficients, rhs: Object.freeze([...input.rhs]) }),
    after: Object.freeze({ coefficients: next, rhs: nextRhs }), contributions: Object.freeze(contributions),
    witness: Object.freeze({ relation: 'same-solution-set' as const,
      lawId: 'law.linear-algebra.row-replacement', inverseMultiple: -multiple,
      residualIdentity: 'target-next = target + multiple * source; source-next = source' as const }),
  });
}
export type CheckedRowAddition = Extract<ReturnType<typeof checkLinearSystemRowAddition>, { status: 'checked' }>;
