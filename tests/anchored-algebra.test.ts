import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import source from "../content/authoring/algebra/what-counts.json" with { type: "json" };
import { compile } from "../src/authoring/algebra/compile.ts";
import { AnchoredAlgebraGap, bindAnchoredCommentary } from "../src/reader/app/what-counts-commentary.ts";
import { compileWhatCountsLesson } from "../scripts/what-counts-reader-page.ts";
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

test("the complete baseline survives reader translation in its original order", () => {
  const baseline = parseKpLessonMarkdown({
    sourceId: "explanation-first-baseline", id: "lesson.baseline", version: "1", title: "Baseline",
    markdown: readFileSync(new URL("../docs/project/reviews/2026-11-08-explanation-first-baseline.md", import.meta.url), "utf8")
  });
  const html = compileWhatCountsLesson();
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
  assert.match(html, /data-kp-version="2"/);
  assert.equal((html.match(/data-kp-rising-beat=/g) ?? []).length, 10);
  assert.equal((html.match(/data-kp-operation-id=/g) ?? []).length, 3);
});
