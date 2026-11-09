import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import readings from '../content/authoring/algebra/fractional-linear-readings.json' with { type: 'json' };
import { compileFractionalReading, fractionalReadingOwner } from '../scripts/fractional-reading-page.ts';
import { reviseAlgebraReading } from '../scripts/what-counts-revision.ts';
import { readWhatCountsArticle, registerWhatCountsReadings, whatCountsRoot } from '../scripts/what-counts-readings.ts';
import { compileKpFractionalLinearEquationLesson } from '../src/reader/compiler/fractional-linear-equation-lesson.ts';
import { compileKpFractionalLinearEquationLessonModel } from '../src/reader/compiler/fractional-linear-equation-lesson-model.ts';
import { fractionalReadingCommentary } from '../src/reader/compiler/fractional-reading-commentary.ts';
import { readEndpointCommentary } from '../src/reader/document/public-api.ts';
import { fractionalPassageOperations } from '../src/reader/compiler/fractional-passage-operations.ts';

const original = readFileSync(new URL('../content/lessons/solve-fractional-linear.md', import.meta.url), 'utf8');
// Test the binder against a fixed example; authors can revise the working copy
// without rewriting tests that merely repeat their wording or target choices.
const draft = readFileSync(new URL('../content/authoring/algebra/readings/fractional-linear/reasoning/b879f25e78c2dada10cbacbd8c44584737c17a15cdc41dbed9153f00731f56dd.article.md', import.meta.url), 'utf8');
const route = '/reader/solve-fractional-linear/';

test('the alternative reading preserves exact original HTML and rejects foreign versions before hydration', () => {
  const baseline = compileKpFractionalLinearEquationLesson(original).html;
  assert.equal(compileFractionalReading(route), baseline);
  assert.equal(compileFractionalReading(route + '?kpVersion=1&kpCheckpoint=beat.read&kpLesson=lesson.solve-x.fractional-linear&kpProgress=0'), baseline);
  const candidate = compileFractionalReading(route + '?reading=reasoning');
  assert.match(candidate, /The tempting wrong move/);
  assert.match(candidate, /Try a changed case/);
  assert.match(candidate, /data-kp-reader-endpoint-commentary=/);
  assert.match(candidate, /data-kp-version="reasoning\./);
  assert.equal((candidate.match(/data-kp-operation-id=/g) ?? []).length, 6);
  for (const query of ['?reading=missing', '?reading=reasoning&kpVersion=1', '?kpVersion=' + readings.reasoning.version,
    '?reading=reasoning&kpVersion=' + readings.reasoning.version + '&kpLesson=lesson.foreign'])
    assert.throws(() => compileFractionalReading(route + query), /location\./);
});

test('note wording and semantic targets come from the manuscript while the equation owns progress', () => {
  const model = compileKpFractionalLinearEquationLessonModel(draft);
  const notes = fractionalReadingCommentary(model.document, model.animation);
  assert.deepEqual(readEndpointCommentary(notes), notes);
  assert.equal(notes.length, 2);
  assert.equal(notes[0]?.notes[0]?.text, 'Three was added after x was halved. Start by undoing that addition.');
  assert.deepEqual(notes[0]?.notes[0]?.views, { 'equation.fractional-linear.initial': ['equation.fractional-linear.initial.lhs.plus3'] });
  const oldModel = compileKpFractionalLinearEquationLessonModel(original);
  assert.deepEqual(fractionalPassageOperations(model.hydration.blocks[0]!.checkpoints, model.animation.transformations),
    fractionalPassageOperations(oldModel.hydration.blocks[0]!.checkpoints, oldModel.animation.transformations));
  const changed = draft.replace('Three was added after x was halved. Start by undoing that addition.', 'Seven is the value of the entire left side.')
    .replace('"focusRefs": ["equation.fractional-linear.initial.lhs.plus3"]', '"focusRefs": ["equation.fractional-linear.initial.rhs.7"]');
  const revised = compileKpFractionalLinearEquationLessonModel(changed);
  assert.deepEqual(fractionalReadingCommentary(revised.document, revised.animation)[0]?.notes[0]?.views,
    { 'equation.fractional-linear.initial': ['equation.fractional-linear.initial.rhs.7'] });
  for (const broken of [
    draft.replace('"id": "equation.fractional-linear.initial"', '"id": "equation.fractional-linear.unknown"'),
    draft.replace('"focusRefs": ["equation.fractional-linear.initial.lhs.plus3"]', '"focusRefs": ["equation.fractional-linear.solved.rhs.8"]'),
    draft.replace('"progressPermille": 0', '"progressPermille": 167')
  ]) assert.throws(() => compileKpFractionalLinearEquationLesson(broken));
});

test('serialized notes reject malformed identity, views, duplication and unsupported placement', () => {
  const model = compileKpFractionalLinearEquationLessonModel(draft);
  const stop = fractionalReadingCommentary(model.document, model.animation)[0]!;
  const note = stop.notes[0]!;
  for (const invalid of [null, {}, [stop, stop], [{ ...stop, notes: [] }], [{ ...stop, notes: [note, note] }],
    [{ ...stop, notes: [{ ...note, views: {} }] }], [{ ...stop, notes: [{ ...note, side: 'left' }] }],
    [{ ...stop, notes: [{ ...note, text: '' }] }], [{ ...stop, notes: [{ ...note, views: { invalid: [1] } }] }]])
    assert.throws(() => readEndpointCommentary(invalid), /reader.annotations/);
});

test('a second reading owner reuses checked save and preserves its last valid source and original addresses', () => {
  const scratch = resolve(whatCountsRoot, 'tmp/codex'); mkdirSync(scratch, { recursive: true });
  const root = mkdtempSync(resolve(scratch, 'fractional-reading-'));
  try {
    const registryPath = resolve(root, fractionalReadingOwner.registryPath);
    for (const current of registerWhatCountsReadings(readings).values()) for (const revision of [current, ...current.previous ?? []]) {
      const path = resolve(root, revision.articlePath); mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, readWhatCountsArticle(revision));
    }
    writeFileSync(registryPath, JSON.stringify(readings));
    const saved = () => JSON.parse(readFileSync(registryPath, 'utf8'));
    const render = (href: string) => compileFractionalReading(href, saved(), revision => readWhatCountsArticle(revision, root));
    const oldHref = route + '?reading=reasoning&kpVersion=' + readings.reasoning.version;
    const old = render(oldHref), baseline = render(route);
    const revised = draft + '\nA useful move still needs a reason: explain why it preserves the solutions.\n';
    const check = (markdown: string) => reviseAlgebraReading({ reading: 'reasoning', markdown, mode: { kind: 'check' } }, fractionalReadingOwner, root);
    const proposal = check(revised);
    assert.equal(render(oldHref), old);
    assert.throws(() => render(proposal.previewPath), /location.document/);
    const apply = (markdown: string, basis: string) => reviseAlgebraReading({ reading: 'reasoning', markdown,
      mode: { kind: 'apply', expectedBasis: basis } }, fractionalReadingOwner, root);
    apply(revised, proposal.basis);
    assert.equal(render(oldHref), old); assert.equal(render(route), baseline);
    assert.match(render(proposal.previewPath), /A useful move still needs a reason/);
    const before = readFileSync(registryPath, 'utf8');
    assert.throws(() => check(revised.replace('"id": "beat.multiply"', '"id": "unowned"')), /Unbound passage/);
    assert.throws(() => apply(revised + '\nA different draft.\n', proposal.basis), /revision.stale/);
    assert.equal(readFileSync(registryPath, 'utf8'), before);
    assert.throws(() => reviseAlgebraReading({ reading: 'reasoning', markdown: revised, mode: { kind: 'check' } },
      { ...fractionalReadingOwner, registryPath: '../foreign.json' }, root), /revision.owner/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
