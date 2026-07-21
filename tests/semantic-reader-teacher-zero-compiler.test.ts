import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createLinearSolveTeacherZeroAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  checkKpAnimationAssetSeekRewindLaw,
  compileKpAnimationAssetSemanticRefs
} from "../src/animation/asset.ts";
import { compileKpXPlusThreeTeacherZeroLesson } from "../src/reader/compiler/public-api.ts";

const markdown = readFileSync(
  new URL("../content/lessons/solve-x-teacher-zero.md", import.meta.url),
  "utf8"
);

test("teacher detail compiles an explicit searchable zero beat", () => {
  const artifact = compileKpXPlusThreeTeacherZeroLesson(markdown);

  assert.equal(artifact.document.id, "lesson.solve-x.x-plus-3.teacher-zero");
  assert.equal(artifact.hydration.blocks[0]?.checkpoints.length, 5);
  assert.equal(
    artifact.hydration.blocks[0]?.asset.id,
    "animation.linear-solve.solve-x.teacher-zero"
  );
  assert.match(artifact.html, /data-kp-reader-lesson-variant="teacher-zero"/);
  assert.match(artifact.html, /Make the zero visible/);
  assert.match(artifact.html, /x plus zero equals seven minus three/);
  assert.match(artifact.html, /application\/x-tex">x \+ 0 = 7 - 3/);
  assert.match(artifact.html, /data-kp-static-state data-kp-progress="500" hidden/);
  assert.match(artifact.html, /data-kp-beat="beat\.remove-zero"[^>]+data-kp-checkpoint="750"/);
});

test("teacher animation owns four closed, ordered transformations", () => {
  const animation = createLinearSolveTeacherZeroAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  const rewindLaw = checkKpAnimationAssetSeekRewindLaw(animation);

  assert.deepEqual(refs.diagnostics, []);
  assert.equal(rewindLaw.passed, true);
  assert.deepEqual(rewindLaw.failures, []);
  assert.deepEqual(
    animation.transformations.map(({ id }) => id),
    [
      "transform.linear-solve.subtract-both-sides-3",
      "transform.linear-solve.expose-left-zero",
      "transform.linear-solve.remove-left-zero",
      "transform.linear-solve.simplify-right-difference"
    ]
  );
});
