import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { importFractionReading, projectReading, readNotebook, proseText } from '../src/fraction-notebook/model.ts';
import { compileFractionNotebook, fractionPreviewPage } from '../src/fraction-notebook/compile.ts';
import { compileKpFractionalLinearEquationLesson } from '../src/reader/compiler/fractional-linear-equation-lesson.ts';
import { toProse, fromProse, schema } from '../src/fraction-notebook/editor.ts';
import { fractionV1Fixture } from './fraction-notebook-fixture.ts';
import { metadata } from '../src/fraction-notebook/json.ts';
import { presentInline } from '../src/fraction-notebook/inline-source.ts';
import { createInlinePlugin } from '../src/fraction-notebook/inline-plugin.ts';
import { preparePastedSlice } from '../src/fraction-notebook/clipboard.ts';
import { EditorState, TextSelection } from 'prosemirror-state';
import { history, undo } from 'prosemirror-history';
import { Fragment, Slice } from 'prosemirror-model';

const canonical = readFileSync(new URL('../content/authoring/algebra/fractional-linear-reasoning.article.md', import.meta.url), 'utf8');
const seed = () => importFractionReading(canonical).notebook;
test('fraction JSON preserves cell identities and prose through rich editor conversion', () => {
  const notebook = seed();
  assert.deepEqual(fromProse(toProse(notebook), notebook), { ...notebook, revision: 1 });
  assert.deepEqual(readNotebook(JSON.parse(JSON.stringify(notebook))), notebook);
  const { definition } = importFractionReading(canonical);
  assert.equal(compileKpFractionalLinearEquationLesson(projectReading(notebook, definition)).html, compileKpFractionalLinearEquationLesson(canonical).html);
  assert.throws(() => schema.node('doc', null, [schema.node('paragraph')]).check());
});
test('story edits use the existing annotation and fixed operation admission', () => {
  const notebook = seed(), prepared = compileFractionNotebook(notebook, canonical);
  const revised = readNotebook({ ...notebook, cells: notebook.cells.map(cell => cell.type !== 'story' ? cell : {
    ...cell, caption: { ...cell.caption, text: 'Read the entire right side.' },
    source: cell.source.replace('equation.fractional-linear.initial.lhs.plus3', 'equation.fractional-linear.initial.rhs.7')
  }) });
  const next = compileFractionNotebook(revised, canonical);
  assert.equal(next.notes[0]!.notes[0]!.text, 'Read the entire right side.');
  assert.deepEqual(next.beats.map(beat => [beat.id, beat.progressPermille]), prepared.beats.map(beat => [beat.id, beat.progressPermille]));
  const invalid = { ...revised, cells: revised.cells.map(cell => cell.type !== 'story' ? cell : { ...cell, source: cell.source.replace('equation.fractional-linear.initial.rhs.7', 'invented.target') }) };
  assert.throws(() => compileFractionNotebook(invalid, canonical));
  assert.deepEqual(compileFractionNotebook(notebook, canonical), prepared);
});
test('unknown notebook authority, duplicate UUIDs and injected directives cannot enter preview', () => {
  const notebook = seed();
  assert.throws(() => readNotebook({ ...notebook, execute: 'arbitrary()' }));
  assert.throws(() => readNotebook({ ...notebook, cells: [...notebook.cells, notebook.cells[1]] }));
  assert.throws(() => compileFractionNotebook({ ...notebook, cells: notebook.cells.map(cell => cell.type === 'story' ? { ...cell, source: '{"steps":[]}' } : cell) }, canonical));
  assert.throws(() => compileFractionNotebook({ ...notebook, cells: notebook.cells.map((cell, index) => index === 1 ? { ...cell, content: [proseText('```kp-animation-story')] } : cell) }, canonical));
  assert.match(fractionPreviewPage(canonical), /data-kp-fraction-notebook-preview="true"/);
  assert.doesNotMatch(compileKpFractionalLinearEquationLesson(canonical).html, /data-kp-fraction-notebook-preview/);
});
test('v1 migration preserves existing identities, edits and invalid source without mutating input', () => {
  const old = fractionV1Fixture(), original = JSON.stringify(old), migrated = readNotebook(old);
  assert.equal(migrated.schemaVersion, 2); assert.equal(migrated.revision, old.revision);
  assert.deepEqual(readNotebook(old), migrated); assert.equal(JSON.stringify(old), original);
  const header = migrated.cells[0]!; assert.equal(header.type, 'articleHeader');
  if (header.type !== 'articleHeader') throw new Error('Header missing');
  assert.equal(header.title.id, old.cells[0]!.id); assert.equal(header.authors[0]!.name, 'Codex');
  assert.deepEqual(migrated.cells.slice(1).map(c => c.id), old.cells.slice(1).map(c => c.id));
  assert.equal(compileFractionNotebook(migrated, canonical).notes[0]!.notes[0]!.text, 'Three was added after x was halved. Start by undoing that addition.');
  const invalid = { ...old, cells: old.cells.map(c => c.type === 'story' ? { ...c, source: '{ unfinished' } : c) };
  assert.equal(readNotebook(invalid).cells.find(c => c.type === 'story')?.source, '{ unfinished');
  assert.throws(() => readNotebook({ ...old, cells: [...old.cells, old.cells[1]] }));
});
test('metadata and phrase annotations survive structured editing while ambiguous identity is rejected', () => {
  const original = seed(), annotationId = '30000000-0000-4000-8000-000000000001';
  const doc = readNotebook({ ...original, cells: original.cells.map((c, index) => index !== 1 ? c : { ...c,
    metadata: { purpose: 'argument', tags: ['reversible'] }, content: [
      { ...proseText('A selected '), annotations: [{ id: annotationId, metadata: { note: 'Keep this relationship.' } }] },
      { ...proseText('phrase'), marks: ['strong'], annotations: [{ id: annotationId, metadata: { note: 'Keep this relationship.' } }] }
    ] }) });
  assert.deepEqual(fromProse(toProse(doc), doc), { ...doc, revision: doc.revision + 1 });
  assert.throws(() => readNotebook({ ...doc, cells: doc.cells.map((c, index) => index !== 1 ? c : { ...c, id: annotationId }) }));
  assert.throws(() => metadata({ bad: Infinity }));
  assert.throws(() => metadata({ get hidden() { throw new Error('Accessed'); } }), /accessors/);
  const header = original.cells[0]!;
  assert.throws(() => readNotebook({ ...original, cells: [{ ...header, authors: [] }, ...original.cells.slice(1)] }));
});
test('inline presentation is checked independently of persistent draft validity', () => {
  const inlineId = '30000000-0000-4000-8000-000000000002', base = seed();
  const make = (source: string) => readNotebook({ ...base, cells: base.cells.map((c, i) => i !== 1 ? c : { ...c,
    content: [proseText('Half is '), { type: 'math', id: inlineId, metadata: { purpose: 'quantity' }, source }, proseText('.')] }) });
  const doc = make('$\\frac{x}{2}$'); assert.deepEqual(fromProse(toProse(doc), doc), { ...doc, revision: 1 });
  assert.doesNotThrow(() => compileFractionNotebook(doc, canonical));
  const invalid = make('$\\frac{$'); assert.throws(() => compileFractionNotebook(invalid, canonical));
  assert.deepEqual(readNotebook(JSON.parse(JSON.stringify(invalid))), invalid);
  assert.equal(presentInline('link', '[Read](/reader/solve-fractional-linear/)').kind, 'link');
  assert.throws(() => presentInline('link', '[Read](javascript:alert(1))'));
  assert.throws(() => presentInline('link', '[Read](//foreign.example/path)'));
  assert.throws(() => presentInline('math', '$$x$$'));
});
test('conversion waits for cursor departure and Undo is not immediately undone by conversion', () => {
  const base = seed(), sentence = 'Half is $x/2$.';
  const doc = toProse(readNotebook({ ...base, cells: base.cells.map((c, i) => i !== 1 ? c : { ...c, content: [proseText(sentence)] }) }));
  let start = 0; doc.descendants((n, pos) => { if (n.isText && n.text === sentence) start = pos; });
  let state = EditorState.create({ doc, selection: TextSelection.create(doc, start + 10), plugins: [history(), createInlinePlugin()] });
  state = state.applyTransaction(state.tr.setSelection(TextSelection.create(state.doc, start + 11))).state;
  assert.equal(state.doc.child(1).childCount, 1);
  state = state.applyTransaction(state.tr.setSelection(TextSelection.create(state.doc, start + sentence.length))).state;
  assert.equal(state.doc.child(1).child(1).type.name, 'math');
  assert.ok(undo(state, tr => { state = state.applyTransaction(tr).state; }));
  assert.equal(state.doc.child(1).childCount, 1);
  state = state.applyTransaction(state.tr.setSelection(TextSelection.create(state.doc, start))).state;
  assert.equal(state.doc.child(1).textContent, sentence); assert.equal(state.doc.child(1).childCount, 1);
});
test('clipboard copies allocate new object and phrase identities without changing originals', () => {
  const base = seed(), id = '30000000-0000-4000-8000-000000000003', annotationId = '30000000-0000-4000-8000-000000000004';
  const doc = toProse(readNotebook({ ...base, cells: base.cells.map((c, i) => i !== 1 ? c : { ...c,
    content: [{ ...proseText('Compare '), annotations: [{ id: annotationId, metadata: { note: 'reference' } }] }, { type: 'math', id, metadata: { note: 'quantity' }, source: '$x$' }] }) }));
  const original = doc.child(1), copy = preparePastedSlice(doc, new Slice(Fragment.from(original), 0, 0)).content.firstChild!;
  assert.notEqual(copy.attrs['id'], original.attrs['id']); assert.notEqual(copy.child(1).attrs['id'], id);
  assert.notEqual(copy.child(0).marks[0]!.attrs['id'], annotationId);
  assert.deepEqual(copy.child(1).attrs['metadata'], { note: 'quantity' });
  assert.equal(original.child(1).attrs['id'], id);
});
