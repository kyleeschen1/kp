import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readExactRowValue } from '../src/math/linear-system-row-operation.ts';
import { createRowSession } from '../src/experiments/rectangular-product/row-session.ts';
import { createRowAuthoredStory } from '../src/experiments/rectangular-product/row-authored-story.ts';
import { compileRowWorkbenchSource, requireRowWorkbenchSource, type RowWorkbenchSource } from '../src/experiments/rectangular-product/row-workbench-source.ts';
import { originalRowSource, redundantRowSource, inconsistentRowSource } from '../src/experiments/rectangular-product/row-workbench-examples.ts';
import { rowWorkbenchReading } from '../src/experiments/rectangular-product/row-workbench-reading.ts';
import { rowSystemLatex } from '../src/experiments/rectangular-product/row-workbench-model.ts';

test('the same checked subtraction distinguishes redundant and inconsistent constraints', () => {
  for (const [source, rhs] of [[redundantRowSource, 0n], [inconsistentRowSource, 1n]] as const) {
    const model = requireRowWorkbenchSource(source), step = model.steps[0]!;
    assert.deepEqual(step.checked.after.coefficients.rows[1]!.map(v => readExactRowValue(v)!.numerator), [0n, 0n, 0n]);
    assert.equal(readExactRowValue(step.checked.after.rhs[1]!)!.numerator, rhs);
    assert.equal(step.checked.after.rhs[0], model.initial.rhs[0]);
    assert.equal(step.checked.witness.relation, 'same-solution-set');
    assert.equal(step.id, `${source.id}.step.${source.steps[0]!.id}`);
  }
});
test('ordered steps use preceding endpoints and copy authored data, including unknowns and prose', () => {
  const source = structuredClone(originalRowSource), model = requireRowWorkbenchSource(source);
  for (let i = 1; i < model.steps.length; i++) assert.equal(model.steps[i]!.checked.before.coefficients, model.steps[i - 1]!.checked.after.coefficients);
  const renamed = requireRowWorkbenchSource({ ...source, id: 'renamed', unknowns: ['u', 'v', 'w'], title: '<script>bad()</script>', introduction: '<img src=x onerror=bad()>' });
  assert.match(rowSystemLatex(renamed.initial, renamed.unknowns), /u.*v.*w/);
  const reading = rowWorkbenchReading(renamed);
  assert.ok(reading.includes('<math')); assert.ok(!reading.includes('<img')); assert.match(reading, /&lt;img/);
  assert.ok(reading.includes(renamed.steps.at(-1)!.after));
  const standalone = rowWorkbenchReading(renamed, 'mathml');
  assert.ok(standalone.includes('<math')); assert.ok(!standalone.includes('katex-html'));
  assert.equal(model.initial.coefficients.rows[0]![0]!.id, 'system.coefficient.0.0');
});
test('located repairs reject malformed sources, invalid steps and unsupported intermediate layouts', () => {
  const bad: readonly [Partial<RowWorkbenchSource>, string][] = [
    [{ unknowns: ['x', 'x', 'z'] }, 'unknowns'], [{ unknowns: ['x_1', 'y', 'z'] }, 'unknowns'],
    [{ coefficients: [[1, 2], [3, 4]] }, 'coefficients'], [{ rhs: [7] }, 'rhs'],
    [{ rhs: ['1/0', 7] }, 'rhs.0'], [{ rhs: [.5, 7] }, 'rhs.0'], [{ rhs: ['1/10', 7] }, 'rhs.0'],
    [{ steps: [] }, 'steps'], [{ title: '' }, 'title'],
    [{ steps: [originalRowSource.steps[0]!, originalRowSource.steps[0]!] }, 'steps.1.id'],
    [{ steps: [{ id: 'bad', operation: { kind: 'scale', row: 0, factor: 0 }, during: 'Scale', after: 'Result' }] }, 'steps.0.operation.factor'],
    [{ steps: [{ id: 'big', operation: { kind: 'scale', row: 0, factor: 20 }, during: 'Scale', after: 'Result' }] }, 'steps.0.presentation'],
  ];
  for (const [patch, path] of bad) {
    const result = compileRowWorkbenchSource({ ...originalRowSource, ...patch });
    assert.equal(result.status, 'repair-required'); if (result.status === 'repair-required') assert.equal(result.path, path);
  }
  const zero = requireRowWorkbenchSource({ ...redundantRowSource, coefficients: [[0, 0, 0], [0, 0, 0]], rhs: [0, 0] });
  assert.equal(zero.steps[0]!.checked.status, 'checked');
});
test('annotations and next steps follow committed history through cancel, undo, redo and a manual branch', () => {
  const model = requireRowWorkbenchSource(inconsistentRowSource), session = createRowSession(model.initial), story = createRowAuthoredStory(model, session);
  const step = story.next()!;
  const first = session.begin('apply', step.operation); assert.equal(first.status, 'pending');
  story.attach(first.transaction, step); assert.equal(story.current(), undefined);
  session.cancel(); assert.equal(story.next(), step); assert.equal(session.commit(first.transaction), false);
  const second = session.begin('apply', step.operation); assert.equal(second.status, 'pending');
  story.attach(second.transaction, step); session.commit(second.transaction); assert.equal(story.current(), step); assert.equal(story.next(), undefined);
  const undo = session.begin('undo'); assert.equal(undo.status, 'pending'); session.commit(undo.transaction);
  assert.equal(story.current(), undefined); assert.equal(story.next(), step);
  const redo = session.begin('redo'); assert.equal(redo.status, 'pending'); session.commit(redo.transaction); assert.equal(story.current(), step);
  session.reset();
  const manual = session.begin('apply', { kind: 'swap', first: 0, second: 1 }); assert.equal(manual.status, 'pending'); session.commit(manual.transaction);
  assert.equal(story.current(), undefined); assert.equal(story.next(), undefined);
  const back = session.begin('undo'); assert.equal(back.status, 'pending'); session.commit(back.transaction); assert.equal(story.next(), step);
});
