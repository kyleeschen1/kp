import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpDivideBothSidesEquationLesson } from "../src/reader/compiler/public-api.ts";

const markdown = readFileSync(
  new URL("../content/lessons/divide-both-sides.md", import.meta.url),
  "utf8"
);

test("divide-both-sides lesson compiles as searchable static math and a hydrated exemplar", () => {
  const artifact = compileKpDivideBothSidesEquationLesson(markdown);

  assert.equal(artifact.document.id, "lesson.solve-x.divide-both-sides");
  assert.match(artifact.html, /data-kp-reader-lesson-variant="divide-both-sides"/);
  assert.match(artifact.html, /One equal move can uncover the unknown/);
  assert.match(artifact.html, /application\/x-tex">3x = 12/);
  assert.match(artifact.html, /application\/x-tex">\\frac\{3x\}\{3\} = \\frac\{12\}\{3\}/);
  assert.match(artifact.html, /application\/x-tex">x = 4/);
  assert.match(artifact.html, /anchor\.equation\.divide-both-sides\.divided\.lhs\.fraction\.denominator\.3/);
  assert.equal(artifact.hydration.blocks[0]?.checkpoints.length, 4);
  assert.equal(
    artifact.hydration.blocks[0]?.asset.id,
    "animation.divide-both-sides.solve-3x-equals-12"
  );
});
