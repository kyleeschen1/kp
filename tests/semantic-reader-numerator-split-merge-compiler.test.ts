import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpNumeratorSplitMergeEquationLesson } from "../src/reader/compiler/public-api.ts";

const markdown = readFileSync(
  new URL("../content/lessons/numerator-split-merge.md", import.meta.url),
  "utf8"
);

test("numerator split-merge lesson compiles as searchable static math and a hydrated round trip", () => {
  const artifact = compileKpNumeratorSplitMergeEquationLesson(markdown);

  assert.equal(artifact.document.id, "lesson.fractions.numerator-split-merge");
  assert.match(artifact.html, /data-kp-reader-lesson-variant="numerator-split-merge"/);
  assert.match(artifact.html, /One denominator can govern every term/);
  assert.match(artifact.html, /application\/x-tex">\\frac\{2x \+ 6\}\{2\}/);
  assert.match(artifact.html, /application\/x-tex">\\frac\{2x\}\{2\} \+ \\frac\{6\}\{2\}/);
  assert.match(artifact.html, /anchor\.equation\.numerator-split-merge\.split\.left\.fraction\.denominator\.2/);
  assert.equal(artifact.hydration.blocks[0]?.checkpoints.length, 3);
  assert.equal(
    artifact.hydration.blocks[0]?.asset.id,
    "animation.numerator-split-merge.round-trip"
  );
});
