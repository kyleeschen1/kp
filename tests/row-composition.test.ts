import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rowComposition, rowCompositionStops, sampleRowComposition, sampleCompiledRowComposition, projectSystemCollection, compileRowComposition, originalRowCompositionSource } from '../src/experiments/rectangular-product/row-composition-model.ts';
import { eliminateSecondComposition, eliminateSecondSource } from '../src/experiments/rectangular-product/row-composition-variation.ts';
import { linearSystemModel } from '../src/experiments/rectangular-product/linear-system-source.ts';
import { requireRowWorkbenchSource } from '../src/experiments/rectangular-product/row-workbench-source.ts';
import { originalRowSource, redundantRowSource } from '../src/experiments/rectangular-product/row-workbench-examples.ts';

test('collection and expansion use the exact checked objects, not a reconstructed matching fixture', () => {
  const { before, step, after } = rowComposition;
  assert.equal(before, linearSystemModel);
  assert.equal(step.before.coefficients, before.product.left);
  assert.equal(after.product.left, step.after.coefficients);
  assert.equal(after.inputs, before.inputs); assert.equal(after.product.right, before.product.right);
  for (let r = 0; r < 2; r++) {
    const original = before.outputs[r]!, result = after.outputs[r]!;
    assert.equal(original.kind, 'constraint-rhs'); assert.equal(result.kind, 'constraint-rhs');
    assert.equal(original.value, step.before.rhs[r]); assert.equal(result.value, step.after.rhs[r]);
    for (let c = 0; c < 3; c++) {
      assert.equal(after.product.cell(r, 0).dot.pairs[c]!.left, step.after.coefficients.rows[r]![c]);
      assert.equal(after.product.cell(r, 0).dot.pairs[c]!.right, before.inputs[c]);
    }
  }
  assert.equal(step.before.coefficients.rows[1]![1], step.after.coefficients.rows[1]![1]);
  assert.notEqual(step.before.coefficients.rows[0]![1], step.after.coefficients.rows[0]![1]);
  assert.match(after.expandedEquation, /6=2x\+z/); assert.match(after.expandedEquation, /-1=y-2z/);
  assert.equal(step.witness.relation, 'same-solution-set');
});

test('checked endpoints outside collection support yield located repairs without changing referents', () => {
  const zero = requireRowWorkbenchSource(redundantRowSource).steps[0]!.checked.after;
  assert.deepEqual(projectSystemCollection(linearSystemModel, zero), { status: 'repair-required', path: 'coefficients.1', message: 'A whole-zero row needs a separate collection presentation.' });
  const fractional = requireRowWorkbenchSource({ ...originalRowSource, coefficients: [['1/2', -1, 3], [0, 1, -2]], steps: [originalRowSource.steps[0]!] });
  const result = projectSystemCollection(linearSystemModel, fractional.initial);
  assert.equal(result.status, 'repair-required'); if (result.status === 'repair-required') assert.equal(result.path, 'coefficients.0.0');
  const big = requireRowWorkbenchSource({ ...originalRowSource, coefficients: [[10, -1, 3], [0, 1, -2]], steps: [originalRowSource.steps[0]!] });
  assert.equal(projectSystemCollection(linearSystemModel, big.initial).status, 'repair-required');
});

test('composition seeks and reverses through the same ordered semantic stages', () => {
  const points = [0, .12, ...rowCompositionStops.slice(1, 3), .9, 1];
  assert.deepEqual(points.map(sampleRowComposition), [...points].reverse().map(sampleRowComposition).reverse());
  assert.equal(sampleRowComposition(rowCompositionStops[1]).layer, 'operation');
  assert.equal(sampleRowComposition(rowCompositionStops[1]).local, 0);
  assert.equal(sampleRowComposition(rowCompositionStops[2]).layer, 'after');
  assert.equal(sampleRowComposition(1).local, 0);
  assert.throws(() => sampleRowComposition(NaN), /finite/);
  assert.equal(sampleRowComposition(-1).progress, 0); assert.equal(sampleRowComposition(2).progress, 1);
});

test('source variation changes the receiving row while preserving actual referents and clock semantics', () => {
  const model = eliminateSecondComposition;
  assert.equal(model.before, eliminateSecondSource.before);
  assert.equal(model.step.before.coefficients, model.before.product.left);
  assert.equal(model.after.product.left, model.step.after.coefficients);
  assert.equal(model.after.inputs, model.before.inputs);
  assert.deepEqual(model.after.coefficients, [[1, 2, -1], [0, 3, 1]]);
  assert.match(model.after.expandedEquation, /4=u\+2v-w/);
  assert.match(model.after.expandedEquation, /6=3v\+w/);
  for (let c = 0; c < 3; c++) {
    assert.equal(model.step.before.coefficients.rows[0]![c], model.step.after.coefficients.rows[0]![c]);
    assert.notEqual(model.step.before.coefficients.rows[1]![c], model.step.after.coefficients.rows[1]![c]);
  }
  assert.equal(model.step.before.rhs[0], model.step.after.rhs[0]);
  assert.equal(sampleCompiledRowComposition(model, model.stops[1]).local, 0);
  assert.equal(sampleCompiledRowComposition(model, 1).local, 0);
  assert.equal(model.durationMs, rowComposition.durationMs);
});

test('composition source fails closed for unsupported operations, annotations and zero-row endpoints', () => {
  const self = compileRowComposition({ ...originalRowCompositionSource, operation: { kind: 'add', sourceRow: 0, targetRow: 0, factor: 1 } });
  assert.equal(self.status, 'repair-required');
  const unsupported = compileRowComposition({ ...originalRowCompositionSource,
    // @ts-expect-error A non-unit operation needs its own presentation evidence.
    operation: { kind: 'add', sourceRow: 0, targetRow: 1, factor: -1 } });
  assert.equal(unsupported.status, 'repair-required');
  if (unsupported.status === 'repair-required') assert.equal(unsupported.path, 'operation');
  const missing = compileRowComposition({ ...originalRowCompositionSource, annotations: { ...originalRowCompositionSource.annotations, changed: '' } });
  assert.equal(missing.status, 'repair-required');
  if (missing.status === 'repair-required') assert.equal(missing.path, 'annotations.changed');
  const opposite = requireRowWorkbenchSource({ ...originalRowSource, coefficients: [[1, 2, 3], [-1, -2, -3]], rhs: [1, -1] });
  const before = projectSystemCollection(linearSystemModel, opposite.initial);
  assert.equal(before.status, 'projected');
  if (before.status !== 'projected') return;
  const zero = compileRowComposition({ ...originalRowCompositionSource, before: before.model });
  assert.equal(zero.status, 'repair-required');
  if (zero.status === 'repair-required') assert.equal(zero.path, 'after.coefficients.0');
});
