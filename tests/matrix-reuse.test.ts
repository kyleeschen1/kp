import { strict as assert } from 'node:assert';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { EditorState } from 'prosemirror-state';
import { history, undo } from 'prosemirror-history';
import { newId } from '../src/notebook/model.ts';
import { createMatrixVectorDocument, editMatrixVectorDocument } from '../src/math-resources/data-api.ts';
import { readNotebook } from '../src/fraction-notebook/model.ts';
import { toProse, fromProse } from '../src/fraction-notebook/schema.ts';
import { freshMatrixNotebook } from '../src/fraction-notebook/matrix-notebook-identity.ts';
import { importMatrixPublication, matrixNote, publishMatrix, readMatrixBindings, readMatrixPublications, refreshMatrixBinding } from '../src/fraction-notebook/matrix-reuse-data.ts';
import { matrixRevisionSnapshot, revisedMatrixNote } from '../src/fraction-notebook/matrix-revision-data.ts';
import { createContextualRevisionSession, contextualRevisionProtocol } from '../src/editor-chat/contextual-revision.ts';

const source = createMatrixVectorDocument(), owner = newId(), note = matrixNote(source, []);
const publication = publishMatrix([], owner, source, note, null)[0]!;
test('publication ownership and compare-and-swap reject stale writes and closure identity replacement', () => {
  assert.throws(() => publishMatrix([publication], owner, source, note, null), /changed/);
  assert.throws(() => publishMatrix([publication], newId(), source, note, 1), /Only/);
  const other = createMatrixVectorDocument();
  assert.throws(() => publishMatrix([publication], owner, { ...other, id: source.id }, note, 1), /identity/);
  assert.throws(() => publishMatrix([], owner, editMatrixVectorDocument(source, { kind: 'vector', field: 'x', text: '-' }), note, null), /Complete/);
  assert.throws(() => readMatrixPublications([publication, publication]), /repeated/);
});
test('copy, derive and transclude retain distinct identities and update semantics', () => {
  const copy = importMatrixPublication(publication, 'copy');
  const derive = importMatrixPublication(publication, 'derive');
  const shared = importMatrixPublication(publication, 'transclude');
  assert.equal(copy.binding, undefined); assert.notEqual(copy.document.matrix.id, source.matrix.id);
  assert.notEqual(derive.document.id, source.id); assert.equal(derive.binding!.source, source.id);
  assert.equal(shared.document.matrix.id, source.matrix.id); assert.notEqual(shared.document.occurrences[0]!.id, source.occurrences[0]!.id);
  let changed = editMatrixVectorDocument(source, { kind: 'matrix', field: 'a00', text: '3' });
  changed = editMatrixVectorDocument(changed, { kind: 'vector', field: 'x', text: '-4' });
  const next = publishMatrix([publication], owner, changed, note, 1)[0]!;
  const local = editMatrixVectorDocument(derive.document, { kind: 'vector', field: 'y', text: '7' });
  const updated = refreshMatrixBinding(local, derive.binding!, next);
  assert.deepEqual(updated.document.matrix.entries, changed.matrix.entries);
  assert.deepEqual(updated.document.vector.entries, [1, 7]);
  assert.equal(updated.document.matrix.id, local.matrix.id);
  assert.deepEqual(updated.document.occurrences, local.occurrences);
  assert.deepEqual(refreshMatrixBinding(shared.document, shared.binding!, next).document.vector.entries, [-4, 2]);
  assert.deepEqual(copy.document.matrix.entries, source.matrix.entries);
});
test('missing, withdrawn, foreign and reversed upstream revisions retain dependency snapshots', () => {
  const shared = importMatrixPublication(publication, 'transclude');
  assert.throws(() => refreshMatrixBinding(shared.document, shared.binding!, undefined), /unavailable/);
  const withdrawn = publishMatrix([publication], owner, source, note, 1, true)[0]!;
  assert.throws(() => importMatrixPublication(withdrawn, 'copy'), /withdrawn/);
  assert.throws(() => refreshMatrixBinding(shared.document, shared.binding!, withdrawn), /unavailable/);
  assert.throws(() => refreshMatrixBinding(shared.document, { ...shared.binding!, owner: newId() }, publication), /own/);
  assert.throws(() => refreshMatrixBinding(shared.document, { ...shared.binding!, revision: 3 }, publication), /older/);
  assert.throws(() => readMatrixBindings([{ ...shared.binding!, kind: 'derive' }], [shared.document]), /identity/);
});
test('named notebooks have fresh seed closure identities and bindings/notes participate in native undo', () => {
  const seed = readNotebook(JSON.parse(readFileSync('content/notebooks/matrix-object-exemplar.json', 'utf8')));
  const fresh = freshMatrixNotebook(seed, newId());
  assert.notEqual(fresh.id, seed.id); assert.notEqual(fresh.matrixResources![0]!.matrix.id, seed.matrixResources![0]!.matrix.id);
  const resource = fresh.matrixResources![0]!;
  let state = EditorState.create({ doc: toProse(fresh), plugins: [history()] });
  state = state.apply(state.tr.setNodeAttribute(0, 'notes', [matrixNote(resource, [])]));
  const serialized = fromProse(state.doc, fresh);
  assert.equal(serialized.matrixNotes?.[0]?.resource, resource.id);
  assert.deepEqual(toProse(readNotebook(JSON.parse(JSON.stringify(serialized)))).toJSON(), state.doc.toJSON());
  assert.ok(undo(state, tr => { state = state.apply(tr); }));
  assert.equal(fromProse(state.doc, fresh).matrixNotes, undefined);
});
test('matrix note proposals bind exact source and draft without changing mathematics or other notes', () => {
  const notebook = readNotebook({ schemaVersion: 3, id: newId(), revision: 0, cells: [], matrixResources: [source] });
  const current = matrixRevisionSnapshot(notebook, source.id, 'branch', 'thread');
  const session = createContextualRevisionSession('matrix-review', { kind: 'matrix-note', resource: source.id });
  const request = session.begin(current, 'Explain cancellation.');
  const proposal = { protocol: contextualRevisionProtocol, sessionId: request.sessionId, request: request.request,
    objectId: request.objectId, sourceRevision: request.sourceRevision, draftRevision: request.draftRevision,
    annotationId: request.annotation.id, title: 'Which contributions cancel?', content: 'Compare the weighted columns before adding them.', focusRefs: request.availableTargets };
  const change = session.receive(proposal, current), revised = revisedMatrixNote(notebook, source.id, change);
  assert.deepEqual(revised.matrixResources, notebook.matrixResources); assert.deepEqual(revised.cells, notebook.cells);
  assert.equal(revised.matrixNotes?.[0]?.content, proposal.content);
  assert.throws(() => revisedMatrixNote({ ...notebook, matrixResources: [editMatrixVectorDocument(source, { kind: 'vector', field: 'y', text: '3' })] }, source.id, change), /changed/);
  assert.throws(() => createContextualRevisionSession('fraction-review').begin(current, 'Change this.'), /another object/);
  assert.throws(() => createContextualRevisionSession('other-matrix', { kind: 'matrix-note', resource: newId() }).begin(current, 'Change this.'), /another object/);
});
