import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EditorState } from 'prosemirror-state';
import { history, undo, redo, closeHistory } from 'prosemirror-history';
import { Fragment, Slice, type Node as ProseNode } from 'prosemirror-model';
import { newId } from '../src/notebook/model.ts';
import { readNotebook } from '../src/fraction-notebook/model.ts';
import { toProse, fromProse, projectionResourcesIn, schema } from '../src/fraction-notebook/schema.ts';
import { createProjectionResource, readProjectionResource, editProjectionResource, readProjectionResources, ProjectionResourceGap } from '../src/projection-explanation/resource.ts';
import { createProjectionRuntime } from '../src/fraction-notebook/projection-runtime.ts';
import { prepareProjectionPaste } from '../src/fraction-notebook/projection-clipboard.ts';

const fixture = () => readNotebook(JSON.parse(readFileSync(new URL('../content/notebooks/projection-object-exemplar.json', import.meta.url), 'utf8')));
function nodes(doc: ProseNode) {
  const result: { node: ProseNode; pos: number }[] = [];
  doc.descendants((node, pos) => { if (node.type.name === 'projectionObject') result.push({ node, pos }); }); return result;
}
test('vector-pair drafts and stable occurrences round trip through native undo, redo and serialization', () => {
  const notebook = fixture(), original = notebook.projectionResources![0]!;
  let state = EditorState.create({ doc: toProse(notebook), plugins: [history()] });
  const apply = (tr: import('prosemirror-state').Transaction) => { state = state.apply(tr); };
  const edited = editProjectionResource(original, 0, '-4');
  apply(closeHistory(state.tr).setNodeAttribute(0, 'value', [edited]));
  assert.equal(undo(state, apply), true); assert.deepEqual(projectionResourcesIn(state.doc), [original]);
  assert.equal(redo(state, apply), true); assert.deepEqual(projectionResourcesIn(state.doc), [edited]);
  const incomplete = editProjectionResource(edited, 2, '-');
  apply(closeHistory(state.tr).setNodeAttribute(0, 'value', [incomplete]));
  const restored = readNotebook(JSON.parse(JSON.stringify(fromProse(state.doc, notebook))));
  assert.deepEqual(restored.projectionResources, [incomplete]); assert.deepEqual(restored.cells, notebook.cells);
  assert.equal(incomplete.admitted[0], '-4'); assert.equal(incomplete.admitted[2], '1');
});
test('external sources reject unsafe drafts, stale admitted truth, duplicate IDs and missing dependencies', () => {
  const notebook = fixture(), source = notebook.projectionResources![0]!;
  for (const admitted of [['1', '2', '0.5', '1'], ['1', '2', '1001', '1'], ['1', '2', 'NaN', '1']])
    assert.throws(() => readProjectionResource({ ...source, admitted }), ProjectionResourceGap);
  assert.throws(() => readProjectionResource({ ...source, revision: -1 }), ProjectionResourceGap);
  assert.throws(() => readProjectionResource({ ...source, draft: ['2', '2', '1', '1'] }), /agree/);
  assert.throws(() => readProjectionResource({ ...source, draft: ['x'.repeat(33), '2', '1', '1'] }), /32/);
  assert.throws(() => readProjectionResources([source, source]), /unique/);
  assert.throws(() => readNotebook({ ...notebook, projectionResources: [] }), /Restore/);
  const cell = notebook.cells.find(c => c.type === 'projectionObject')!;
  assert.throws(() => readNotebook({ ...notebook, cells: [...notebook.cells, cell] }), /UUID/);
  assert.throws(() => readNotebook({ ...notebook, cells: [{ ...cell, id: source.id }] }), /UUID/);
  assert.throws(() => readNotebook({ ...notebook, cells: Array.from({ length: 9 }, () => ({ ...cell, id: newId() })) }), /eight/);
});
test('all views share one admitted calculation; draft edits and undo with reused revisions cannot poison caches', () => {
  const source = createProjectionResource(), runtime = createProjectionRuntime([source]);
  const initial = runtime.read(source.id).source; runtime.read(source.id); assert.equal(runtime.inspect().compilations, 1);
  const invalid = editProjectionResource(source, 0, '-'); runtime.update([invalid]);
  assert.equal(runtime.read(source.id).source, initial); assert.equal(runtime.read(source.id).valid, false);
  const negative = editProjectionResource(source, 0, '-4'); runtime.update([negative]);
  const changed = runtime.read(source.id).source; assert.equal(changed.status, 'ready');
  if (changed.status === 'ready') assert.equal(changed.model.dotProduct, -2);
  const different = editProjectionResource(source, 0, '8'); assert.equal(negative.revision, different.revision);
  runtime.update([different]); assert.notEqual(runtime.read(source.id).source, changed);
  runtime.update([source]); assert.deepEqual(runtime.read(source.id).source, initial);
  assert.throws(() => runtime.update([{ ...source, admitted: ['99', '2', '1', '1'] }]), /agree/);
  assert.deepEqual(runtime.read(source.id).source, initial);
  runtime.update([]); assert.equal(runtime.inspect().cached, 0); assert.throws(() => runtime.read(source.id), /Restore/);
  runtime.dispose(); runtime.dispose(); assert.throws(() => runtime.update([source]), /closed/);
});
test('copy preserves sharing inside the copied group while isolating it from the original; cut retains identity', () => {
  const notebook = fixture(), doc = toProse(notebook), original = notebook.projectionResources![0]!;
  const selected = nodes(doc), slice = new Slice(Fragment.from(selected.map(item => item.node)), 0, 0);
  const copied = prepareProjectionPaste(doc, slice, [original]);
  assert.equal(copied.resources.length, 2); const copy = copied.resources[1]!;
  assert.notEqual(copy.id, original.id); assert.deepEqual(copy.admitted, original.admitted);
  copied.slice.content.forEach(node => { assert.equal(node.attrs['resource'], copy.id); assert.ok(!selected.some(s => s.node.attrs['id'] === node.attrs['id'])); });
  const edited = editProjectionResource(copy, 0, '9'); assert.equal(original.draft[0], '4'); assert.equal(edited.draft[0], '9');
  let state = EditorState.create({ doc });
  for (const { node, pos } of [...selected].reverse()) state = state.apply(state.tr.delete(pos, pos + node.nodeSize));
  const cut = prepareProjectionPaste(state.doc, Slice.fromJSON(schema, JSON.parse(JSON.stringify(slice.toJSON()))), [original]);
  assert.deepEqual(cut.resources, [original]); assert.ok(cut.slice.eq(slice));
  assert.throws(() => prepareProjectionPaste(doc, slice, []), /Restore/);
});
test('copy reclaims unused resource capacity atomically and native history restores removed records', () => {
  const notebook = fixture(), original = notebook.projectionResources![0]!;
  const resources = [original, ...Array.from({ length: 15 }, () => createProjectionResource())];
  let state = EditorState.create({ doc: toProse({ ...notebook, projectionResources: resources }), plugins: [history()] });
  const before = state.doc, selected = nodes(before)[0]!, slice = new Slice(Fragment.from(selected.node), 0, 0);
  const prepared = prepareProjectionPaste(before, slice, resources);
  assert.equal(prepared.resources.length, 2);
  const apply = (tr: import('prosemirror-state').Transaction) => { state = state.apply(tr); };
  apply(closeHistory(state.tr).setNodeAttribute(0, 'value', prepared.resources).replaceRange(before.content.size, before.content.size, prepared.slice));
  assert.equal(projectionResourcesIn(state.doc).length, 2); undo(state, apply); assert.ok(state.doc.eq(before));
  redo(state, apply); assert.equal(projectionResourcesIn(state.doc).length, 2);
});
test('zero direction stays a defined saved input with an explicitly undefined projection', () => {
  const zero = createProjectionResource(['4', '2', '0', '0']), runtime = createProjectionRuntime([zero]);
  const state = runtime.read(zero.id); assert.equal(state.valid, true); assert.equal(state.source.status, 'undefined'); runtime.dispose();
});
