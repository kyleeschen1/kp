import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpFractionCompositionLessonModel
} from "../src/reader/compiler/fraction-composition-lesson-model.ts";
import {
  kpFractionCompositionPreservationManifest as manifest
} from "../src/reader/compiler/fraction-composition-preservation-manifest.ts";

const markdown = readFileSync(
  new URL("../content/lessons/fraction-composition.md", import.meta.url),
  "utf8"
);

test("fraction composition compiles six narrated checkpoints", () => {
  const model = compileKpFractionCompositionLessonModel(markdown);

  assert.equal(model.document.id, manifest.document.id);
  assert.deepEqual(
    model.story.beats.map(({ checkpoint }) => checkpoint.id),
    [
      "factored",
      "normalized",
      "constant-quotient",
      "difference-simplified",
      "right-product-simplified",
      "solved"
    ]
  );
  assert.deepEqual(
    model.staticMath[0]!.states.map(({ label }) => label),
    [
      "2 divided by 3 times the quantity x plus 6 equals 10",
      "2 times x divided by 3 plus 2 times 6 divided by 3 equals 10",
      "2 times x divided by 3 plus 4 equals 10",
      "2 times x divided by 3 equals 6",
      "2 times x equals 18",
      "x equals 9"
    ]
  );
});

test("fraction narration, annotations, and transcript preserve every operation", () => {
  const model = compileKpFractionCompositionLessonModel(markdown);
  const operationIds = model.transcript.flatMap(
    ({ operationIds }) => operationIds
  );

  assert.equal(operationIds.length, manifest.steps.length);
  assert.equal(new Set(operationIds).size, manifest.steps.length);
  assert.ok(model.transcript.every(({ narration }) => narration.length > 0));
  assert.deepEqual(
    model.annotations.map(({ id }) => id),
    manifest.learningArtifacts.annotationIds
  );
  assert.match(
    model.prose.articleHtml,
    new RegExp(manifest.document.searchableText)
  );
});

test("fraction static article remains native and complete without JavaScript", () => {
  const model = compileKpFractionCompositionLessonModel(markdown);
  const html = model.prose.articleHtml;

  assert.equal(
    (html.match(/data-kp-static-state/g) ?? []).length,
    manifest.learningArtifacts.narratedCheckpointCount
  );
  assert.equal(
    (html.match(/class="katex-mathml"/g) ?? []).length,
    manifest.learningArtifacts.narratedCheckpointCount
  );
  assert.match(html, /Explanation steps/);
  assert.match(html, /Subtract four from both sides/);
  assert.match(html, /Divide by two/);
});
