import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EditorState } from 'prosemirror-state';
import { history, undo, redo, closeHistory } from 'prosemirror-history';
import { Fragment, Slice, type Node as ProseNode } from 'prosemirror-model';
import { readNotebook } from '../src/fraction-notebook/model.ts';
import { schema, toProse, fromProse, matrixResourcesIn } from '../src/fraction-notebook/schema.ts';
import { copyMatrixResource } from '../src/fraction-notebook/matrix-data.ts';
import { createMatrixNotebookRuntime } from '../src/fraction-notebook/matrix-runtime.ts';
import { editMatrixVectorDocument, editOccurrenceExtent, createMatrixVectorRuntime } from '../src/math-resources/public-api.ts';
import { newId } from '../src/notebook/model.ts';
import { activeMatrixOccurrences, matrixClipboardSlice, prepareMatrixPaste, withMatrixOccurrences } from '../src/fraction-notebook/matrix-occurrences.ts';

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
test('notebook evaluator shares views, isolates copies and rejects partial identity rewrites atomically', () => {
  const source = fixture().matrixResources![0]!, copy = copyMatrixResource(source), runtime = createMatrixNotebookRuntime([source, copy]);
  runtime.sample(source.id); runtime.sample(source.id); assert.equal(runtime.inspect()[0]!.calls.product, 1);
  const edited = editMatrixVectorDocument(copy, { kind: 'vector', field: 'x', text: '4' });
  runtime.update([source, edited]); assert.deepEqual(runtime.sample(copy.id).result, [6, 2]); assert.deepEqual(runtime.sample(source.id).result, [3, 2]);
  const replacement = copyMatrixResource(source);
  assert.throws(() => runtime.update([editMatrixVectorDocument(source, { kind: 'vector', field: 'x', text: '5' }), { ...replacement, id: copy.id }]), /new identity/);
  assert.deepEqual(runtime.sample(source.id).result, [3, 2]);
  runtime.update([source]); assert.equal(runtime.inspect().length, 1); assert.throws(() => runtime.sample(copy.id), /removed/);
  runtime.dispose(); runtime.dispose(); assert.throws(() => runtime.sample(source.id), /closed/);
});

function fullNotebook() {
  const notebook = fixture(), source = notebook.matrixResources![0]!;
  const added = Array.from({ length: 8 - source.occurrences.length }, () => ({ ...source.occurrences[0]!, id: newId(), view: 'graph' as const }));
  return readNotebook({ ...notebook, matrixResources: [{ ...source, occurrences: [...source.occurrences, ...added] }],
    cells: [...notebook.cells, ...added.map(view => ({ type: 'matrixObject', id: newId(), metadata: {}, resource: source.id, occurrence: view.id, folded: false }))] });
}
function matrixNodes(doc: ProseNode) {
  const nodes: { node: ProseNode; pos: number }[] = [];
  doc.descendants((node, pos) => { if (node.type.name === 'matrixObject') nodes.push({ node, pos }); });
  return nodes;
}

test('insertion reclaims deleted views within the eight-view bound and undo restores exact records', () => {
  const notebook = fullNotebook(), source = notebook.matrixResources![0]!;
  let state = EditorState.create({ doc: toProse(notebook), plugins: [history()] });
  const apply = (tr: import('prosemirror-state').Transaction) => { state = state.apply(tr); };
  const newView = { ...source.occurrences[0]!, id: newId(), view: 'columns' as const };
  assert.equal(activeMatrixOccurrences(state.doc, source.id).size, 8);
  assert.throws(() => withMatrixOccurrences(source, state.doc, [newView]), /eight|occurrences/);
  const deletion = closeHistory(state.tr);
  for (const { node, pos } of matrixNodes(state.doc).slice(1).reverse()) deletion.delete(pos, pos + node.nodeSize);
  apply(deletion); const removed = state.doc;
  assert.equal(matrixResourcesIn(state.doc)[0]!.occurrences.length, 8);
  assert.equal(activeMatrixOccurrences(state.doc, source.id).size, 1);
  const compact = withMatrixOccurrences(source, state.doc, [newView]);
  apply(closeHistory(state.tr).setNodeAttribute(0, 'value', [compact]).insert(state.doc.content.size,
    schema.node('matrixObject', { id: newId(), resource: source.id, occurrence: newView.id })));
  const inserted = state.doc;
  assert.equal(fromProse(state.doc, notebook).matrixResources![0]!.occurrences.length, 2);
  assert.equal(undo(state, apply), true); assert.ok(state.doc.eq(removed));
  assert.equal(redo(state, apply), true); assert.ok(state.doc.eq(inserted));
});

test('a cut view survives reclamation and reload through clipboard data with identity and settings intact', () => {
  const notebook = fullNotebook(), source = notebook.matrixResources![0]!;
  let state = EditorState.create({ doc: toProse(notebook), plugins: [history()] });
  const cut = matrixNodes(state.doc)[1]!, view = source.occurrences.find(view => view.id === cut.node.attrs['occurrence'])!;
  const copied = matrixClipboardSlice(new Slice(Fragment.from(cut.node), 0, 0), [source]);
  const serializedClipboard = JSON.stringify(copied.toJSON());
  state = state.apply(state.tr.delete(cut.pos, cut.pos + cut.node.nodeSize));
  const replacement = { ...view, id: newId() }, compact = withMatrixOccurrences(source, state.doc, [replacement]);
  state = state.apply(state.tr.setNodeAttribute(0, 'value', [compact]).insert(state.doc.content.size,
    schema.node('matrixObject', { id: newId(), resource: source.id, occurrence: replacement.id })));
  assert.equal(compact.occurrences.some(item => item.id === view.id), false);
  // Free a slot; the ninth active occurrence must still be refused.
  const clipboard = Slice.fromJSON(schema, JSON.parse(serializedClipboard));
  assert.throws(() => prepareMatrixPaste(state.doc, clipboard, [compact]), /eight|occurrences/);
  const last = matrixNodes(state.doc).at(-1)!;
  state = state.apply(state.tr.delete(last.pos, last.pos + last.node.nodeSize));
  const restored = readNotebook(JSON.parse(JSON.stringify(fromProse(state.doc, notebook))));
  state = EditorState.create({ doc: toProse(restored), plugins: [history()] });
  const before = state.doc, prepared = prepareMatrixPaste(state.doc, clipboard, restored.matrixResources!);
  const apply = (tr: import('prosemirror-state').Transaction) => { state = state.apply(tr); };
  apply(closeHistory(state.tr).setNodeAttribute(0, 'value', prepared.resources).replaceRange(state.doc.content.size, state.doc.content.size, prepared.slice));
  const pasted = matrixNodes(state.doc).at(-1)!.node;
  assert.equal(pasted.attrs['id'], cut.node.attrs['id']); assert.equal(pasted.attrs['occurrence'], view.id);
  assert.deepEqual(matrixResourcesIn(state.doc)[0]!.occurrences.find(item => item.id === view.id), view);
  assert.equal(pasted.attrs['clipboardOccurrence'], null);
  assert.doesNotMatch(JSON.stringify(fromProse(state.doc, restored)), /clipboardOccurrence/);
  assert.equal(undo(state, apply), true); assert.ok(state.doc.eq(before));
  assert.equal(redo(state, apply), true); assert.equal(matrixNodes(state.doc).at(-1)!.node.attrs['id'], cut.node.attrs['id']);
});

test('copy clones only selected views while preserving their shared independent closure', () => {
  const notebook = fullNotebook(), source = notebook.matrixResources![0]!, doc = toProse(notebook);
  const nodes = matrixNodes(doc).slice(0, 2).map(item => item.node);
  const clipboard = matrixClipboardSlice(new Slice(Fragment.from(nodes), 0, 0), [source]);
  const prepared = prepareMatrixPaste(doc, clipboard, [source]), copied = prepared.resources[1]!;
  assert.equal(copied.occurrences.length, 2); assert.notEqual(copied.id, source.id);
  assert.equal(prepared.slice.content.child(0).attrs['resource'], prepared.slice.content.child(1).attrs['resource']);
  assert.notEqual(prepared.slice.content.child(0).attrs['id'], nodes[0]!.attrs['id']);
  assert.equal(prepared.slice.content.child(0).attrs['clipboardOccurrence'], null);
  assert.deepEqual(prepared.resources[0], source);
});

test('paste validates clipboard configuration and refuses missing resources without reparenting', () => {
  const notebook = fixture(), source = notebook.matrixResources![0]!, doc = toProse(notebook), node = matrixNodes(doc)[0]!.node;
  const view = source.occurrences.find(view => view.id === node.attrs['occurrence'])!;
  const slice = (clipboardOccurrence: unknown) => new Slice(Fragment.from(node.type.create({ ...node.attrs, clipboardOccurrence })), 0, 0);
  for (const raw of [{ ...view, id: newId() }, { ...view, resource: newId() }, { ...view, extent: 0 },
    { ...view, view: 'unknown' }, { ...view, extra: true }, null, 'bad']) {
    if (raw === null) assert.equal(prepareMatrixPaste(doc, slice(raw), [source]).resources.length, 2); // Legacy clipboard.
    else assert.throws(() => prepareMatrixPaste(doc, slice(raw), [source]));
  }
  assert.throws(() => prepareMatrixPaste(doc, slice(view), []), /Restore the matrix resource/);
  const wrongCell = node.type.create({ ...node.attrs, occurrence: newId(), clipboardOccurrence: null });
  assert.throws(() => prepareMatrixPaste(doc, new Slice(Fragment.from(wrongCell), 0, 0), [source]), /view is unavailable/);
});

test('legacy cut clipboard retains identity when its stored view survives reload', () => {
  const notebook = fixture(), source = notebook.matrixResources![0]!;
  let state = EditorState.create({ doc: toProse(notebook) });
  const cut = matrixNodes(state.doc)[1]!, legacy = new Slice(Fragment.from(cut.node), 0, 0);
  state = state.apply(state.tr.delete(cut.pos, cut.pos + cut.node.nodeSize));
  const restored = readNotebook(JSON.parse(JSON.stringify(fromProse(state.doc, notebook))));
  const prepared = prepareMatrixPaste(toProse(restored), legacy, restored.matrixResources!);
  assert.equal(prepared.resources.length, 1);
  assert.equal(prepared.slice.content.firstChild!.attrs['id'], cut.node.attrs['id']);
  assert.equal(prepared.slice.content.firstChild!.attrs['occurrence'], cut.node.attrs['occurrence']);
  assert.equal(prepared.resources[0]!.id, source.id);
});
