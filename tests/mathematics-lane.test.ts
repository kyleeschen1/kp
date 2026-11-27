import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatrixVectorDocument, readMatrixVectorDocument, editMatrixVectorDocument, editOccurrenceExtent,
  createMatrixVectorRuntime, invalidResourceFields, MathResourceGap, type MatrixVectorDocument } from '../src/math-resources/public-api.ts';

function withValues(matrix: readonly [number, number, number, number], vector: readonly [number, number]): MatrixVectorDocument {
  let doc = createMatrixVectorDocument();
  for (const [index, field] of (['a00', 'a01', 'a10', 'a11'] as const).entries()) doc = editMatrixVectorDocument(doc, { kind: 'matrix', field, text: String(matrix[index]) });
  doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'x', text: String(vector[0]) });
  return editMatrixVectorDocument(doc, { kind: 'vector', field: 'y', text: String(vector[1]) });
}
test('typed matrix multiplication agrees with independently computed row products, including singular and zero sources', () => {
  for (const matrix of [[1, 0, 0, 1], [0, 0, 0, 0], [1, 2, 2, 4], [-2, 3, .5, -1], [10, -10, -10, 10]] as const) {
    for (const vector of [[0, 0], [1, 2], [-3, .25], [10, -10]] as const) {
      const doc = withValues(matrix, vector), runtime = createMatrixVectorRuntime(doc), sample = runtime.sample();
      assert.deepEqual(sample.result, [matrix[0] * vector[0] + matrix[1] * vector[1], matrix[2] * vector[0] + matrix[3] * vector[1]]);
      assert.deepEqual(sample.product.type, { kind: 'matrix', rows: 2, columns: 1 });
      assert.equal(sample.product.id, doc.result.id); runtime.dispose();
    }
  }
});
test('persistent identities, dependencies, partial drafts and independent occurrences survive JSON reload', () => {
  let doc = createMatrixVectorDocument(); const graph = doc.occurrences[1]!;
  doc = editOccurrenceExtent(doc, graph.id, 25);
  doc = editMatrixVectorDocument(doc, { kind: 'matrix', field: 'a00', text: '-' });
  const reloaded = readMatrixVectorDocument(JSON.parse(JSON.stringify(doc)));
  assert.deepEqual(reloaded, doc); assert.equal(reloaded.occurrences[1]!.extent, 25); assert.equal(reloaded.occurrences[2]!.extent, 10);
  assert.equal(reloaded.result.matrix, reloaded.matrix.id); assert.deepEqual(invalidResourceFields(reloaded), ['matrix.a00']);
  const runtime = createMatrixVectorRuntime(reloaded); assert.deepEqual(runtime.sample().result, [3, 2]);
  doc = editMatrixVectorDocument(doc, { kind: 'matrix', field: 'a00', text: '2' }); runtime.update(doc);
  assert.deepEqual(runtime.sample().result, [4, 2]); assert.deepEqual(invalidResourceFields(doc), []); runtime.dispose();
});
test('only changed dependencies recompute; occurrences and invalid drafts reuse admitted derived values', () => {
  let doc = createMatrixVectorDocument(); const runtime = createMatrixVectorRuntime(doc);
  runtime.sample(); const before = runtime.inspect().calls;
  doc = editOccurrenceExtent(doc, doc.occurrences[1]!.id, 25); runtime.update(doc); runtime.sample();
  assert.deepEqual(runtime.inspect().calls, before);
  doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'x', text: '-' }); runtime.update(doc); runtime.sample();
  assert.deepEqual(runtime.inspect().calls, before);
  doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'x', text: '3' }); runtime.update(doc); runtime.sample();
  assert.deepEqual(runtime.inspect().calls, { matrix: before.matrix, vector: before.vector + 1, product: before.product + 1 });
  const mid = runtime.inspect().calls;
  doc = editMatrixVectorDocument(doc, { kind: 'matrix', field: 'a00', text: '-1' }); runtime.update(doc); runtime.sample();
  assert.deepEqual(runtime.inspect().calls, { matrix: mid.matrix + 1, vector: mid.vector, product: mid.product + 1 }); runtime.dispose();
});
test('admission rejects changed recipes, missing dependencies, duplicate identity and invalid persisted numbers', () => {
  const doc = createMatrixVectorDocument();
  const reject = (raw: unknown) => assert.throws(() => readMatrixVectorDocument(raw));
  reject({ ...doc, schemaVersion: 2 });
  reject({ ...doc, result: { ...doc.result, recipe: 'arbitrary-code@1' } });
  reject({ ...doc, result: { ...doc.result, matrix: doc.result.id } });
  reject({ ...doc, matrix: { ...doc.matrix, id: doc.vector.id } });
  reject({ ...doc, matrix: { ...doc.matrix, entries: [[Infinity, 1], [0, 1]] } });
  reject({ ...doc, vector: { ...doc.vector, entries: [11, 2] } });
  reject({ ...doc, matrix: { ...doc.matrix, draft: { ...doc.matrix.draft, a00: '2' } } });
  reject({ ...doc, occurrences: [doc.occurrences[0], doc.occurrences[0]] });
  reject({ ...doc, occurrences: [{ ...doc.occurrences[0], extent: 0 }] });
  reject({ ...doc, occurrences: [{ ...doc.occurrences[0], resource: doc.vector.id }] });
  const sparse = Array(2); sparse[1] = 2;
  reject({ ...doc, vector: { ...doc.vector, entries: sparse } });
  const accessor = { ...doc, get matrix() { throw new Error('must not execute'); } };
  assert.throws(() => readMatrixVectorDocument(accessor), error => error instanceof MathResourceGap);
});
test('admission takes immutable ownership and rejected updates preserve the last valid runtime', () => {
  const original = createMatrixVectorDocument(), mutable = JSON.parse(JSON.stringify(original)), runtime = createMatrixVectorRuntime(mutable);
  mutable.matrix.entries[0][0] = 9; mutable.matrix.draft.a00 = '9';
  assert.deepEqual(runtime.sample().result, [3, 2]);
  assert.throws(() => runtime.update(createMatrixVectorDocument()), /different resources/);
  assert.deepEqual(runtime.sample().result, [3, 2]);
  assert.throws(() => runtime.update({ ...original, matrix: { ...original.matrix, revision: -1 } }), /revision/);
  assert.deepEqual(runtime.sample().result, [3, 2]); runtime.dispose();
});
test('many edits bound retained runtime versions; disposal prevents accidental reuse and other owners remain live', () => {
  let doc = createMatrixVectorDocument(); const owner = createMatrixVectorRuntime(doc), other = createMatrixVectorRuntime(doc);
  for (let index = 0; index < 300; index++) {
    doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'x', text: String(index % 21 - 10) });
    owner.update(doc); assert.deepEqual(owner.sample().result, [index % 21 - 8, 2]);
    assert.ok(owner.inspect().retainedEdits <= 128);
  }
  assert.deepEqual(other.sample().result, [3, 2]); owner.dispose(); owner.dispose();
  assert.throws(() => owner.sample(), /disposed/); assert.throws(() => owner.update(doc), /disposed/);
  assert.deepEqual(other.sample().result, [3, 2]); other.dispose();
});
test('incomplete and out-of-range drafts retain admitted truth, while a repaired valid draft updates it', () => {
  let doc = createMatrixVectorDocument(); const owner = createMatrixVectorRuntime(doc);
  for (const text of ['', '-', '.', '1e', '11', 'Infinity']) {
    doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'y', text }); owner.update(doc);
    assert.equal(doc.vector.draft.y, text); assert.deepEqual(owner.sample().result, [3, 2]);
    assert.deepEqual(invalidResourceFields(doc), ['vector.y']);
  }
  doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'y', text: '-.5' }); owner.update(doc);
  assert.deepEqual(owner.sample().result, [.5, -.5]); assert.deepEqual(invalidResourceFields(doc), []);
  assert.throws(() => editMatrixVectorDocument(doc, { kind: 'vector', field: 'x', text: '0'.repeat(33) }), /32/); owner.dispose();
});
