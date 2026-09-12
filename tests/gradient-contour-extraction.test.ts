import assert from "node:assert/strict";
import test from "node:test";
import { checkGradientExplanation, gradientContourVariant } from "../src/tutorial/gradient-contour/gradient-contour-authoring.ts";
import { gradientContourPrimary } from "../src/tutorial/gradient-contour/gradient-contour-model.ts";
import { extractGradientTangent, gradientTangentAddress, pinGradientPosition, readGradientTangentAddress, resolveGradientPosition } from "../src/tutorial/gradient-contour/gradient-contour-extraction.ts";
import { projectGradientReading } from "../src/tutorial/gradient-contour/gradient-contour-readings.ts";

const compile = (source: unknown) => { const result = checkGradientExplanation(source); if (result.status !== "checked") throw new Error(result.expected); return result.lesson; };
test("tangent extraction preserves exact fractional return and semantic neighbors", () => {
  const lesson = compile(gradientContourPrimary);
  for (const progress of [0, .137813, 9.43 / 18, 1]) {
    const extraction = extractGradientTangent(lesson, progress);
    assert.equal(resolveGradientPosition(lesson, extraction.returnTo).progress, progress);
    const restored = readGradientTangentAddress(gradientTangentAddress(extraction));
    assert.equal(restored.status, "checked");
    if (restored.status === "checked") {
      assert.equal(restored.lesson.revisionId, lesson.revisionId);
      assert.deepEqual(restored.extraction, extraction);
      assert.deepEqual(restored.lesson.sequence.sample(progress), lesson.sequence.sample(progress));
    }
  }
});
test("stale revisions, forged intervals and nonfinite returns cannot restore into another lesson", () => {
  const original = compile(gradientContourPrimary), variant = compile(gradientContourVariant);
  const position = pinGradientPosition(original, .4);
  assert.throws(() => resolveGradientPosition(variant, position), /revision/);
  assert.throws(() => resolveGradientPosition(original, { ...position, from: "height" }), /semantic interval/);
  assert.throws(() => resolveGradientPosition(original, { ...position, timelineAuthority: "clock" }), /semantic interval/);
  for (const progress of [-1, 2, NaN, Infinity]) assert.throws(() => pinGradientPosition(original, progress));
  const forged = { ...extractGradientTangent(original, .4), source: gradientContourVariant };
  assert.equal(readGradientTangentAddress(gradientTangentAddress(forged)).status, "repair");
  for (const address of ["#gradient={", "#gradient={}&gradient={}", "#other=1", "#" + "x".repeat(8001)]) assert.equal(readGradientTangentAddress(address).status, "repair");
});
test("full and independent readings use Article, retain context and separate exact contour from tangent prediction", () => {
  for (const source of [gradientContourPrimary, gradientContourVariant]) {
    const lesson = compile(source);
    for (const mode of ["full", "tangent"] as const) {
      const reading = projectGradientReading(lesson, mode);
      assert.equal(reading.revisionId, lesson.revisionId);
      assert.ok(reading.html.includes("<math"));
      assert.ok(reading.html.includes("partial derivative"));
      assert.ok(reading.html.includes("stationary point"));
      assert.ok(reading.html.includes("Before revealing"));
      assert.ok(reading.answer.includes("quarters"));
      assert.ok(!reading.html.includes("<canvas"));
      if (mode === "tangent") {
        assert.ok(reading.html.includes("chain rule"));
        assert.ok(reading.html.includes("quadratic term remains positive"));
        assert.ok(reading.html.includes("Halving the step quarters"));
      }
    }
  }
});
