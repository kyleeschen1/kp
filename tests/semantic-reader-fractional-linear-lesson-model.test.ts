import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpFractionalLinearEquationLessonModel
} from "../src/reader/compiler/fractional-linear-equation-lesson-model.ts";

const markdown = readFileSync(
  new URL("../content/lessons/solve-fractional-linear.md", import.meta.url),
  "utf8"
);

test("fractional lesson compiles searchable prose and seven static math states", () => {
  const model = compileKpFractionalLinearEquationLessonModel(markdown);
  assert.equal(model.document.id, "lesson.solve-x.fractional-linear");
  assert.equal(model.hydration.blocks[0]?.checkpoints.length, 7);
  assert.equal(model.hydration.blocks[0]?.attention, undefined);
  assert.match(model.prose.articleHtml, /The fraction is not a detour/);
  assert.match(model.prose.articleHtml, /Multiply both sides by two/);
  assert.match(model.prose.articleHtml, /application\/x-tex">\\frac\{x\}\{2\} = 4/);
  assert.match(model.prose.articleHtml, /application\/x-tex">x = 8/);
});
