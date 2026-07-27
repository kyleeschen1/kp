import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpFoldableDistributionLessonModel
} from "../src/reader/compiler/foldable-distribution-lesson-model.ts";
import {
  kpFoldableDistributionPreservationManifest as manifest
} from "../src/reader/compiler/foldable-distribution-preservation-manifest.ts";

const markdown = readFileSync(
  new URL("../content/lessons/foldable-distribution.md", import.meta.url),
  "utf8"
);

test("foldable distribution content compiles five narrated checkpoints", () => {
  const model = compileKpFoldableDistributionLessonModel(markdown);

  assert.equal(model.document.id, manifest.document.id);
  assert.equal(model.document.title, manifest.document.title);
  assert.deepEqual(
    model.story.beats.map(({ checkpoint }) => checkpoint.id),
    [
      "factored",
      "distributed",
      "products-evaluated",
      "grouped",
      "collected"
    ]
  );
  assert.deepEqual(
    model.staticMath[0]!.states.map(({ latex }) => latex),
    [
      "3(x + 2) + 2(x - 1)",
      "3x + 3 \\cdot 2 + 2x + 2 \\cdot (-1)",
      "3x + 6 + 2x - 2",
      "(3x + 2x) + (6 - 2)",
      "5x + 4"
    ]
  );
});

test("foldable distribution transcript discloses every operation", () => {
  const model = compileKpFoldableDistributionLessonModel(markdown);
  const operationIds = model.transcript.flatMap(
    ({ operationIds }) => operationIds
  );

  assert.equal(operationIds.length, 6);
  assert.equal(new Set(operationIds).size, 6);
  assert.ok(model.transcript.every(({ narration }) => narration.length > 0));
  assert.match(model.prose.articleHtml, new RegExp(manifest.document.searchableText));
  assert.match(model.prose.articleHtml, /data-kp-static-state/);
});

test("foldable distribution static output remains useful without JavaScript", () => {
  const model = compileKpFoldableDistributionLessonModel(markdown);
  const html = model.prose.articleHtml;

  assert.equal((html.match(/data-kp-static-state/g) ?? []).length, 5);
  assert.equal((html.match(/<math\b/g) ?? []).length, 5);
  assert.equal((html.match(/class="katex-mathml"/g) ?? []).length, 5);
  assert.match(html, /Explanation steps/);
  assert.match(html, /Evaluate the constant products/);
});
