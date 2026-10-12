import assert from 'node:assert/strict';
import test from 'node:test';
import { constant, variable, power, compileExpression } from '../src/math/expression.ts';
import { compileCollectionSource, requireCollectionSource, sampleCollection, type CollectionSource } from '../src/experiments/rectangular-product/collection-source.ts';
import { polynomialSource, polynomialModel } from '../src/experiments/rectangular-product/polynomial-model.ts';
import { linearSystemSource, linearSystemModel } from '../src/experiments/rectangular-product/linear-system-source.ts';
import { renderCollectionReading } from '../src/experiments/rectangular-product/collection-reading.ts';

test('source-only coefficient and order changes retain exact factors and derived output identities', () => {
  const source: CollectionSource = { ...polynomialSource, id: 'changed',
    coefficients: [[1, -1, 0], [-1, 2, 3]], inputs: [constant(1), power(variable('s'), 2), variable('s')],
    domain: { kind: 'polynomials', names: ['r(s)', 'h(s)'] }, focus: { row: 1, column: 2 } };
  const model = requireCollectionSource(source);
  for (const [r, row] of model.coefficients.entries()) for (const [c, value] of row.entries()) {
    const pair = model.product.cell(r, 0).dot.pairs[c]!;
    assert.equal(pair.left, model.product.left.rows[r]![c]);
    assert.equal(pair.right, model.inputs[c]);
    assert.equal(compileExpression(pair.left.expression)({}), value);
  }
  assert.equal(model.outputs[0]!.id, model.product.result.rows[0]![0]!.id);
  assert.equal(compileExpression(model.product.result.rows[0]![0]!.expression)({ s: 3 }), -8);
  assert.equal(compileExpression(model.product.result.rows[1]![0]!.expression)({ s: 3 }), 26);
  assert.match(model.equation, /1&-1&0/);
  assert.match(model.equation, /r\(s\)/);
  assert.deepEqual(model.focus, { row: 1, column: 2 });
  assert.ok(Object.isFrozen(model.coefficients[0]));
});

test('system RHS is independent of the computed expression; it defines constraints, not identities', () => {
  const m = linearSystemModel;
  assert.equal(m.kind, 'linear-system');
  assert.equal(m.inputs.length, 3);
  assert.equal(m.outputs[0]!.latex, '7');
  assert.notEqual(m.outputs[0]!.id, m.product.result.rows[0]![0]!.id);
  const evaluate = (x: number, y: number, z: number) => m.product.result.rows.map(row => compileExpression(row[0]!.expression)({ x, y, z }));
  assert.deepEqual(evaluate(3, 1, 1), [8, -1]);
  assert.deepEqual(evaluate(2.5, 1, 1), [7, -1]);
  assert.equal(m.inputs[2]!.expression.kind, 'variable');
  assert.ok(m.expandedEquation.includes('7=2x-y+3z'));
  assert.ok(m.expandedEquation.includes('-1=y-2z'));
});

test('weighted beat timing changes neither semantic endpoints nor direct-seek/reverse state', () => {
  const m = requireCollectionSource({ ...polynomialSource, pacing: { pivot: 9000, hold: 6000 } });
  assert.equal(m.durationMs, 36000);
  assert.equal(m.equation, polynomialModel.equation);
  for (const [i, stop] of m.stops.entries()) {
    const sampled = sampleCollection(m, stop);
    assert.equal(sampled.phase, i);
    assert.equal(sampled.beat.id, m.beats[i]!.id);
  }
  const points = [0, .01, .23, .51, .88, 1];
  const forward = points.map(p => sampleCollection(m, p));
  assert.deepEqual([...points].reverse().map(p => sampleCollection(m, p)).reverse(), forward);
  assert.throws(() => sampleCollection(m, NaN), /finite/);
  assert.equal(sampleCollection(m, -3).phase, 0);
  assert.equal(sampleCollection(m, 9).phase, 8);
});

test('unsupported presentation and invalid source return located repairs rather than substituted motion', () => {
  const cases: [Partial<CollectionSource>, string, string][] = [
    [{ coefficients: [[1], [2]] }, 'source', 'coefficients'],
    [{ coefficients: [[Infinity, 1, 1, 1], [1, 1, 1, 1]] }, 'source', 'coefficients'],
    [{ coefficients: [[12, 1, 1, 1], [1, 1, 1, 1]] }, 'presentation', 'coefficients'],
    [{ coefficients: [[0, 0, 0, 0], [1, 1, 1, 1]] }, 'presentation', 'coefficients'],
    [{ inputs: [variable('t'), variable('t'), variable('t'), constant(1)] }, 'source', 'inputs'],
    [{ inputs: [variable('longLabel'), power(variable('t'), 2), variable('t'), constant(1)] }, 'presentation', 'inputs'],
    [{ focus: { row: 3, column: 0 } }, 'source', 'focus'],
    [{ pacing: { collect: 0 } }, 'presentation', 'pacing'],
    [{ domain: { kind: 'polynomials', names: ['<b>', 'q(t)'] } }, 'presentation', 'domain.names'],
    [{ id: 'bad"id' }, 'source', 'id'],
  ];
  for (const [change, code, path] of cases) {
    const result = compileCollectionSource({ ...polynomialSource, ...change });
    assert.equal(result.status, 'repair-required');
    if (result.status === 'repair-required') { assert.equal(result.code, code); assert.equal(result.path, path); }
  }
  const nonlinear = compileCollectionSource({ ...linearSystemSource, inputs: [variable('x'), variable('y'), power(variable('z'), 2)] });
  assert.equal(nonlinear.status, 'repair-required');
});

test('standalone reading preserves both equations and escapes annotations without loading an animation runtime', () => {
  const model = requireCollectionSource({ ...linearSystemSource, annotations: { ...linearSystemSource.annotations, hold: '<script>alert(1)</script>' } });
  const html = renderCollectionReading(model);
  assert.equal((html.match(/<math /g) ?? []).length, 2);
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('<link'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('no solution is asserted'));
  assert.ok(html.includes('<mn>7</mn>'));
  assert.ok(html.includes('<mi>z</mi>'));
});
