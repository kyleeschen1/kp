import assert from "node:assert/strict";
import test from "node:test";
import { compileExpression } from "../src/math/expression.ts";
import { checkGradientExplanation, checkGradientExplanationText, gradientContourVariant, type CheckedGradientExplanation } from "../src/tutorial/gradient-contour/gradient-contour-authoring.ts";
import { gradientContourPrimary } from "../src/tutorial/gradient-contour/gradient-contour-model.ts";
import { gradientBeatIndex, gradientContourBeats } from "../src/tutorial/gradient-contour/gradient-contour-story.ts";
import { renderKpSurfaceContourStage } from "../src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-stage.ts";
import { createKpSurfaceContourModel } from "../src/tutorial/kinetic-figure-surface-contour/kinetic-figure-surface-contour-model.ts";

const checked = (value: unknown): CheckedGradientExplanation => {
  const result = checkGradientExplanation(value);
  if (result.status !== "checked") throw new Error(result.expected);
  return result.lesson;
};
test("primary and unequal-slope caller share one expression for paint, contours, slopes and notation", () => {
  for (const source of [gradientContourPrimary, gradientContourVariant]) {
    const { authority, sequence } = checked(source), model = sequence.model;
    assert.equal(authority.field, model.field);
    const surface = authority.scene3d.find(item => item.type === "surface-3d");
    assert.ok(surface?.type === "surface-3d");
    assert.equal(surface.expression, model.field.expression);
    const evaluate = compileExpression(surface.expression);
    for (const point of authority.field.contour(model.level)) {
      assert.ok(Math.abs(evaluate(point) - model.level) < 1e-12);
      assert.ok(Math.abs(model.height(point) - point.z) < 1e-12);
    }
    assert.equal(evaluate({ ...source.point }), model.level);
    const html = renderKpSurfaceContourStage({ model: createKpSurfaceContourModel(), authority });
    assert.ok(html.includes(model.latex.replaceAll("&", "&amp;")));
    assert.equal(authority.fitPlan.status, "fitted");
  }
});
test("variant evidence turns toward its actual gradient, starts on its contour, and seeks reversibly", () => {
  const { sequence } = checked(gradientContourVariant);
  const sample = (slug: Parameters<typeof gradientBeatIndex>[0]) => sequence.sample(gradientBeatIndex(slug) / (sequence.beats.length - 1));
  const origin = sample("height").point;
  assert.ok(Math.abs(origin.x - .75) < 1e-12 && Math.abs(origin.y - .5) < 1e-12);
  assert.deepEqual(sequence.model.atPoint.gradient, { x: 3, y: 1 });
  assert.ok(Math.abs(sample("across").slope - Math.sqrt(10)) < 1e-12);
  assert.ok(Math.abs(sample("level").slope) < 1e-12);
  const end = sample("prediction"); sequence.sample(.17); sequence.sample(.88);
  assert.deepEqual(sample("prediction"), end);
  for (let i = 0; i <= 200; i++) assert.ok(Math.abs(sequence.sample(i / 200).height - 1.375) < 1e-12);
});
test("source-only prose preserves the primary but removes its equal-slope shortcut from variants", () => {
  assert.equal(checked(gradientContourPrimary).sequence.beats, gradientContourBeats);
  const { sequence } = checked(gradientContourVariant);
  assert.ok(sequence.beats.find(beat => beat.slug === "gradient")!.html.includes("(3,1)"));
  assert.ok(sequence.beats.find(beat => beat.slug === "contour")!.html.includes("1.375"));
  assert.ok(!sequence.reading.prepare.body.includes("northeast"));
  assert.deepEqual(sequence.beats.map(beat => beat.slug), gradientContourBeats.map(beat => beat.slug));
});
test("source roundtrip retains one complete checked explanation and does not alias drafts", () => {
  const draft = { ...gradientContourVariant, point: { x: Number(gradientContourVariant.point.x), y: Number(gradientContourVariant.point.y) } }, first = checked(draft);
  draft.point.x = 1;
  assert.equal(first.sequence.model.source.point.x, .75);
  const result = checkGradientExplanationText(first.sourceText);
  assert.equal(result.status, "checked");
  if (result.status === "checked") assert.equal(result.lesson.sourceText, first.sourceText);
});
test("untrusted and mathematically valid but unauthored cases yield located repair gaps", () => {
  for (const value of [null, { ...gradientContourVariant, a: Infinity }, { ...gradientContourVariant, b: 0 },
    { ...gradientContourVariant, point: { x: 0, y: 0 } }, { ...gradientContourVariant, point: { x: -.75, y: .5 } },
    { ...gradientContourVariant, point: { x: .01, y: .01 } }, { ...gradientContourVariant, point: { x: 1.5, y: 1.5 } },
    { ...gradientContourVariant, camera: "invented" }]) {
    const result = checkGradientExplanation(value);
    assert.equal(result.status, "repair");
    if (result.status === "repair") assert.ok(result.path.startsWith("$"));
  }
  assert.equal(checkGradientExplanationText("{").status, "repair");
});
