import { expressionToLatex } from '../../math/expression.ts';
import type { LinearSystem, RowOperation } from '../../math/linear-system-row-operation.ts';
import type { KpScalarValue } from '../../math/typed-semantic-math.ts';
export function rowOperationLatex(op: RowOperation) {
  if (op.kind === 'swap') return `R_${op.first + 1}\\leftrightarrow R_${op.second + 1}`;
  const factor = op.factor.denominator === 1n ? String(op.factor.numerator) : `\\frac{${op.factor.numerator}}{${op.factor.denominator}}`;
  return op.kind === 'scale' ? `R_${op.row + 1}\\leftarrow (${factor})R_${op.row + 1}`
    : `R_${op.targetRow + 1}\\leftarrow R_${op.targetRow + 1}+(${factor})R_${op.sourceRow + 1}`;
}
export function rowSystemLatex(system: LinearSystem, unknowns: readonly KpScalarValue[]) {
  const matrix = (rows: readonly (readonly string[])[]) => `\\begin{bmatrix}${rows.map(row => row.join('&')).join('\\\\')}\\end{bmatrix}`;
  return `${matrix(system.rhs.map(v => [expressionToLatex(v.expression)]))}=${matrix(system.coefficients.rows.map(row => row.map(v => expressionToLatex(v.expression))))}${matrix(unknowns.map(v => [expressionToLatex(v.expression)]))}`;
}
