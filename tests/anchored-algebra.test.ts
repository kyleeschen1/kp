import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import source from "../content/authoring/algebra/what-counts.json" with { type: "json" };
import readings from "../content/authoring/algebra/what-counts-readings.json" with { type: "json" };
import { compile } from "../src/authoring/algebra/compile.ts";
import { AnchoredAlgebraGap, bindAnchoredCommentary } from "../src/reader/app/what-counts-commentary.ts";
import { compileWhatCountsLesson, registerWhatCountsReadings } from "../scripts/what-counts-reader-page.ts";
import { parseKpLessonMarkdown } from "../src/reader/compiler/lesson-markdown-parser.ts";

test("commentary resolves exact native views and only mathematical stops", () => {
  const draft = compile(source), commentary = bindAnchoredCommentary(draft);
  for (const index of [3, 0, 2, 1, 2, 0]) {
    const point = draft.checkpointProgress[index]!, stop = commentary.at(point)!;
    assert.equal(stop.stateId, source.states[index]!.id);
    assert.equal(commentary.progressFor(stop.stateId), point);
    assert.equal(commentary.at(point + 1e-9), undefined);
    for (const note of stop.notes) for (const [objectId, ids] of Object.entries(note.views)) {
      const object = draft.animation.bundle.objects.find(object => object.id === objectId)!;
      assert.ok(ids.every(id => object.selectors.some(selector => selector.id === id)));
    }
  }
  assert.equal(commentary.at(.5), undefined);
  assert.equal(commentary.at(NaN), undefined);
  assert.throws(() => commentary.progressFor("missing"), AnchoredAlgebraGap);
});
test("valid but changed mathematics or wording cannot inherit an old commentary pin", () => {
  for (const changed of [
    { ...source, editorial: { ...source.editorial, title: "Changed wording" } },
    { ...source, symbols: ["z", "y"], states: source.states.map(state => ({ ...state, latex: state.latex.replaceAll("x", "z") })) }
  ]) assert.throws(() => bindAnchoredCommentary(compile(changed)), AnchoredAlgebraGap);
});
test("static page contains every equation and commentary without enhancement", () => {
  const html = compileWhatCountsLesson(), commentary = bindAnchoredCommentary(compile(source));
  for (const state of source.states) assert.ok(html.includes(state.latex));
  for (const stop of commentary.stops) for (const note of stop.notes) {
    assert.ok(html.includes(note.text)); assert.ok(html.includes(note.detail));
  }
  assert.ok(html.includes('data-kp-reader-layout="rising-passages"'));
  assert.ok(!html.includes('data-composed-card'));
  assert.throws(() => compileWhatCountsLesson('/reader/what-counts/?revision=stale'), AnchoredAlgebraGap);
  for (const params of [
    'kpLesson=lesson.algebra.what-counts&kpVersion=1&kpProgress=500',
    'kpLesson=lesson.other&kpVersion=2&kpProgress=500',
    'kpLesson=lesson.algebra.what-counts&kpVersion=2&kpProgress=NaN'
  ]) assert.throws(() => compileWhatCountsLesson(`/reader/what-counts/?${params}`),
    (error: unknown) => error instanceof AnchoredAlgebraGap && error.path === 'location.document');
  assert.doesNotThrow(() => compileWhatCountsLesson('/reader/what-counts/?kpLesson=lesson.algebra.what-counts&kpVersion=2&kpProgress=500'));
});

for (const reading of [
  { query: '', baseline: 'explanation-first', version: '2', beats: 10, annotations: 4 },
  { query: '?reading=zero', baseline: 'zero-whole', version: 'zero.1', beats: 6, annotations: 2 }
]) test(`the complete ${reading.baseline} baseline survives translation in order`, () => {
  const baseline = parseKpLessonMarkdown({
    sourceId: "explanation-first-baseline", id: "lesson.baseline", version: "1", title: "Baseline",
    markdown: readFileSync(new URL(`../docs/project/reviews/2026-11-08-${reading.baseline}-baseline.md`, import.meta.url), "utf8")
  });
  const html = compileWhatCountsLesson(`/reader/what-counts/${reading.query}`);
  let previous = -1;
  for (const block of baseline.blocks) {
    if (block.kind !== "paragraph") continue;
    const words = block.content.map(inline => inline.kind === "text" ? inline.value : inline.text).join("");
    const escaped = words.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const position = html.indexOf(`<p>${escaped}</p>`, previous + 1);
    // Intro/closing paragraphs carry source IDs; compare their complete contents too.
    const located = position >= 0 ? position : html.indexOf(`>${escaped}</p>`, previous + 1);
    assert.ok(located > previous, `Missing or reordered reasoning: ${words}`);
    previous = located;
  }
  assert.ok(html.includes(`data-kp-version="${reading.version}"`));
  assert.equal((html.match(/data-kp-rising-beat=/g) ?? []).length, reading.beats);
  assert.equal((html.match(/data-kp-annotation-state=/g) ?? []).length, reading.annotations);
  assert.equal((html.match(/data-kp-operation-id=/g) ?? []).length, 3);
});

test("readings cannot silently substitute for each other or select arbitrary files", () => {
  for (const query of [
    '?reading=missing', '?reading=../what-counts',
    '?reading=zero&kpLesson=lesson.algebra.what-counts&kpVersion=2&kpProgress=0',
    '?kpLesson=lesson.algebra.what-counts&kpVersion=zero.1&kpProgress=0'
  ]) assert.throws(() => compileWhatCountsLesson(`/reader/what-counts/${query}`), AnchoredAlgebraGap);
  const original = compileWhatCountsLesson(), zero = compileWhatCountsLesson('/reader/what-counts/?reading=zero');
  const sourceAttribute = (html: string) => html.match(/data-kp-reader-equation-source="([^"]+)"/)?.[1];
  assert.ok(sourceAttribute(original));
  assert.equal(sourceAttribute(zero), sourceAttribute(original));
  for (const version of [readings.whole.version, ''])
    assert.throws(() => registerWhatCountsReadings({ ...readings, zero: { ...readings.zero, version } }), AnchoredAlgebraGap);
  for (const [id, reading] of Object.entries(readings)) {
    const html = compileWhatCountsLesson(`/reader/what-counts/?reading=${encodeURIComponent(id)}`);
    assert.ok(html.includes(`data-kp-version="${reading.version}"`));
    for (const stop of bindAnchoredCommentary(compile(source)).stops) {
      if (!html.includes(`data-kp-annotation-state="${stop.stateId}"`)) continue;
      for (const note of stop.notes) {
        assert.ok(html.includes(note.text)); assert.ok(html.includes(note.detail));
      }
    }
  }
});

test("a situated response preserves only a complete checked original address", () => {
  const original = '/reader/what-counts/?kpLesson=lesson.algebra.what-counts&kpVersion=2&kpProgress=0&kpReading=0.1&kpFocus=state.what-counts.repeated.paint.left-factor#state.what-counts.repeated';
  const response = (returnTo: string) => `/reader/what-counts/?reading=zero&returnTo=${encodeURIComponent(returnTo)}`;
  const html = compileWhatCountsLesson(response(original));
  assert.ok(html.includes(`href="${original.replaceAll('&', '&amp;')}"`));
  assert.ok(html.includes('Return to your question'));
  for (const invalid of [
    '/reader/what-counts/', 'https://example.com/', '//example.com/reader/what-counts/',
    original.replace('/reader/what-counts/', '/reader/solve-fractional-linear/'),
    original.replace('kpVersion=2', 'kpVersion=1'), original.replace('kpReading=0.1', 'kpReading=NaN'),
    original.replace('kpReading=0.1', 'kpReading=2'), original.replace('kpFocus=', 'ignoredFocus='),
    original.replace('left-factor', 'missing'), original.replace('#state.what-counts.repeated', '#missing'),
    original.replace('&kpProgress=0', '&kpCheckpoint=missing&kpProgress=0'),
    original.replace('&kpProgress=0', '&returnTo=nested&kpProgress=0'),
    original.replace('&kpProgress=0', '&revision=stale&kpProgress=0')
  ]) assert.throws(() => compileWhatCountsLesson(response(invalid)),
    (error: unknown) => error instanceof AnchoredAlgebraGap && error.path === 'location.returnTo');
});
