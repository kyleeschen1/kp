import { createKpRational, divideKpRationals, negateKpRational, type KpNormalizedRational } from '../../domains/math/exact-rational.ts';
import { checkLinearSystemRowOperation, readExactRowValue, type LinearSystem, type CheckedRowOperation, type RowOperation } from './linear-system-row-operation.ts';

const gap = (path: string, message: string) => ({ status: 'repair-required' as const, path, message });
export interface EliminationStep { readonly id: string; readonly checked: CheckedRowOperation; readonly stage: 'forward' | 'backward'; readonly pivotColumn: number }
export type SystemSolution =
  | { readonly kind: 'none'; readonly contradictionRow: number }
  | { readonly kind: 'unique'; readonly values: readonly KpNormalizedRational[] }
  | { readonly kind: 'infinite'; readonly freeColumns: readonly number[]; readonly particular: readonly KpNormalizedRational[]; readonly directions: readonly (readonly KpNormalizedRational[])[] };

/** First available nonzero pivot, forward elimination, then backward reduction.
 * Every state is issued by the existing exact row-operation authority. */
export function eliminateSystem(id: string, initial: LinearSystem) {
  const { rowCount: m, columnCount: n } = initial.coefficients;
  if (!/^[A-Za-z][\w.-]*$/.test(id)) return gap('id', 'Supply a stable elimination ID.');
  if (m < 2 || m > 3 || n < 2 || n > 3 || initial.rhs.length !== m)
    return gap('shape', 'This solver supports two or three equations and unknowns.');
  if ([...initial.coefficients.rows.flat(), ...initial.rhs].some(v => !readExactRowValue(v)))
    return gap('entries', 'Elimination requires exact rational entries.');
  let current = initial;
  const steps: EliminationStep[] = [], pivots: { row: number; column: number }[] = [];
  const at = (r: number, c: number) => readExactRowValue(current.coefficients.rows[r]![c]!)!;
  const apply = (operation: RowOperation, stage: EliminationStep['stage'], pivotColumn: number) => {
    const stepId = `${id}.step-${steps.length + 1}`;
    const checked = checkLinearSystemRowOperation({ id: stepId, before: current, operation });
    if (checked.status !== 'checked') return checked;
    steps.push(Object.freeze({ id: stepId, checked, stage, pivotColumn })); current = checked.after;
    return undefined;
  };
  for (let c = 0, r = 0; c < n && r < m; c++) {
    const found = Array.from({ length: m - r }, (_, i) => r + i).find(i => at(i, c).numerator !== 0n);
    if (found === undefined) continue;
    if (found !== r) { const failure = apply({ kind: 'swap', first: r, second: found }, 'forward', c); if (failure) return failure; }
    pivots.push({ row: r, column: c });
    for (let below = r + 1; below < m; below++) if (at(below, c).numerator !== 0n) {
      const failure = apply({ kind: 'add', sourceRow: r, targetRow: below, factor: negateKpRational(divideKpRationals(at(below, c), at(r, c))) }, 'forward', c);
      if (failure) return failure;
    }
    r++;
  }
  const echelon = current, echelonStepCount = steps.length;
  const contradictionRow = current.coefficients.rows.findIndex((row, r) => row.every(v => readExactRowValue(v)!.numerator === 0n) && readExactRowValue(current.rhs[r]!)!.numerator !== 0n);
  // A witnessed contradiction already answers the question; don't animate
  // gratuitous normalization or imply a parameterization exists.
  if (contradictionRow < 0) for (const pivot of [...pivots].reverse()) {
    const value = at(pivot.row, pivot.column);
    if (value.numerator !== value.denominator) {
      const failure = apply({ kind: 'scale', row: pivot.row, factor: divideKpRationals(createKpRational(1n), value) }, 'backward', pivot.column);
      if (failure) return failure;
    }
    for (let above = 0; above < pivot.row; above++) if (at(above, pivot.column).numerator !== 0n) {
      const failure = apply({ kind: 'add', sourceRow: pivot.row, targetRow: above, factor: negateKpRational(at(above, pivot.column)) }, 'backward', pivot.column);
      if (failure) return failure;
    }
  }
  const freeColumns = Array.from({ length: n }, (_, c) => c).filter(c => !pivots.some(p => p.column === c));
  const particular = Array.from({ length: n }, () => createKpRational(0n));
  for (const pivot of pivots) particular[pivot.column] = readExactRowValue(current.rhs[pivot.row]!)!;
  const solution: SystemSolution = contradictionRow >= 0 ? { kind: 'none', contradictionRow }
    : freeColumns.length === 0 ? { kind: 'unique', values: Object.freeze(particular) }
    : { kind: 'infinite', freeColumns: Object.freeze(freeColumns), particular: Object.freeze(particular),
      directions: Object.freeze(freeColumns.map(c => Object.freeze(Array.from({ length: n }, (_, j) => {
        const pivot = pivots.find(p => p.column === j);
        return pivot ? negateKpRational(at(pivot.row, c)) : createKpRational(j === c ? 1n : 0n);
      })))) };
  return Object.freeze({ status: 'solved' as const, initial, final: current, echelon, echelonStepCount,
    steps: Object.freeze(steps), pivots: Object.freeze(pivots.map(p => Object.freeze(p))), rank: pivots.length,
    augmentedRank: pivots.length + (contradictionRow >= 0 ? 1 : 0), solution: Object.freeze(solution),
    rowsIndependent: pivots.length === m, columnsIndependent: pivots.length === n });
}
export type SystemElimination = Extract<ReturnType<typeof eliminateSystem>, { status: 'solved' }>;
