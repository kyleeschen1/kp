import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { importFractionReading, projectReading, readNotebook } from '../src/fraction-notebook/model.ts';
import { compileFractionNotebook, fractionPreviewPage } from '../src/fraction-notebook/compile.ts';
import { compileKpFractionalLinearEquationLesson } from '../src/reader/compiler/fractional-linear-equation-lesson.ts';
import { toProse, fromProse, schema } from '../src/fraction-notebook/editor.ts';

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
    ...cell, source: cell.source.replace('Three was added after x was halved. Start by undoing that addition.', 'Read the entire right side.')
      .replace('equation.fractional-linear.initial.lhs.plus3', 'equation.fractional-linear.initial.rhs.7')
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
  assert.throws(() => compileFractionNotebook({ ...notebook, cells: notebook.cells.map((cell, index) => index === 1 ? { ...cell, content: [{ text: '```kp-animation-story', marks: [] }] } : cell) }, canonical));
  assert.match(fractionPreviewPage(canonical), /data-kp-fraction-notebook-preview="true"/);
  assert.doesNotMatch(compileKpFractionalLinearEquationLesson(canonical).html, /data-kp-fraction-notebook-preview/);
});
