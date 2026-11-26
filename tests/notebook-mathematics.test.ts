import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { EditorState } from 'prosemirror-state';
import { history, undo, redo } from 'prosemirror-history';
import { readNotebook } from '../src/fraction-notebook/model.ts';
import { schema, toProse, fromProse, mathematicsIn } from '../src/fraction-notebook/schema.ts';
import { compileExpression } from '../src/math/expression.ts';
import { quadraticExpression, quadraticDerivative, tangentExpression } from '../src/math/authoring/quadratic.ts';
import { uuid } from '../src/notebook/model.ts';
import { createQuadraticResource, deriveMathResource, editCoefficient, editTangent, mathDraftError, readNotebookMathematics, readMathViewport } from '../src/notebook/math-model.ts';
import { createNotebookMathRuntime } from '../src/notebook/math-runtime.ts';

const notebook = uuid('90000000-0000-4000-8000-000000000001');
const id = (n: number) => uuid(`90000000-0000-4000-8000-${String(n).padStart(12, '0')}`);
const source = () => createQuadraticResource(id(2));

test('admitted polynomials, derivatives and tangents agree with independent identities including degenerate cases', () => {
  for (const a of [-3, 0, 0.25, 2]) for (const b of [-2, 0, 1]) for (const c of [-4, 0, 3]) {
    const expression = quadraticExpression({ a, b, c }), derivative = quadraticDerivative({ a, b, c });
    const f = compileExpression(expression), d = compileExpression(derivative);
    for (const at of [-4, -1.25, 0, 2, 4]) {
      const tangent = compileExpression(tangentExpression(expression, derivative, at));
      assert.ok(Math.abs(f({ x: at }) - (a * at * at + b * at + c)) < 1e-10);
      assert.ok(Math.abs(d({ x: at }) - (2 * a * at + b)) < 1e-10);
      assert.ok(Math.abs(tangent({ x: at }) - f({ x: at })) < 1e-10);
      assert.ok(Math.abs((tangent({ x: at + 0.5 }) - tangent({ x: at - 0.5 })) - d({ x: at })) < 1e-10);
    }
  }
  assert.throws(() => quadraticExpression({ a: Infinity, b: 0, c: 0 }));
  assert.throws(() => quadraticExpression({ a: 11, b: 0, c: 0 }));
});

test('registered recipes and UUIDs restore through JSON; unavailable versions and invalid dependencies are explicit gaps', () => {
  const f = source(), d = deriveMathResource(f, 'derivative', id(3)), t = deriveMathResource(f, 'tangent', id(4));
  const doc = { schemaVersion: 1, resources: [f, d, t] };
  assert.deepEqual(readNotebookMathematics(JSON.parse(JSON.stringify(doc))), doc);
  for (const resources of [[f, f], [d], [f, { ...d, source: d.id }], [f, { ...t, source: d.id }, d], [f, { ...d, recipe: 'quadratic.derivative@2' }]])
    assert.throws(() => readNotebookMathematics({ ...doc, resources }));
  assert.throws(() => deriveMathResource(d, 'derivative'));
  assert.throws(() => readMathViewport({ x: [4, -4], y: [0, 1] }));
  assert.throws(() => readMathViewport({ x: [0, 0], y: [0, 1] }));
});

test('invalid numeric drafts persist without replacing valid mathematics and can be repaired', () => {
  const f = editCoefficient(source(), 'c', '2');
  for (const input of ['', '-', 'NaN', '1e200', '200', '2x']) {
    const invalid = editCoefficient(f, 'c', input);
    assert.equal(invalid.draft.c, input); assert.equal(invalid.coefficients.c, 2);
    assert.ok(mathDraftError(invalid)); assert.throws(() => deriveMathResource(invalid, 'tangent'));
    assert.deepEqual(readNotebookMathematics({ schemaVersion: 1, resources: [invalid] }).resources[0], invalid);
    assert.equal(editCoefficient(invalid, 'c', '-3').coefficients.c, -3);
  }
  const tangent = deriveMathResource(f, 'tangent', id(4)); assert.equal(tangent.kind, 'tangent');
  if (tangent.kind === 'tangent') {
    const invalid = editTangent(tangent, '20'); assert.ok(mathDraftError(invalid)); assert.equal(invalid.at, 1);
    assert.equal(editTangent(invalid, '-2').at, -2);
  }
});

test('one source computation is reused across views; only declared chains are invalidated', () => {
  const runtime = createNotebookMathRuntime(notebook);
  let f = source(); const d = deriveMathResource(f, 'derivative', id(3)); let t = deriveMathResource(f, 'tangent', id(4));
  const update = () => runtime.update({ schemaVersion: 1, resources: [f, d, t] }); update();
  const first = runtime.expression(f.id); assert.equal(runtime.expression(f.id), first);
  const derivative = runtime.expression(d.id); runtime.expression(t.id);
  assert.deepEqual(runtime.inspect()[0]?.calls, { expression: 1, derivative: 1, tangent: 1 });
  f = editCoefficient(f, 'c', '3'); update();
  assert.equal(runtime.expression(d.id), derivative); runtime.expression(f.id); runtime.expression(t.id);
  assert.deepEqual(runtime.inspect()[0]?.calls, { expression: 2, derivative: 1, tangent: 2 });
  if (t.kind === 'tangent') t = editTangent(t, '-2'); update(); runtime.expression(t.id);
  assert.deepEqual(runtime.inspect()[0]?.calls, { expression: 2, derivative: 1, tangent: 3 });
  runtime.expression(t.id); assert.equal(runtime.inspect()[0]?.calls.tangent, 3);
  f = editCoefficient(f, 'a', '2'); update(); runtime.expression(t.id);
  assert.deepEqual(runtime.inspect()[0]?.calls, { expression: 3, derivative: 2, tangent: 4 });
  assert.ok(runtime.inspect()[0]!.cache.entries <= 3);
  runtime.dispose(); assert.throws(() => runtime.expression(f.id), /closed/);
});

test('notebook owners and two sources are isolated, deletion releases kernels, and restoration keeps recipes live', () => {
  const one = createNotebookMathRuntime(notebook), two = createNotebookMathRuntime(id(10));
  const f = source(), g = editCoefficient(createQuadraticResource(id(5)), 'c', '-2');
  const d = deriveMathResource(f, 'derivative', id(3));
  one.update({ schemaVersion: 1, resources: [f, g, d] }); two.update({ schemaVersion: 1, resources: [f, d] });
  const gExpression = one.expression(g.id); one.expression(f.id); two.expression(f.id);
  one.update({ schemaVersion: 1, resources: [editCoefficient(f, 'b', '4'), g, d] });
  assert.equal(one.expression(g.id), gExpression);
  assert.equal(compileExpression(one.expression(d.id))({ x: 0 }), 4);
  assert.equal(compileExpression(two.expression(d.id))({ x: 0 }), 0);
  one.update({ schemaVersion: 1, resources: [g] }); assert.equal(one.inspect().length, 1);
  assert.throws(() => one.expression(f.id), /Restore/);
  one.dispose(); two.dispose();
});

test('repeated parameter edits have bounded runtime retention and retain correct endpoints across rebasing', () => {
  const runtime = createNotebookMathRuntime(notebook); let f = source(); const d = deriveMathResource(f, 'derivative', id(3));
  for (let index = 0; index < 300; index++) {
    const b = index === 129 ? 0 : index % 10;
    f = editCoefficient(f, 'b', String(b)); runtime.update({ schemaVersion: 1, resources: [f, d] });
    assert.equal(compileExpression(runtime.expression(d.id))({ x: 0 }), b);
    assert.ok(runtime.inspect()[0]!.cache.entries <= 3); assert.ok(runtime.inspect()[0]!.retainedEdits <= 128);
  }
  runtime.dispose();
});

test('persistent resources round trip independently from occurrences and participate in native undo', () => {
  const seed = readNotebook(JSON.parse(readFileSync(new URL('../content/notebooks/math-object-exemplar.json', import.meta.url), 'utf8')));
  const doc = toProse(seed), mathematics = mathematicsIn(doc), f = mathematics.resources[0]!;
  assert.equal(f.kind, 'quadratic'); if (f.kind !== 'quadratic') throw new Error('Expected fixture source');
  assert.deepEqual(fromProse(doc, seed), { ...seed, revision: seed.revision + 1 });
  assert.equal(fromProse(schema.node('doc'), seed).mathematics, undefined, 'serialization uses document data, not a stale basis store');
  let state = EditorState.create({ doc, plugins: [history()] });
  const updated = { ...mathematics, resources: [editCoefficient(f, 'c', '4')] };
  state = state.apply(state.tr.setNodeAttribute(0, 'value', updated));
  assert.equal(state.doc.child(3), doc.child(3), 'source occurrence remains the same node');
  assert.equal(state.doc.child(4), doc.child(4), 'graph occurrence remains the same node');
  assert.deepEqual(mathematicsIn(state.doc), updated);
  assert.equal(undo(state, tr => { state = state.apply(tr); }), true);
  assert.deepEqual(mathematicsIn(state.doc), mathematics);
  assert.equal(redo(state, tr => { state = state.apply(tr); }), true);
  assert.deepEqual(mathematicsIn(state.doc), updated);
  const invalid = { ...seed, mathematics: { ...mathematics, resources: [] } };
  assert.throws(() => readNotebook(invalid), /resource/);
  assert.throws(() => readNotebook({ ...seed, mathematics: { ...mathematics, resources: [{ ...f, id: seed.cells[0]!.id }] } }), /UUID/);
});

test('tangent contact and slope come from the same domain-owned expressions as the views', () => {
  const runtime = createNotebookMathRuntime(notebook);
  const f = editCoefficient(editCoefficient(source(), 'a', '-2'), 'b', '3');
  const t = deriveMathResource(f, 'tangent', id(4)); if (t.kind !== 'tangent') throw new Error('Expected tangent');
  runtime.update({ schemaVersion: 1, resources: [f, editTangent(t, '-1.5')] });
  assert.deepEqual(runtime.tangentSample(t.id), { x: -1.5, y: -9, slope: 9 });
  assert.throws(() => runtime.tangentSample(f.id), /tangent/);
  runtime.dispose();
});
