import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpFractionalLinearEquationLesson
} from "../src/reader/compiler/public-api.ts";

const markdown = readFileSync(
  new URL("../content/lessons/solve-fractional-linear.md", import.meta.url),
  "utf8"
);

test("fractional lesson compiles into the shared searchable equation card", () => {
  const artifact = compileKpFractionalLinearEquationLesson(markdown);

  assert.equal(artifact.kind, "compiled-lesson");
  assert.equal(artifact.document.id, "lesson.solve-x.fractional-linear");
  assert.match(artifact.html, /^<!doctype html>/);
  assert.match(artifact.html, /data-kp-reader-lesson-variant="fractional-linear"/);
  assert.match(artifact.html, /data-kp-reader-exemplar-template/);
  assert.match(artifact.html, /The fraction is not a detour/);
  assert.match(artifact.html, /<math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML"/);
  assert.match(artifact.html, /application\/x-tex">\\frac\{x\}\{2\} \+ 3 = 7/);
  assert.match(artifact.html, /application\/x-tex">x = 8/);
  assert.match(
    artifact.html,
    /anchor\.equation\.fractional-linear\.initial\.fraction\.numerator\.x/
  );
  assert.equal(artifact.hydration.blocks[0]?.checkpoints.length, 7);
  assert.equal(
    artifact.hydration.blocks[0]?.asset.id,
    "animation.fractional-linear.solve-x-over-2"
  );
});

test("shared page extraction preserves the canonical solve-x compiler", async () => {
  const { compileKpXPlusThreeLesson } = await import(
    "../src/reader/compiler/public-api.ts"
  );
  const solveX = readFileSync(
    new URL("../content/lessons/solve-x.md", import.meta.url),
    "utf8"
  );
  const artifact = compileKpXPlusThreeLesson(solveX);
  assert.match(artifact.html, /data-kp-reader-lesson-variant="streamlined"/);
  assert.match(artifact.html, /anchor\.equation\.linear-solve\.initial\.lhs\.x/);
});
