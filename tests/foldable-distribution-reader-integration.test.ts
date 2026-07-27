import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileKpFoldableDistributionEquationLesson
} from "../src/reader/compiler/foldable-distribution-equation-lesson.ts";
import {
  foldableDistributionDescriptor
} from "../src/reader/app/equation-lesson-descriptors/foldable-distribution.ts";
import {
  compileKpReaderCanonicalTransitionPolicy
} from "../src/reader/app/equation-lesson-descriptor.ts";

const markdown = await readFile(
  new URL("../content/lessons/foldable-distribution.md", import.meta.url),
  "utf8"
);

test("foldable distribution compiles one canonical native scene per phase", () => {
  const artifact = compileKpFoldableDistributionEquationLesson(markdown);
  const transitions = [
    ...artifact.html.matchAll(/data-kp-reader-transition="([^"]+)"/g)
  ].map((match) => match[1]);

  assert.equal(transitions.length, 4);
  assert.equal(transitions.filter((id) => id?.startsWith("cohort.")).length, 2);
  assert.match(
    artifact.html,
    /data-kp-reader-cohort-transformations="[^"]+,[^"]+"/
  );
  assert.match(artifact.html, /data-kp-reader-fold-mode/);
  assert.match(artifact.html, /data-kp-reader-fold-node=/);
  assert.doesNotMatch(
    artifact.html,
    /whole-equation-fade|source-out-target-in|crossfade/
  );
});

test("canonical reader policy exposes four visual cohorts for six operations", () => {
  const animation = foldableDistributionDescriptor.createAnimation();
  const policy = compileKpReaderCanonicalTransitionPolicy({
    descriptor: foldableDistributionDescriptor,
    animation
  });

  assert.equal(animation.transformations.length, 6);
  assert.equal(policy?.transitionIds.length, 4);
  assert.deepEqual(
    policy?.transitionIds.map((id) => id.startsWith("cohort.")),
    [true, true, false, false]
  );
});
