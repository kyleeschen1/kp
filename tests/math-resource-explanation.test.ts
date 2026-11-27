import test from 'node:test';
import assert from 'node:assert/strict';
import { compileExpression } from '../src/math/expression.ts';
import { evaluateKpTypedMatrix } from '../src/math/typed-semantic-math.ts';
import { createMatrixVectorDocument, readMatrixVectorDocument, editMatrixVectorDocument, editOccurrenceExtent,
  createMatrixVectorRuntime, MathResourceGap, type MatrixResourceExplanation } from '../src/math-resources/public-api.ts';

const numeric = (explanation: MatrixResourceExplanation) => evaluateKpTypedMatrix(explanation.product.result, {});
function verifySourceRelationship(explanation: MatrixResourceExplanation) {
  const { product, sourceResult, resultCorrespondence } = explanation;
  assert.equal(product.right.columnCount, 1);
  assert.equal(product.columns.length, 1);
  assert.equal(product.cells.length, 2);
  assert.equal(resultCorrespondence.sourceResultId, sourceResult.id);
  assert.equal(resultCorrespondence.explanationResultId, product.result.id);
  assert.equal(resultCorrespondence.recipe, 'matrix2.vector2@1');
  assert.notEqual(product.result.id, sourceResult.id);
  assert.deepEqual(numeric(explanation), evaluateKpTypedMatrix(sourceResult, {}));
  for (const cell of product.cells) {
    assert.equal(cell.columnIndex, 0);
    assert.equal(cell.row.matrix, product.left);
    assert.equal(cell.column.matrix, product.right);
    for (const pair of cell.dot.pairs) {
      assert.equal(pair.left, product.left.rows[cell.rowIndex]![pair.index]);
      assert.equal(pair.right, product.right.rows[pair.index]![0]);
    }
    const sum = cell.dot.pairs.reduce((value, pair) => value + compileExpression(pair.product.expression)({}), 0);
    assert.equal(sum, compileExpression(sourceResult.rows[cell.rowIndex]![0]!.expression)({}));
    assert.deepEqual(resultCorrespondence.entries[cell.rowIndex], { row: cell.rowIndex, column: 0,
      sourceEntryId: sourceResult.rows[cell.rowIndex]![0]!.id, explanationEntryId: cell.result.id });
  }
}

test('column occurrences are an additive version-1 view and preserve existing saved data', () => {
  const original = createMatrixVectorDocument();
  assert.deepEqual(readMatrixVectorDocument(JSON.parse(JSON.stringify(original))), original);
  const columns = readMatrixVectorDocument({ ...original, occurrences: original.occurrences.map((o, index) => index === 1 ? { ...o, view: 'columns' } : o) });
  assert.equal(columns.schemaVersion, 1);
  assert.equal(columns.occurrences[1]!.view, 'columns');
  assert.equal(columns.occurrences[1]!.resource, original.result.id);
  assert.deepEqual(readMatrixVectorDocument(JSON.parse(JSON.stringify(columns))), columns);
  assert.throws(() => readMatrixVectorDocument({ ...columns, occurrences: [{ ...columns.occurrences[0], view: 'invented' }] }), /Choose equation, graph or columns/);
});

test('explanations retain actual cached operands, one authored vector column, and an explicit result correspondence', () => {
  const doc = createMatrixVectorDocument(), runtime = createMatrixVectorRuntime(doc), sample = runtime.sample(), explanation = runtime.explanation();
  assert.equal(explanation.product.left, sample.matrix);
  assert.equal(explanation.product.right, sample.vector);
  assert.equal(explanation.sourceResult, sample.product);
  assert.deepEqual(numeric(explanation), [[3], [2]]);
  verifySourceRelationship(explanation);
  assert.ok(Object.isFrozen(explanation));
  assert.ok(Object.isFrozen(explanation.resultCorrespondence.entries));
  runtime.dispose();
});

test('occurrences and repeated reads reuse the explanation while revision-only edits reuse its product', () => {
  let doc = createMatrixVectorDocument(); const runtime = createMatrixVectorRuntime(doc), first = runtime.explanation();
  for (let i = 0; i < 10; i++) assert.equal(runtime.explanation(), first);
  doc = editOccurrenceExtent(doc, doc.occurrences[1]!.id, 25); runtime.update(doc);
  assert.equal(runtime.explanation(), first);
  runtime.update(readMatrixVectorDocument(JSON.parse(JSON.stringify(doc))));
  assert.equal(runtime.explanation(), first);
  doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'x', text: '1.0' }); runtime.update(doc);
  const revised = runtime.explanation();
  assert.equal(revised.product, first.product);
  assert.equal(revised.sourceResult, first.sourceResult);
  assert.notEqual(revised.sourceRevision, first.sourceRevision);
  assert.equal(runtime.explanation(), revised);
  assert.deepEqual(runtime.inspect().explanation, { builds: 1, retainedProducts: 1, disposed: false });
  runtime.dispose();
});

test('matrix/vector source edits refresh the explanation without changing persistent entry identities', () => {
  let doc = createMatrixVectorDocument(); const runtime = createMatrixVectorRuntime(doc), first = runtime.explanation();
  doc = editMatrixVectorDocument(doc, { kind: 'matrix', field: 'a01', text: '4' }); runtime.update(doc);
  const matrixEdit = runtime.explanation();
  assert.notEqual(matrixEdit.product, first.product);
  assert.notEqual(matrixEdit.product.left, first.product.left);
  assert.equal(matrixEdit.product.right, first.product.right);
  assert.deepEqual(numeric(matrixEdit), [[9], [2]]);
  assert.equal(matrixEdit.product.left.id, first.product.left.id);
  assert.deepEqual(matrixEdit.product.cells.map(cell => cell.id), first.product.cells.map(cell => cell.id));
  doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'y', text: '-3' }); runtime.update(doc);
  const vectorEdit = runtime.explanation();
  assert.equal(vectorEdit.product.left, matrixEdit.product.left);
  assert.notEqual(vectorEdit.product.right, matrixEdit.product.right);
  assert.deepEqual(numeric(vectorEdit), [[-11], [-3]]);
  assert.deepEqual(vectorEdit.resultCorrespondence, first.resultCorrespondence);
  verifySourceRelationship(vectorEdit);
  assert.deepEqual(numeric(first), [[3], [2]]); // Old immutable material remains usable until its host replaces it.
  runtime.dispose();
});

test('zero and negative contributions remain explicit even when the domain owner simplifies the result', () => {
  let doc = createMatrixVectorDocument(); const runtime = createMatrixVectorRuntime(doc);
  for (const text of ['0', '-2']) {
    doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'x', text }); runtime.update(doc);
    const explanation = runtime.explanation(); verifySourceRelationship(explanation);
    assert.equal(explanation.product.leftParts.columns.length, 2);
    assert.equal(explanation.product.rightParts.columns.length, 1);
    assert.equal(explanation.product.cell(0, 0).dot.pairs.length, 2);
    assert.deepEqual(numeric(explanation), text === '0' ? [[2], [2]] : [[0], [2]]);
  }
  for (const field of ['a00', 'a01', 'a10', 'a11'] as const) doc = editMatrixVectorDocument(doc, { kind: 'matrix', field, text: '0' });
  runtime.update(doc); const zero = runtime.explanation(); verifySourceRelationship(zero);
  assert.deepEqual(numeric(zero), [[0], [0]]);
  assert.equal(zero.product.cell(0, 0).dot.pairs.length, 2); runtime.dispose();
});

test('incomplete drafts return typed repair gaps without replacing the previous valid explanation', () => {
  let doc = createMatrixVectorDocument(); const runtime = createMatrixVectorRuntime(doc), first = runtime.explanation();
  for (const text of ['', '-', '.', '11', 'Infinity']) {
    doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'x', text }); runtime.update(doc);
    assert.throws(() => runtime.explanation(), error => error instanceof MathResourceGap && error.code === 'invalid-explanation-draft' && error.path === 'vector.x');
    assert.equal(runtime.sample().product, first.sourceResult);
    assert.deepEqual(numeric(first), [[3], [2]]);
    assert.equal(runtime.inspect().explanation.builds, 1);
  }
  doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'x', text: '1' }); runtime.update(doc);
  assert.equal(runtime.explanation().product, first.product);
  doc = editMatrixVectorDocument(doc, { kind: 'matrix', field: 'a00', text: '-' }); runtime.update(doc);
  assert.throws(() => runtime.explanation(), error => error instanceof MathResourceGap && error.code === 'invalid-explanation-draft' && error.path === 'matrix.a00');
  runtime.dispose();
});

test('undo restores the same revision key and values; alternate edits with reused counters remain distinguishable', () => {
  const initial = createMatrixVectorDocument(), runtime = createMatrixVectorRuntime(initial), first = runtime.explanation();
  const second = editMatrixVectorDocument(initial, { kind: 'matrix', field: 'a00', text: '2' }); runtime.update(second);
  const changed = runtime.explanation();
  assert.notEqual(changed.sourceRevision, first.sourceRevision);
  runtime.update(initial); const undone = runtime.explanation();
  assert.equal(undone.sourceRevision, first.sourceRevision);
  assert.deepEqual(numeric(undone), [[3], [2]]);
  assert.deepEqual(undone.resultCorrespondence, first.resultCorrespondence);
  const alternate = editMatrixVectorDocument(initial, { kind: 'matrix', field: 'a00', text: '3' });
  assert.equal(alternate.matrix.revision, second.matrix.revision);
  runtime.update(alternate); const branched = runtime.explanation();
  assert.notEqual(branched.sourceRevision, changed.sourceRevision);
  assert.deepEqual(numeric(branched), [[5], [2]]);
  runtime.update(second); assert.equal(runtime.explanation().sourceRevision, changed.sourceRevision);
  runtime.dispose();
});

test('copies have independent identity even with equal values, and disposed owners release explanation state', () => {
  const firstDocument = createMatrixVectorDocument(), copyDocument = createMatrixVectorDocument();
  const firstOwner = createMatrixVectorRuntime(firstDocument), copyOwner = createMatrixVectorRuntime(copyDocument);
  const first = firstOwner.explanation(), copy = copyOwner.explanation();
  assert.deepEqual(numeric(first), numeric(copy));
  assert.notEqual(first.product.id, copy.product.id);
  assert.notEqual(first.product.left.id, copy.product.left.id);
  assert.notEqual(first.product.right.id, copy.product.right.id);
  assert.notEqual(first.sourceRevision, copy.sourceRevision);
  assert.throws(() => firstOwner.update(copyDocument), /different resources/);
  assert.equal(firstOwner.explanation(), first);
  firstOwner.dispose(); firstOwner.dispose();
  assert.throws(() => firstOwner.explanation(), error => error instanceof MathResourceGap && error.code === 'owner-closed');
  assert.deepEqual(firstOwner.inspect().explanation, { builds: 1, retainedProducts: 0, disposed: true });
  assert.equal(copyOwner.explanation(), copy); copyOwner.dispose();
});

test('explanation cache stays bounded through long editing and kernel rebases', () => {
  let doc = createMatrixVectorDocument(); const runtime = createMatrixVectorRuntime(doc);
  for (let i = 0; i < 300; i++) {
    doc = editMatrixVectorDocument(doc, { kind: 'vector', field: 'x', text: String(i % 21 - 10) }); runtime.update(doc);
    const explanation = runtime.explanation();
    assert.deepEqual(numeric(explanation), [[i % 21 - 8], [2]]);
    assert.equal(explanation.sourceResult, runtime.sample().product);
    assert.equal(runtime.explanation(), explanation);
    assert.equal(runtime.inspect().explanation.retainedProducts, 1);
    assert.ok(runtime.inspect().retainedEdits <= 128);
  }
  runtime.dispose();
});
