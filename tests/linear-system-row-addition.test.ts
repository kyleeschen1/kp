import { test } from 'node:test';
import assert from 'node:assert/strict';
import { constant, variable } from '../src/math/expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows, evaluateKpTypedMatrix, type KpScalarValue, type KpTypedMatrix } from '../src/math/typed-semantic-math.ts';
import { checkLinearSystemRowAddition } from '../src/math/linear-system-row-addition.ts';

const scalar = (id: string, n: number) => createKpScalarExpression({ id, expression: constant(n) });
const source = (rows = [[2, -1, 3], [0, 1, -2]], rhs = [7, -1]) => ({ id: 'add-row',
  coefficients: createKpTypedMatrixFromRows({ id: 'A', rows: rows.map((row, r) => row.map((n, c) => scalar(`a.${r}.${c}`, n))) }),
  rhs: rhs.map((n, r) => scalar(`b.${r}`, n)), sourceRow: 1, targetRow: 0, multiple: 1 });
const number = (e: KpScalarValue) => { assert.equal(e.expression.kind, 'constant'); return e.expression.kind === 'constant' ? e.expression.value : NaN; };

test('row replacement changes RHS with coefficients and retains source referents', () => {
  const input = source(), step = checkLinearSystemRowAddition(input);
  assert.equal(step.status, 'checked'); if (step.status !== 'checked') return;
  assert.deepEqual(evaluateKpTypedMatrix(step.after.coefficients, {}), [[2, 0, 1], [0, 1, -2]]);
  assert.deepEqual(step.after.rhs.map(number), [6, -1]);
  assert.equal(step.after.rhs[1], input.rhs[1]);
  step.after.coefficients.rows[1]!.forEach((v, c) => assert.equal(v, input.coefficients.rows[1]![c]));
  assert.equal(step.contributions.at(-1)!.role, 'rhs');
  for (const p of step.contributions) {
    assert.notEqual(p.result.id, p.target.id);
    assert.deepEqual(p.result.provenance, { kind: 'derived', sourceIds: [p.target.id, p.source.id, p.multiplier.id], methodId: step.witness.lawId });
  }
  assert.deepEqual(evaluateKpTypedMatrix(input.coefficients, {}), [[2, -1, 3], [0, 1, -2]]);
  for (const z of [-4, 0, 2, 5]) {
    const assignment = [(6 - z) / 2, 2 * z - 1, z];
    for (const system of [step.before, step.after]) {
      const values = evaluateKpTypedMatrix(system.coefficients, {});
      values.forEach((row, r) => assert.equal(row.reduce((sum, n, c) => sum + n * assignment[c]!, 0), number(system.rhs[r]!)));
    }
  }
});

test('inverse recovers every entry and residual identity holds for varied systems and assignments', () => {
  for (const k of [-3, -1, 0, 1, 2]) for (const targetRow of [0, 1]) for (let seed = -3; seed <= 3; seed++) {
    const input = { ...source([[seed, 2, -1], [1, seed, 3]], [seed + 1, -2]), targetRow, sourceRow: 1 - targetRow, multiple: k };
    const step = checkLinearSystemRowAddition(input); assert.equal(step.status, 'checked'); if (step.status !== 'checked') continue;
    const inverse = checkLinearSystemRowAddition({ ...input, id: 'inverse', ...step.after, multiple: step.witness.inverseMultiple });
    assert.equal(inverse.status, 'checked'); if (inverse.status !== 'checked') continue;
    assert.deepEqual(evaluateKpTypedMatrix(inverse.after.coefficients, {}), evaluateKpTypedMatrix(input.coefficients, {}));
    assert.deepEqual(inverse.after.rhs.map(number), input.rhs.map(number));
    for (const x of [[0, 0, 0], [1, -2, 3], [-4, 2, 1]]) {
      const residuals = (system: { coefficients: KpTypedMatrix; rhs: readonly KpScalarValue[] }): number[] => evaluateKpTypedMatrix(system.coefficients, {}).map((row, r) => row.reduce((a, n, c) => a + n * x[c]!, 0) - number(system.rhs[r]!));
      const before = residuals(step.before), after = residuals(step.after);
      assert.equal(after[targetRow], before[targetRow]! + k * before[input.sourceRow]!);
      assert.equal(after[input.sourceRow], before[input.sourceRow]);
      assert.equal(before.every(n => n === 0), after.every(n => n === 0));
    }
  }
});

test('self-addition, missing RHS, symbolic entries and unsafe arithmetic return repairs', () => {
  const input = source();
  for (const bad of [{ ...input, sourceRow: 0 }, { ...input, targetRow: 5 }, { ...input, rhs: [] },
    { ...input, multiple: NaN }, { ...input, multiple: .5 }, { ...source([[1, 1], [Number.MAX_SAFE_INTEGER, 1]]), multiple: 2 },
    { ...input, rhs: [scalar('add-row.result.0', 7), input.rhs[1]!] },
    { ...input, rhs: [createKpScalarExpression({ id: 'symbol', expression: variable('a') }), input.rhs[1]!] }]) {
    assert.equal(checkLinearSystemRowAddition(bad).status, 'repair-required');
  }
});
