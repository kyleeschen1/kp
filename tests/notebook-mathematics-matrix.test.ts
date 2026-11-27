import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EditorState } from 'prosemirror-state';
import { history, undo, redo, closeHistory } from 'prosemirror-history';
import { readNotebook } from '../src/fraction-notebook/model.ts';
import { toProse, fromProse, matrixResourcesIn } from '../src/fraction-notebook/schema.ts';
import { copyMatrixResource } from '../src/fraction-notebook/matrix-data.ts';
import { editMatrixVectorDocument, editOccurrenceExtent, createMatrixVectorRuntime } from '../src/math-resources/public-api.ts';

const fixture = () => readNotebook(JSON.parse(readFileSync(new URL('../content/notebooks/matrix-object-exemplar.json', import.meta.url), 'utf8')));
test('matrix notebook preserves resource, recipe and local occurrence identities through history and serialization', () => {
  const notebook = fixture(), resource = notebook.matrixResources![0]!;
  let state = EditorState.create({ doc: toProse(notebook), plugins: [history()] });
  const apply = (tr: import('prosemirror-state').Transaction) => { state = state.apply(tr); };
  const edited = editMatrixVectorDocument(resource, { kind: 'matrix', field: 'a00', text: '3' });
  apply(closeHistory(state.tr).setNodeAttribute(0, 'value', [edited]));
  const runtime = createMatrixVectorRuntime(matrixResourcesIn(state.doc)[0]!);
  assert.deepEqual(runtime.sample().result, [5, 2]);
  undo(state, apply); assert.deepEqual(matrixResourcesIn(state.doc), [resource]);
  redo(state, apply); assert.deepEqual(matrixResourcesIn(state.doc), [edited]);
  const invalid = editMatrixVectorDocument(edited, { kind: 'matrix', field: 'a00', text: '-' });
  const graph = invalid.occurrences.find(o => o.view === 'graph')!;
  const zoomed = editOccurrenceExtent(invalid, graph.id, 10);
  apply(closeHistory(state.tr).setNodeAttribute(0, 'value', [zoomed]));
  const saved = readNotebook(JSON.parse(JSON.stringify(fromProse(state.doc, notebook))));
  assert.deepEqual(saved.matrixResources, [zoomed]); assert.deepEqual(saved.cells, notebook.cells);
  runtime.update(saved.matrixResources![0]!); assert.deepEqual(runtime.sample().result, [5, 2]); runtime.dispose();
});
test('matrix notebook rejects dangling views, identity collisions and unavailable recipes before admission', () => {
  const doc = fixture(), resource = doc.matrixResources![0]!;
  assert.throws(() => readNotebook({ ...doc, matrixResources: [] }), /Restore the matrix/);
  assert.throws(() => readNotebook({ ...doc, matrixResources: [resource, resource] }), /unique/);
  assert.throws(() => readNotebook({ ...doc, matrixResources: [{ ...resource, result: { ...resource.result, recipe: 'unknown@1' } }] }), /recipe/);
  const cell = doc.cells.find(c => c.type === 'matrixObject')!;
  assert.throws(() => readNotebook({ ...doc, cells: [...doc.cells, { ...cell, id: '42000000-0000-4000-8000-000000000999' }] }), /own view occurrence/);
});
test('independent matrix copies retain values but clone the complete dependency closure', () => {
  const original = fixture().matrixResources![0]!, copied = copyMatrixResource(original);
  const originals = new Set([original.id, original.matrix.id, original.vector.id, original.result.id, ...original.occurrences.map(o => o.id)]);
  for (const id of [copied.id, copied.matrix.id, copied.vector.id, copied.result.id, ...copied.occurrences.map(o => o.id)]) assert.equal(originals.has(id), false);
  assert.equal(copied.result.matrix, copied.matrix.id); assert.equal(copied.result.vector, copied.vector.id);
  const runtime = createMatrixVectorRuntime(copied); assert.deepEqual(runtime.sample().result, [3, 2]); runtime.dispose();
  const edited = editMatrixVectorDocument(copied, { kind: 'vector', field: 'x', text: '4' });
  assert.deepEqual(edited.vector.entries, [4, 2]); assert.deepEqual(original.vector.entries, [1, 2]);
});
