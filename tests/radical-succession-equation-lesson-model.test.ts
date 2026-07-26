import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpRadicalSuccessionEquationLessonModel
} from "../src/reader/compiler/radical-succession-equation-lesson-model.ts";
import {
  kpRadicalSuccessionPreservationManifest as manifest
} from "../src/reader/compiler/radical-succession-preservation-manifest.ts";

const markdown = readFileSync(
  new URL("../content/lessons/radical-succession.md", import.meta.url),
  "utf8"
);

test("radical lesson content compiles from existing semantic authority", () => {
  const model = compileKpRadicalSuccessionEquationLessonModel(markdown);

  assert.deepEqual(
    {
      id: model.document.id,
      version: model.document.version,
      title: model.document.title
    },
    {
      id: manifest.document.id,
      version: manifest.document.version,
      title: manifest.document.title
    }
  );
  assert.ok(model.prose.articleHtml.includes(manifest.document.searchableText));
  assert.equal(model.animation.id, manifest.animation.id);
  assert.deepEqual(
    model.animation.bundle.objects.map(({ id }) => id),
    manifest.animation.stateIds
  );
  assert.deepEqual(
    model.animation.transformations.map(({ id }) => id),
    manifest.animation.transformationIds
  );
});

test("radical lesson checkpoints and focus cover the preservation contract", () => {
  const model = compileKpRadicalSuccessionEquationLessonModel(markdown);
  const block = model.hydration.blocks[0]!;

  assert.deepEqual(
    block.checkpoints.map(({ beatId, progressPermille }) => ({
      beatId,
      progressPermille
    })),
    manifest.checkpoints
  );
  assert.deepEqual(
    [...new Set(model.resolved.focus.map(({ objectRef }) => objectRef))].sort(),
    [...manifest.focusSelectorIds].sort()
  );
  assert.equal(block.adapterId, "renderer.equation-dom");
  assert.equal(block.presentation, "scroll-scrub");
  assert.equal(block.attention, undefined);
});
