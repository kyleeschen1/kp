import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKpRational as q } from '../domains/math/exact-rational.ts';
import { checkLinearSystemRowOperation, parseRowFactor, readExactRowValue, type RowOperation, type LinearSystem } from '../src/math/linear-system-row-operation.ts';
import { createRowSession } from '../src/experiments/rectangular-product/row-session.ts';
import { linearSystemModel } from '../src/experiments/rectangular-product/linear-system-source.ts';
const initial = { coefficients: linearSystemModel.product.left, rhs: linearSystemModel.outputs.map(o => { if (o.kind !== 'constraint-rhs') throw new Error('RHS'); return o.value; }) };
const values = (system: LinearSystem) => [...system.coefficients.rows.flat(), ...system.rhs].map(readExactRowValue);

test('all elementary operations have exact inverses, including negative fractions and zero row additions', () => {
  const operations: RowOperation[] = [{ kind: 'swap', first: 0, second: 1 }];
  for (const factor of [q(-3n, 2n), q(1n, 3n), q(2n), q(0n)]) for (const row of [0, 1]) {
    operations.push({ kind: 'add', sourceRow: 1 - row, targetRow: row, factor });
    if (factor.numerator !== 0n) operations.push({ kind: 'scale', row, factor });
  }
  for (const operation of operations) {
    const step = checkLinearSystemRowOperation({ id: 'forward', before: initial, operation });
    assert.equal(step.status, 'checked'); if (step.status !== 'checked') continue;
    const reverse = checkLinearSystemRowOperation({ id: 'inverse', before: step.after, operation: step.inverse });
    assert.equal(reverse.status, 'checked'); if (reverse.status !== 'checked') continue;
    assert.deepEqual(values({ ...reverse.after, rhs: [...reverse.after.rhs] }), values(initial));
    assert.equal(step.witness.relation, 'same-solution-set');
    if (operation.kind === 'swap') assert.equal(step.after.coefficients.rows[0]![0], initial.coefficients.rows[1]![0]);
    else { const retained = operation.kind === 'add' ? operation.sourceRow : 1 - operation.row; assert.equal(step.after.rhs[retained], initial.rhs[retained]); }
  }
});
test('invalid inverses, factors, identities and presentation overflow cannot alter history', () => {
  for (const text of ['', '1/0', 'NaN', '.5', '1/2/3', '9'.repeat(200)]) assert.equal(parseRowFactor(text).status, 'repair-required');
  assert.deepEqual(parseRowFactor(' -2 / -4 '), { status: 'parsed', value: q(1n, 2n) });
  const session = createRowSession(initial);
  for (const operation of [{ kind: 'scale', row: 0, factor: q(0n) }, { kind: 'swap', first: 1, second: 1 },
    { kind: 'scale', row: 0, factor: q(999n) }, { kind: 'add', sourceRow: 0, targetRow: 0, factor: q(1n) }] satisfies RowOperation[]) {
    assert.equal(session.begin('apply', operation).status, 'repair-required'); assert.equal(session.current(), initial);
  }
  assert.equal(session.snapshot().history.length, 0);
});
test('transactions serialize operations, commit atomically, cancel stale work and branch after undo', () => {
  const session = createRowSession(initial);
  const begin = (operation: RowOperation) => { const result = session.begin('apply', operation); assert.equal(result.status, 'pending'); return result.transaction; };
  const swap = begin({ kind: 'swap', first: 0, second: 1 });
  assert.equal(session.current(), initial); assert.equal(session.begin('undo').status, 'repair-required');
  session.cancel(); assert.equal(session.commit(swap), false);
  session.commit(begin({ kind: 'swap', first: 0, second: 1 }));
  session.commit(begin({ kind: 'add', sourceRow: 0, targetRow: 1, factor: q(1n) }));
  session.commit(begin({ kind: 'scale', row: 1, factor: q(1n, 2n) }));
  assert.deepEqual(session.current().coefficients.rows[1]!.map(readExactRowValue), [q(1n), q(0n), q(1n, 2n)]);
  assert.deepEqual(readExactRowValue(session.current().rhs[1]!), q(3n));
  const undo = session.begin('undo'); assert.equal(undo.status, 'pending'); if (undo.status !== 'pending') return;
  session.commit(undo.transaction); const prior = session.current();
  const redo = session.begin('redo'); if (redo.status !== 'pending') throw new Error('redo');
  session.cancel(); assert.equal(session.current(), prior); assert.equal(session.commit(redo.transaction), false);
  session.commit(begin({ kind: 'scale', row: 1, factor: q(-1n) }));
  assert.equal(session.begin('redo').status, 'repair-required');
  const stale = begin({ kind: 'swap', first: 0, second: 1 }); session.reset();
  assert.equal(session.commit(stale), false); assert.equal(session.current(), initial);
});
