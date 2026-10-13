import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rowComposition, rowCompositionStops, sampleRowComposition, sampleCompiledRowComposition, projectSystemCollection, compileRowComposition, originalRowCompositionSource } from '../src/experiments/rectangular-product/row-composition-model.ts';
import { eliminateSecondComposition, eliminateSecondSource } from '../src/experiments/rectangular-product/row-composition-variation.ts';
import { linearSystemModel } from '../src/experiments/rectangular-product/linear-system-source.ts';
import { requireRowWorkbenchSource } from '../src/experiments/rectangular-product/row-workbench-source.ts';
import { originalRowSource, redundantRowSource } from '../src/experiments/rectangular-product/row-workbench-examples.ts';
import { compileRowSequenceComposition } from '../src/experiments/rectangular-product/row-composition-model.ts';
import { eliminationSequenceSource, eliminationSequenceComposition } from '../src/experiments/rectangular-product/row-composition-sequence.ts';

test('a composed sequence keeps every checked predecessor and exposes meaningful exact milestones', () => {
  const model = eliminationSequenceComposition;
  assert.deepEqual(model.steps.map(step => step.operation.kind), ['swap', 'scale', 'add']);
  assert.equal(model.steps[0]!.checked.before.coefficients, model.before.product.left);
  for (let i = 1; i < model.steps.length; i++) {
    assert.equal(model.steps[i]!.checked.before.coefficients, model.steps[i - 1]!.checked.after.coefficients);
    model.steps[i]!.checked.before.rhs.forEach((value, r) => assert.equal(value, model.steps[i - 1]!.checked.after.rhs[r]));
  }
  assert.equal(model.after.product.left, model.steps.at(-1)!.checked.after.coefficients);
  assert.deepEqual(model.after.coefficients, [[1, 0, -2], [0, 1, 1]]);
  assert.match(model.after.expandedEquation, /-1=x-2z/);
  assert.match(model.after.expandedEquation, /2=y\+z/);
  assert.deepEqual(model.beats.map(beat => beat.id), ['equations', 'matrix', 'swap', 'normalize', 'eliminate', 'expanded']);
  for (let i = 0; i < model.steps.length; i++) {
    const start = model.stops[i + 1]!, end = model.stops[i + 2]!;
    const frame = sampleCompiledRowComposition(model, (start + end) / 2);
    assert.equal(frame.operationIndex, i); assert.equal(frame.layer, 'operation');
    assert.equal(frame.beat.cue, model.steps[i]!.during);
    assert.ok(Math.abs(frame.local - .5) < 1e-10);
    assert.equal(sampleCompiledRowComposition(model, start).local, 0);
    assert.equal(sampleCompiledRowComposition(model, end).beat.cue, model.steps[i]!.after);
    assert.equal(sampleCompiledRowComposition(model, end - Number.EPSILON).beat.cue, model.steps[i]!.after);
    assert.equal(sampleCompiledRowComposition(model, end + Number.EPSILON).beat.cue, model.steps[i]!.after);
  }
  const samples = Array.from({ length: 101 }, (_, i) => i / 100);
  assert.deepEqual(samples.map(p => sampleCompiledRowComposition(model, p)), samples.reverse().map(p => sampleCompiledRowComposition(model, p)).reverse());
  // The claimed free-variable family satisfies the original two constraints.
  for (const z of [-3, 0, 4]) { const x = 2 * z - 1, y = 2 - z; assert.equal(2 * y + 2 * z, 4); assert.equal(x + y - z, 1); }
});

test('sequence compilation rejects invalid intermediate states and ambiguous milestones before playback', () => {
  const source = eliminationSequenceSource;
  const invalid = [
    { ...source, steps: [] },
    { ...source, steps: Array.from({ length: 17 }, (_, i) => ({ ...source.steps[0]!, id: `step-${i}` })) },
    { ...source, steps: [source.steps[0]!, source.steps[0]!] },
    { ...source, steps: [{ ...source.steps[0]!, id: 'matrix' }] },
    { ...source, steps: [{ ...source.steps[0]!, operation: { kind: 'scale' as const, row: 0, factor: 0 } }] },
    { ...source, steps: [{ ...source.steps[0]!, id: 'oversize', operation: { kind: 'scale' as const, row: 0, factor: 10 } }, source.steps[0]!] },
  ];
  for (const input of invalid) assert.equal(compileRowSequenceComposition(input).status, 'repair-required');
  const result = compileRowSequenceComposition(invalid[5]!);
  if (result.status !== 'repair-required') assert.fail('Expected bounded collection repair');
  assert.equal(result.path, 'steps.0.after.coefficients.0.1');
  assert.deepEqual(source.before.coefficients, [[0, 2, 2], [1, 1, -1]]);
});

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

test('zero and fractional endpoints retain exact objects while oversized coefficients still repair', () => {
  const zero = requireRowWorkbenchSource(redundantRowSource).steps[0]!.checked.after;
  const zeroProjection = projectSystemCollection(linearSystemModel, zero);
  assert.equal(zeroProjection.status, 'projected');
  if (zeroProjection.status === 'projected') {
    assert.equal(zeroProjection.model.product.left, zero.coefficients);
    assert.match(zeroProjection.model.expandedEquation, /0=0/);
  }
  const fractional = requireRowWorkbenchSource({ ...originalRowSource, coefficients: [['1/2', -1, 3], [0, 1, -2]], steps: [originalRowSource.steps[0]!] });
  const result = projectSystemCollection(linearSystemModel, fractional.initial);
  assert.equal(result.status, 'projected');
  if (result.status === 'projected') {
    assert.equal(result.model.product.left, fractional.initial.coefficients);
    assert.match(result.model.expandedEquation, /\\frac\{1\}\{2\}x/);
  }
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

test('composition source fails closed for unsupported operations and annotations while admitting zero rows', () => {
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
  assert.equal(zero.status, 'compiled');
  if (zero.status === 'compiled') assert.match(zero.after.expandedEquation, /0=0/);
});
