import { expressionToLatex } from '../../math/expression.ts';
import { readExactRowValue, type LinearSystem } from '../../math/linear-system-row-operation.ts';
import type { KpScalarValue } from '../../math/typed-semantic-math.ts';
import type { KpCrossViewCorrespondenceMap } from '../../tutorial/cross-view-correspondence.ts';
import { compileKpCrossViewAttentionPlan } from '../../tutorial/cross-view-attention.ts';

const exact = (value: KpScalarValue) => {
  const result = readExactRowValue(value);
  if (!result) throw new Error(`Equation projection needs an exact coefficient: ${value.id}`);
  return result;
};
const magnitude = (n: bigint, d: bigint) => d === 1n ? String(n) : `\\frac{${n}}{${d}}`;

/** Conventional notation is a projection: omitted zeros and unit coefficients
 * still retain their coefficient/unknown correspondence in terms. */
export function projectRowEquations(system: LinearSystem, unknowns: readonly KpScalarValue[], scope: string) {
  if (unknowns.length !== system.coefficients.columnCount || system.rhs.length !== system.coefficients.rowCount)
    throw new Error('Equation projection requires one unknown per column and one RHS per row.');
  const rows = system.coefficients.rows.map((coefficients, row) => {
    const id = `${system.coefficients.id}.row.${row}`, slotId = `${scope}.row.${row}`;
    const terms = coefficients.map((coefficient, column) => {
      const q = exact(coefficient), n = q.numerator < 0n ? -q.numerator : q.numerator;
      return { coefficientId: coefficient.id, unknownId: unknowns[column]!.id, column,
        omitted: n === 0n, negative: q.numerator < 0n,
        body: `${n === q.denominator ? '' : magnitude(n, q.denominator)}${expressionToLatex(unknowns[column]!.expression)}` };
    });
    const body = terms.filter(term => !term.omitted).map((term, index) =>
      `${term.negative ? '-' : index ? '+' : ''}${term.body}`).join('') || '0';
    const rhs = system.rhs[row]!, q = exact(rhs);
    const rhsLatex = `${q.numerator < 0n ? '-' : ''}${magnitude(q.numerator < 0n ? -q.numerator : q.numerator, q.denominator)}`;
    return { id, slotId, row, terms, rhsId: rhs.id, sourceIds: [...coefficients.map(c => c.id), rhs.id],
      matrixSelector: `${id}.matrix`, equationSelector: `${id}.equation`, latex: `${rhsLatex}=${body}` };
  });
  const map: KpCrossViewCorrespondenceMap = {
    id: `${system.coefficients.id}.equation-correspondence`,
    members: rows.flatMap(row => [
      { id: row.matrixSelector, selectorId: row.matrixSelector, viewId: 'matrix', role: 'constraint-row' },
      { id: row.equationSelector, selectorId: row.equationSelector, viewId: 'equations', role: 'constraint-equation' },
    ]),
    identities: rows.map(row => ({ id: row.id, meaning: `Constraint at row ${row.row + 1} of the current system`, memberIds: [row.matrixSelector, row.equationSelector] })),
    correspondences: rows.map(row => ({ id: `${row.id}.link`, sourceMemberId: row.matrixSelector, targetMemberId: row.equationSelector,
      kind: 'representation-to-representation', reversible: true, summary: `Row ${row.row + 1} and its equation express the same constraint.` })),
  };
  return { rows, map };
}
export type RowEquationProjection = ReturnType<typeof projectRowEquations>;

export function rowEquationFocus(projection: RowEquationProjection, slotIds: readonly string[]) {
  const correspondences = slotIds.map(slot => {
    const row = projection.rows.find(row => row.slotId === slot);
    if (!row) throw new Error(`Unknown row focus: ${slot}`);
    return `${row.id}.link`;
  });
  const plan = compileKpCrossViewAttentionPlan({ id: `${projection.map.id}.focus`, map: projection.map, correspondenceIds: correspondences });
  return new Set(plan.salience.intents.flatMap(intent => intent.kind === 'transmit' ? [...intent.sourceEntityIds, ...intent.targetEntityIds] : []));
}
