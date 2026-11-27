import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { contextualRevisionProtocol, ContextualRevisionGap, createContextualRevisionSession,
  type ContextualRevisionGapCode, type ContextualRevisionProposal, type ContextualRevisionRequest,
  type ContextualRevisionSnapshot } from '../src/editor-chat/contextual-revision.ts';
import { fractionObjectId } from '../src/fraction-notebook/object-protocol.ts';
import { importFractionReading, readSteps } from '../src/fraction-notebook/model.ts';
import { compileFractionNotebook } from '../src/fraction-notebook/compile.ts';
import { annotationRevisionTransaction, readRevisionResponse, revisedAnnotationNotebook, revisionPrompt } from '../src/fraction-notebook/contextual-revision.ts';
import { toProse, fromProse } from '../src/fraction-notebook/schema.ts';
import { EditorState } from 'prosemirror-state';
import { history, undo, redo } from 'prosemirror-history';
import { draftLimit } from '../src/editor-chat/protocol.ts';

const canonical = readFileSync(new URL('../content/authoring/algebra/fractional-linear-reasoning.article.md', import.meta.url), 'utf8');
const { notebook, definition } = importFractionReading(canonical);
const story = notebook.cells.find(cell => cell.type === 'story');
if (!story) throw new Error('Expected the canonical fraction story.');
const stepIndex = 5, beat = definition.beats[stepIndex]!;
const step = readSteps(story.source, definition.beats.length, story.caption.text)[stepIndex]!;
const sourceRevision = createHash('sha256').update(canonical).digest('hex');
const current = (): ContextualRevisionSnapshot => ({
  objectId: fractionObjectId, objectTitle: 'Fraction animation annotations', sourceRevision,
  draftSource: JSON.stringify(notebook), branchId: 'main', threadId: 'thread-1',
  annotation: { id: beat.id, ...step }, availableTargets: [...new Set(beat.focusRefs)],
  surroundingContext: definition.beats.slice(0, 3).map(b => `${b.title}: ${b.content}`).join('\n')
});
function proposal(request: ContextualRevisionRequest): ContextualRevisionProposal {
  return { protocol: contextualRevisionProtocol, sessionId: request.sessionId, request: request.request,
    objectId: request.objectId, sourceRevision: request.sourceRevision, draftRevision: request.draftRevision,
    annotationId: request.annotation.id, title: request.annotation.title,
    content: 'Four is half the unknown; double both sides to recover the whole.', focusRefs: request.annotation.focusRefs };
}
const rejects = (operation: () => unknown, code: ContextualRevisionGapCode) => assert.throws(operation,
  (error: unknown) => error instanceof ContextualRevisionGap && error.code === code);

test('a bounded request captures exact draft identity and selected context without exposing the whole notebook', () => {
  const snapshot = current(), session = createContextualRevisionSession('review-1');
  const request = session.begin(snapshot, 'Explain why this operation preserves equality.');
  assert.equal(request.draftRevision, createHash('sha256').update(snapshot.draftSource).digest('hex'));
  assert.equal(request.sourceRevision, sourceRevision);
  assert.equal(request.annotation.id, beat.id);
  assert.equal('draftSource' in request, false);
  assert.ok(Object.isFrozen(request)); assert.ok(Object.isFrozen(request.annotation));
  assert.ok(Object.isFrozen(request.annotation.focusRefs)); assert.ok(Object.isFrozen(request.availableTargets));
  assert.equal(session.pending(), undefined);
  rejects(() => session.accept(snapshot), 'proposal-not-ready');
});

test('receiving and rejecting a valid proposal do not mutate the original draft or annotation', () => {
  const snapshot = current(), before = JSON.stringify(snapshot), session = createContextualRevisionSession('review-1');
  const request = session.begin(snapshot, 'Improve this wording.'), raw = proposal(request);
  const change = session.receive(raw, snapshot);
  assert.equal(change.before.content, step.content); assert.equal(change.after.content, raw.content);
  assert.equal(JSON.stringify(snapshot), before); assert.equal(snapshot.draftSource, JSON.stringify(notebook));
  assert.equal(session.pending(), change); assert.ok(Object.isFrozen(change)); assert.ok(Object.isFrozen(change.after));
  session.cancel(); assert.equal(session.pending(), undefined);
  rejects(() => session.accept(snapshot), 'inactive-request');
  rejects(() => session.receive(raw, snapshot), 'inactive-request');
});

test('acceptance yields one selected replacement and the existing compiler preserves all mathematical moments', () => {
  const snapshot = current(), session = createContextualRevisionSession('review-1');
  const request = session.begin(snapshot, 'Improve this wording.');
  session.receive(proposal(request), snapshot);
  const change = session.accept(snapshot), original = JSON.parse(story.source);
  const nextSource = JSON.stringify({ steps: original.steps.map((value: unknown, index: number) => index === stepIndex
    ? { title: change.after.title, content: change.after.content, focusRefs: change.after.focusRefs } : value) });
  const revised = { ...notebook, cells: notebook.cells.map(cell => cell.id === story.id ? { ...story, source: nextSource } : cell) };
  const oldCompiled = compileFractionNotebook(notebook, canonical), compiled = compileFractionNotebook(revised, canonical);
  assert.equal(compiled.beats[stepIndex]!.content, change.after.content);
  assert.deepEqual(compiled.beats.map(b => [b.id, b.progressPermille]), oldCompiled.beats.map(b => [b.id, b.progressPermille]));
  assert.deepEqual(compiled.beats.filter((_, index) => index !== stepIndex), oldCompiled.beats.filter((_, index) => index !== stepIndex));
  rejects(() => session.accept(snapshot), 'inactive-request');
});

test('canonical revision changes and exact draft edits invalidate receive and later acceptance', () => {
  for (const [edit, code] of [
    [(value: ContextualRevisionSnapshot) => ({ ...value, sourceRevision: 'new-source-revision' }), 'stale-source'],
    [(value: ContextualRevisionSnapshot) => ({ ...value, draftSource: value.draftSource + ' ' }), 'stale-draft']
  ] as const) {
    const snapshot = current(), changed = edit(snapshot), session = createContextualRevisionSession('review-1');
    const request = session.begin(snapshot, 'Improve this wording.');
    rejects(() => session.receive(proposal(request), changed), code);
    const ready = session.receive(proposal(request), snapshot);
    rejects(() => session.accept(changed), code); assert.equal(session.pending(), ready);
  }
});

test('an undo branch that reuses its revision counter cannot substitute different draft bytes', () => {
  const snapshot = current(), session = createContextualRevisionSession('review-1');
  const request = session.begin(snapshot, 'Improve this wording.');
  const changed = { ...snapshot, draftSource: snapshot.draftSource.replace('How do you choose the next move?', 'Which move should come next?') };
  assert.notEqual(changed.draftSource, snapshot.draftSource);
  rejects(() => session.receive(proposal(request), changed), 'stale-draft');
});

test('conversation, selected beat, annotation values and admitted target changes invalidate review', () => {
  const snapshot = current();
  const edits = [
    { ...snapshot, branchId: 'other-branch' }, { ...snapshot, threadId: 'other-thread' },
    { ...snapshot, annotation: { ...snapshot.annotation, id: 'other-beat' } },
    { ...snapshot, annotation: { ...snapshot.annotation, title: 'Different annotation' } },
    { ...snapshot, availableTargets: [...snapshot.availableTargets, 'another-admitted-target'] }
  ];
  for (const changed of edits) {
    const session = createContextualRevisionSession('review-1'), request = session.begin(snapshot, 'Improve this wording.');
    rejects(() => session.receive(proposal(request), changed), 'changed-context');
    session.receive(proposal(request), snapshot);
    rejects(() => session.accept(changed), 'changed-context');
  }
});

test('unknown targets, changing another annotation, or forged source bases retain the pending request', () => {
  const snapshot = current(), session = createContextualRevisionSession('review-1');
  const request = session.begin(snapshot, 'Improve this wording.'), raw = proposal(request);
  const invalid: readonly [unknown, ContextualRevisionGapCode][] = [
    [{ ...raw, focusRefs: ['invented.target'] }, 'invalid-target'],
    [{ ...raw, focusRefs: [] }, 'invalid-target'],
    [{ ...raw, annotationId: 'another.annotation' }, 'changed-context'],
    [{ ...raw, objectId: 'another.object' }, 'stale-source'],
    [{ ...raw, sourceRevision: 'forged-revision' }, 'stale-source'],
    [{ ...raw, draftRevision: 'forged-draft' }, 'stale-draft']
  ];
  for (const [candidate, code] of invalid) rejects(() => session.receive(candidate, snapshot), code);
  assert.equal(session.receive(raw, snapshot).after.content, raw.content);
});

test('strict proposal admission rejects unknown fields, hidden state, oversized text and repeated targets', () => {
  const snapshot = current(), session = createContextualRevisionSession('review-1');
  const request = session.begin(snapshot, 'Improve this wording.'), raw = proposal(request);
  for (const candidate of [
    { ...raw, operation: 'replace-equation' }, { ...raw, content: 'x'.repeat(30001) },
    { ...raw, title: 'x'.repeat(301) }, { ...raw, focusRefs: ['same', 'same'] },
    { ...raw, protocol: 'unknown' }, { ...raw, request: NaN }, { ...raw, request: 0 },
    { ...raw, content: undefined }, { ...raw, focusRefs: new Array(2) },
    { ...raw, get title() { throw new Error('Accessor must not execute.'); } },
    Object.defineProperty({ ...raw }, 'hidden', { value: true })
  ]) rejects(() => session.receive(candidate, snapshot), 'invalid-proposal');
  assert.doesNotThrow(() => session.receive(raw, snapshot));
});

test('new requests supersede old responses and duplicate delivery cannot replace a reviewable proposal', () => {
  const snapshot = current(), session = createContextualRevisionSession('review-1');
  const first = session.begin(snapshot, 'Make it shorter.'), second = session.begin(snapshot, 'Explain why.');
  assert.equal(second.request, first.request + 1);
  rejects(() => session.receive(proposal(first), snapshot), 'superseded-request');
  rejects(() => session.receive({ ...proposal(second), sessionId: 'another-session' }, snapshot), 'superseded-request');
  const ready = session.receive(proposal(second), snapshot);
  rejects(() => session.receive(proposal(second), snapshot), 'duplicate-proposal');
  rejects(() => session.receive({ ...proposal(second), content: 'Unexpected replacement' }, snapshot), 'duplicate-proposal');
  assert.equal(session.pending(), ready);
});

test('invalid new requests retain the previous reviewable proposal and unsupported families fail explicitly', () => {
  const snapshot = current(), session = createContextualRevisionSession('review-1');
  const request = session.begin(snapshot, 'Improve this wording.'), ready = session.receive(proposal(request), snapshot);
  rejects(() => session.begin(snapshot, ''), 'invalid-context');
  rejects(() => session.begin({ ...snapshot, draftSource: 'x'.repeat(100001) }, 'Improve.'), 'invalid-context');
  rejects(() => session.begin({ ...snapshot, objectId: 'arbitrary-matrix' }, 'Improve.'), 'unsupported-object');
  rejects(() => session.begin({ ...snapshot, annotation: { ...snapshot.annotation, focusRefs: ['unknown'] } }, 'Improve.'), 'invalid-target');
  rejects(() => session.begin({ ...snapshot, annotation: { ...snapshot.annotation, content: 'x'.repeat(30000) } }, 'Improve.'), 'invalid-context');
  assert.equal(session.pending(), ready);
});

test('annotation strings stay literal and proposal admission does not replace domain validation', () => {
  const snapshot = current(), session = createContextualRevisionSession('review-1');
  const request = session.begin(snapshot, 'Improve this wording.');
  const change = session.receive({ ...proposal(request), content: '[Follow this](https://example.com)' }, snapshot);
  const original = JSON.parse(story.source);
  const candidate = (content: string) => {
    const nextSource = JSON.stringify({ steps: original.steps.map((value: unknown, index: number) => index === stepIndex
      ? { title: change.after.title, content, focusRefs: change.after.focusRefs } : value) });
    return { ...notebook, cells: notebook.cells.map(cell => cell.id === story.id ? { ...story, source: nextSource } : cell) };
  };
  const compiled = compileFractionNotebook(candidate(change.after.content), canonical);
  assert.equal(compiled.notes.find(note => note.stateId === beat.id)!.notes[0]!.text, change.after.content);
  assert.throws(() => compileFractionNotebook(candidate('   '), canonical), /text must not be empty/);
  session.cancel(); assert.equal(session.pending(), undefined);
  assert.equal(snapshot.draftSource, JSON.stringify(notebook));
});

test('disposal is idempotent, clears retained proposals, and prevents late response or new work', () => {
  const snapshot = current(), session = createContextualRevisionSession('review-1');
  const request = session.begin(snapshot, 'Improve this wording.'); session.receive(proposal(request), snapshot);
  session.dispose(); session.dispose(); session.cancel(); assert.equal(session.pending(), undefined);
  rejects(() => session.receive(proposal(request), snapshot), 'owner-closed');
  rejects(() => session.accept(snapshot), 'owner-closed');
  rejects(() => session.begin(snapshot, 'Improve.'), 'owner-closed');
});

test('preview revalidation does not consume a proposal and rejects edits made during preparation', () => {
  const snapshot = current(), session = createContextualRevisionSession('review-1');
  const request = session.begin(snapshot, 'Improve this wording.'), ready = session.receive(proposal(request), snapshot);
  assert.equal(session.review(snapshot), ready); assert.equal(session.pending(), ready);
  rejects(() => session.review({ ...snapshot, draftSource: snapshot.draftSource + ' ' }), 'stale-draft');
  assert.equal(session.accept(snapshot), ready);
});

test('one annotation edit preserves every other notebook cell and is one shared undo/redo event', () => {
  const snapshot = current(), session = createContextualRevisionSession('review-1');
  const request = session.begin(snapshot, 'Improve this wording.'), change = session.receive(proposal(request), snapshot);
  const candidate = revisedAnnotationNotebook(notebook, definition.beats, change);
  assert.equal(candidate.revision, notebook.revision + 1);
  assert.deepEqual(candidate.cells.filter(cell => cell.type !== 'story'), notebook.cells.filter(cell => cell.type !== 'story'));
  assert.deepEqual(candidate.cells.map(cell => cell.id), notebook.cells.map(cell => cell.id));
  let state = EditorState.create({ doc: toProse(notebook), plugins: [history()] });
  const original = state.doc;
  state = state.apply(annotationRevisionTransaction(state, candidate));
  assert.deepEqual(fromProse(state.doc, notebook), candidate);
  assert.equal(undo(state, transaction => { state = state.apply(transaction); }), true);
  assert.equal(state.doc.eq(original), true);
  assert.equal(redo(state, transaction => { state = state.apply(transaction); }), true);
  assert.deepEqual(fromProse(state.doc, notebook), candidate);
  assert.throws(() => revisedAnnotationNotebook({ ...notebook, revision: 5 }, definition.beats, change), /notebook changed/);
});

test('the opening annotation updates its caption slot without inventing a JSON content field', () => {
  const first = definition.beats[0]!, steps = readSteps(story.source, definition.beats.length, story.caption.text);
  const snapshot = { ...current(), annotation: { id: first.id, ...steps[0]! }, availableTargets: first.focusRefs };
  const session = createContextualRevisionSession('review-1'), request = session.begin(snapshot, 'Make the first observation clearer.');
  const change = session.receive({ ...proposal(request), title: 'Find the final operation', content: 'Notice that three was added after taking the half.' }, snapshot);
  const candidate = revisedAnnotationNotebook(notebook, definition.beats, change), nextStory = candidate.cells.find(cell => cell.type === 'story')!;
  assert.equal(nextStory.caption.id, story.caption.id); assert.equal(nextStory.caption.text, change.after.content);
  assert.equal(Object.hasOwn(JSON.parse(nextStory.source).steps[0], 'content'), false);
  assert.deepEqual(readSteps(nextStory.source, definition.beats.length, nextStory.caption.text).slice(1), steps.slice(1));
  const state = EditorState.create({ doc: toProse(notebook), plugins: [history()] });
  assert.deepEqual(fromProse(state.apply(annotationRevisionTransaction(state, candidate)).doc, notebook), candidate);
  assert.equal(compileFractionNotebook(candidate, canonical).notes[0]!.notes[0]!.text, change.after.content);
});

test('prompts expose only selected revision context and response parsing never guesses through prose or tool code', () => {
  const session = createContextualRevisionSession('review-1'), request = session.begin(current(), 'Make the relationship clearer.');
  const prompt = revisionPrompt(request);
  assert.ok(prompt.length <= draftLimit); assert.match(prompt, /not permission to edit a file/);
  assert.doesNotMatch(prompt, /draftSource|"token"|"project"|"messages"/);
  const raw = proposal(request), serialized = JSON.stringify(raw);
  assert.deepEqual(readRevisionResponse(serialized), raw);
  assert.deepEqual(readRevisionResponse('```json\n' + serialized + '\n```'), raw);
  assert.throws(() => readRevisionResponse('I suggest:\n' + serialized));
  assert.throws(() => readRevisionResponse('```javascript\n' + serialized + '\n```'));
  assert.throws(() => readRevisionResponse(serialized + '\n' + serialized));
});
