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

  assert.equal(transitions.length, 5);
  assert.equal(transitions.filter((id) => id?.startsWith("cohort.")).length, 2);
  assert.match(
    artifact.html,
    /data-kp-reader-cohort-transformations="[^"]+,[^"]+"/
  );
  assert.match(artifact.html, /data-kp-reader-fold-mode/);
  assert.match(artifact.html, /data-kp-reader-fold-node=/);
  assert.equal(
    [...artifact.html.matchAll(
      /data-kp-reader-equation-measurement="true" aria-hidden="true"/g
    )].length,
    5
  );
  assert.match(
    artifact.html,
    /data-kp-reader-equation-material-layer="true"/
  );
  assert.equal(
    [...artifact.html.matchAll(
      /data-kp-reader-accessible-equation-state=/g
    )].length,
    6
  );
  assert.match(
    artifact.html,
    /data-kp-reader-accessible-equation[\s\S]*katex-mathml/
  );
  assert.match(
    artifact.html,
    /data-kp-reader-fold-mode[^>]+aria-describedby="kp-reader-fold-status"/
  );
  assert.doesNotMatch(
    artifact.html,
    /whole-equation-fade|source-out-target-in|crossfade/
  );
});

test("canonical reader policy exposes five visual cohorts for seven operations", () => {
  const animation = foldableDistributionDescriptor.createAnimation();
  const policy = compileKpReaderCanonicalTransitionPolicy({
    descriptor: foldableDistributionDescriptor,
    animation
  });

  assert.equal(animation.transformations.length, 7);
  assert.equal(policy?.transitionIds.length, 5);
  assert.deepEqual(
    policy?.transitionIds.map((id) => id.startsWith("cohort.")),
    [true, true, false, false, false]
  );
});
