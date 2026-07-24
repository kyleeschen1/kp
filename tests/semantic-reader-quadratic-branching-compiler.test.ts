import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileKpQuadraticBranchingLesson
} from "../src/reader/compiler/public-api.ts";

test("quadratic lesson compiles through the shared reader shell", async () => {
  const markdown = await readFile("content/lessons/quadratic-branching.md", "utf8");
  const artifact = compileKpQuadraticBranchingLesson(markdown);
  assert.equal(artifact.document.id, "lesson.algebra.quadratic-branching");
  assert.match(artifact.html, /data-kp-reader="quadratic-branching"/);
  assert.match(artifact.html, /renderer\.quadratic-native-katex/);
  assert.match(artifact.html, /data-kp-equation-method="completing-square"/);
  assert.match(artifact.html, /data-kp-equation-method="formula"/);
  assert.match(artifact.html, /complete solution set/);
  assert.doesNotMatch(artifact.html, /webgl|three\.js/i);
});
