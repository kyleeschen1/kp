import assert from 'node:assert/strict';
import test from 'node:test';
import { addKpRationals, multiplyKpRationals, createKpRational, equalKpRationals } from '../domains/math/exact-rational.ts';
import { readExactRowValue } from '../src/math/linear-system-row-operation.ts';
import { generateSystemProblem } from '../src/math/system-generator.ts';
import { createSystemsExplorer } from '../src/experiments/rectangular-product/systems-explorer-model.ts';
import { consistencyCases, selectConsistencyCase } from '../src/experiments/rectangular-product/systems-contrast.ts';

test('consistency contrast holds A and the operation fixed while exposing distinct RHS witnesses', () => {
  const a = consistencyCases.compatible, b = consistencyCases.incompatible;
  assert.equal(a.initial.coefficients, b.initial.coefficients);
  assert.equal(a.initial.rhs[0], b.initial.rhs[0]);
  assert.notEqual(a.initial.rhs[1], b.initial.rhs[1]);
  assert.equal(a.trace.steps.length, 1); assert.equal(b.trace.steps.length, 1);
  assert.deepEqual(a.trace.steps[0]!.checked.operation, b.trace.steps[0]!.checked.operation);
  assert.deepEqual(a.model.stops, b.model.stops);
  assert.equal(a.model.steps[0]!.checked, a.trace.steps[0]!.checked);
  assert.equal(b.model.steps[0]!.checked, b.trace.steps[0]!.checked);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    assert.deepEqual(readExactRowValue(a.trace.final.coefficients.rows[r]![c]!), readExactRowValue(b.trace.final.coefficients.rows[r]![c]!));
  }
  assert.equal(a.residual.numerator, 0n); assert.equal(b.residual.numerator, 1n);
  assert.equal(a.trace.solution.kind, 'infinite'); assert.equal(b.trace.solution.kind, 'none');
  assert.equal(a.trace.rank, 1); assert.equal(b.trace.rank, 1);
  assert.equal(a.trace.augmentedRank, 1); assert.equal(b.trace.augmentedRank, 2);
  // Arbitrary members of the compatible family satisfy both rows; the altered
  // second RHS is always missed by exactly one, independent of the parameter.
  for (const y of [-7, 0, 4]) {
    const x = 3 - y;
    assert.equal(x + y, 3); assert.equal(2 * x + 2 * y, 6);
    assert.equal(7 - (2 * x + 2 * y), 1);
  }
  assert.equal(selectConsistencyCase('unknown').status, 'repair-required');
});

test('seeded generated cases have independently measured rank and exact solution witnesses', () => {
  for (const size of [2, 3] as const) for (const kind of ['unique', 'infinite', 'none'] as const) for (let seed = 0; seed < 80; seed++) {
    const result = generateSystemProblem({ size, kind, seed });
    assert.equal(result.status, 'generated'); if (result.status !== 'generated') continue;
    const { initial, solution: trace } = result;
    const rows = initial.coefficients.rows.map(row => row.map(v => Number(readExactRowValue(v)!.numerator)));
    const minor = (a: number, b: number, c: number, d: number) => rows[a]![c]! * rows[b]![d]! - rows[a]![d]! * rows[b]![c]!;
    const determinant = size === 2 ? minor(0, 1, 0, 1) : rows[0]![0]! * minor(1, 2, 1, 2) - rows[0]![1]! * minor(1, 2, 0, 2) + rows[0]![2]! * minor(1, 2, 0, 1);
    const rank = determinant ? size : size === 3 && [0, 1, 2].some(a => [0, 1, 2].some(b => a < b && [0, 1, 2].some(c => [0, 1, 2].some(d => c < d && minor(a, b, c, d) !== 0)))) ? 2 : rows.flat().some(v => v !== 0) ? 1 : 0;
    assert.equal(trace.rank, rank); assert.equal(trace.solution.kind, kind);
    for (let i = 1; i < trace.steps.length; i++) assert.equal(trace.steps[i]!.checked.before.coefficients, trace.steps[i - 1]!.checked.after.coefficients);
    for (const { row, column } of trace.pivots) for (let below = row + 1; below < size; below++)
      assert.equal(readExactRowValue(trace.echelon.coefficients.rows[below]![column]!)!.numerator, 0n);
    const solution = trace.solution;
    if (solution.kind === 'none') {
      assert.ok(trace.final.coefficients.rows[solution.contradictionRow]!.every(v => readExactRowValue(v)!.numerator === 0n));
      assert.notEqual(readExactRowValue(trace.final.rhs[solution.contradictionRow]!)!.numerator, 0n);
    } else {
      const particular = solution.kind === 'unique' ? solution.values : solution.particular;
      const apply = (vector: typeof particular) => initial.coefficients.rows.map(row => row.reduce((sum, value, c) => addKpRationals(sum, multiplyKpRationals(readExactRowValue(value)!, vector[c]!)), createKpRational(0n)));
      apply(particular).forEach((value, r) => assert.ok(equalKpRationals(value, readExactRowValue(initial.rhs[r]!)!)));
      if (solution.kind === 'infinite') for (const direction of solution.directions) assert.ok(apply(direction).every(v => v.numerator === 0n));
    }
  }
});

test('bounded explorer variations require only source, retain solver objects, and reproduce their seed', () => {
  let fractions = 0, zeroRows = 0;
  for (const size of [2, 3] as const) for (const kind of ['unique', 'infinite', 'none'] as const) for (let seed = 1; seed <= 12; seed++) {
    const result = createSystemsExplorer({ size, kind, seed });
    assert.equal(result.status, 'ready', `${size}/${kind}/${seed}`); if (result.status !== 'ready') continue;
    const { model, generated } = result;
    assert.equal(model.before.product.left, generated.initial.coefficients);
    assert.equal(model.after.product.left, generated.solution.final.coefficients);
    model.steps.forEach((step, i) => assert.equal(step.checked, generated.solution.steps[i]!.checked));
    assert.equal(model.after.inputs, model.before.inputs);
    const again = createSystemsExplorer({ size, kind, seed });
    assert.equal(again.status, 'ready'); if (again.status === 'ready') assert.equal(again.model.reading, model.reading);
    if (model.after.coefficients.some(row => row.every(v => v === 0))) zeroRows++;
    if (generated.solution.final.coefficients.rows.flat().some(v => readExactRowValue(v)!.denominator !== 1n)) fractions++;
    for (const question of result.questions) assert.ok(model.beats.some(beat => beat.id === question.milestone));
    if (generated.solution.solution.kind === 'infinite') for (const value of [-3, 0, 3]) {
      const sample = result.inspectParameters(generated.solution.solution.freeColumns.map(() => value));
      assert.equal(sample.status, 'evaluated');
      if (sample.status === 'evaluated') sample.image.forEach((q, r) => assert.ok(equalKpRationals(q, readExactRowValue(generated.initial.rhs[r]!)!)));
    }
  }
  assert.ok(fractions > 0); assert.ok(zeroRows > 0);
  assert.equal(createSystemsExplorer({ size: 2, kind: 'unique', seed: NaN }).status, 'repair-required');
  assert.equal(generateSystemProblem({ size: 2, kind: 'none', rank: 2, seed: 1 }).status, 'repair-required');
  const plane = createSystemsExplorer({ size: 3, rank: 1, kind: 'infinite', seed: 1 });
  assert.equal(plane.status, 'ready');
  if (plane.status === 'ready') {
    assert.equal(plane.generated.solution.rank, 1);
    assert.equal(plane.inspectParameters([1, -2]).status, 'evaluated');
    assert.equal(plane.inspectParameters([1]).status, 'repair-required');
  }
});
