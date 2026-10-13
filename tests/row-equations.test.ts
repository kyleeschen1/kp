import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectRowEquations, rowEquationFocus } from '../src/experiments/rectangular-product/row-equations.ts';
import { validateKpCrossViewCorrespondenceMap } from '../src/tutorial/cross-view-correspondence.ts';
import { requireRowWorkbenchSource } from '../src/experiments/rectangular-product/row-workbench-source.ts';
import { originalRowSource, redundantRowSource, inconsistentRowSource } from '../src/experiments/rectangular-product/row-workbench-examples.ts';

test('equation projection preserves signed exact terms, omitted zeros, units and independent RHS', () => {
  const model = requireRowWorkbenchSource({ ...originalRowSource, unknowns: ['u', 'v', 'w'],
    coefficients: [['-1/2', 0, 1], [-1, '2/3', 0]], rhs: ['-3/2', 0],
    steps: [originalRowSource.steps[0]!] });
  const p = projectRowEquations(model.initial, model.unknowns, model.id);
  assert.deepEqual(p.rows.map(row => row.latex), ['-\\frac{3}{2}=-\\frac{1}{2}u+w', '0=-u+\\frac{2}{3}v']);
  assert.equal(p.rows[0]!.terms.length, 3);
  assert.equal(p.rows[0]!.terms[1]!.omitted, true);
  for (const row of p.rows) {
    assert.deepEqual(row.sourceIds, [...model.initial.coefficients.rows[row.row]!.map(v => v.id), model.initial.rhs[row.row]!.id]);
    row.terms.forEach((term, c) => assert.equal(term.unknownId, model.unknowns[c]!.id));
  }
  assert.deepEqual(validateKpCrossViewCorrespondenceMap(p.map), []);
  assert.throws(() => projectRowEquations(model.initial, [], model.id), /one unknown/);
  assert.throws(() => rowEquationFocus(p, ['missing']), /Unknown row focus/);
});

test('zero constraints read truthfully and selection resolves both views by identity, not glyph equality', () => {
  for (const [source, result] of [[redundantRowSource, '0=0'], [inconsistentRowSource, '1=0']] as const) {
    const model = requireRowWorkbenchSource(source);
    const p = projectRowEquations(model.steps[0]!.checked.after, model.unknowns, model.id), row = p.rows[1]!;
    assert.equal(row.latex, result);
    assert.equal(new Set(row.terms.map(term => term.coefficientId)).size, 3);
    assert.deepEqual([...rowEquationFocus(p, [row.slotId])], [row.matrixSelector, row.equationSelector]);
    assert.deepEqual([...rowEquationFocus(p, [])], []);
    assert.deepEqual(validateKpCrossViewCorrespondenceMap(p.map), []);
  }
});

test('row slots persist across a swap while their semantic bindings follow the checked permutation', () => {
  const model = requireRowWorkbenchSource(originalRowSource);
  const before = projectRowEquations(model.initial, model.unknowns, model.id);
  const after = projectRowEquations(model.steps[0]!.checked.after, model.unknowns, model.id);
  assert.equal(before.rows[0]!.slotId, after.rows[0]!.slotId);
  assert.notEqual(before.rows[0]!.id, after.rows[0]!.id);
  assert.deepEqual(before.rows[0]!.sourceIds, after.rows[1]!.sourceIds);
  assert.equal(before.rows[0]!.latex, after.rows[1]!.latex);
  assert.deepEqual([...rowEquationFocus(after, [before.rows[0]!.slotId])], [after.rows[0]!.matrixSelector, after.rows[0]!.equationSelector]);
});
