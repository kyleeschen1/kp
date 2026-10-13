import { createKpRational as q } from '../../../domains/math/exact-rational.ts';
import { expressionToLatex } from '../../math/expression.ts';
import type { LinearSystem, RowOperation } from '../../math/linear-system-row-operation.ts';
import { linearSystemModel } from './linear-system-source.ts';
export const initialRowSystem = Object.freeze({ coefficients: linearSystemModel.product.left,
  rhs: Object.freeze(linearSystemModel.outputs.map(o => { if (o.kind !== 'constraint-rhs') throw new Error('Expected constraint RHS.'); return o.value; })) });
export const rowDemo: readonly RowOperation[] = [
  { kind: 'swap', first: 0, second: 1 },
  { kind: 'add', sourceRow: 0, targetRow: 1, factor: q(1n) },
  { kind: 'scale', row: 1, factor: q(1n, 2n) },
  { kind: 'swap', first: 0, second: 1 },
];
export function rowOperationLatex(op: RowOperation) {
  if (op.kind === 'swap') return `R_${op.first + 1}\\leftrightarrow R_${op.second + 1}`;
  const factor = op.factor.denominator === 1n ? String(op.factor.numerator) : `\\frac{${op.factor.numerator}}{${op.factor.denominator}}`;
  return op.kind === 'scale' ? `R_${op.row + 1}\\leftarrow (${factor})R_${op.row + 1}`
    : `R_${op.targetRow + 1}\\leftarrow R_${op.targetRow + 1}+(${factor})R_${op.sourceRow + 1}`;
}
export function rowSystemLatex(system: LinearSystem) {
  const matrix = (rows: readonly (readonly string[])[]) => `\\begin{bmatrix}${rows.map(row => row.join('&')).join('\\\\')}\\end{bmatrix}`;
  return `${matrix(system.rhs.map(v => [expressionToLatex(v.expression)]))}=${matrix(system.coefficients.rows.map(row => row.map(v => expressionToLatex(v.expression))))}${matrix([['x'], ['y'], ['z']])}`;
}
