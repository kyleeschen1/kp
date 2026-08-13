import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sampleKpSchemeFactorialFullEvaluation } from
  "../src/animation/scheme-factorial-full-evaluation.ts";
import { createKpSchemeFactorialAnimationAsset } from
  "../src/semantic/scheme-factorial-animation-asset.ts";

test("Scheme factorial asset exposes exact compiled endpoints and one timeline", () => {
  const exemplar = createKpSchemeFactorialAnimationAsset();

  assert.equal(exemplar.animation.id, "animation.programming.scheme-factorial");
  assert.equal(exemplar.animation.timeline?.durationMs, 30_000);
  assert.equal(
    exemplar.animation.timeline?.beatCount,
    exemplar.evaluation.transitions.length
  );
  assert.equal(sampleKpSchemeFactorialFullEvaluation(
    exemplar.evaluation, 0).nativeCode, "(factorial 3)");
  assert.equal(sampleKpSchemeFactorialFullEvaluation(
    exemplar.evaluation, 1).nativeCode, "6");
  assert.equal(exemplar.animation.renderTargets[0]?.kind, "programming");
});

test("learner artifact reader cannot import Scheme build authorities", async () => {
  const source = await readFile(
    "src/animation/scheme-factorial-full-evaluation-artifact.ts",
    "utf8"
  );

  assert.match(source, /scheme-factorial-full-evaluation\.generated\.json/);
  assert.doesNotMatch(
    source,
    /scheme-factorial-(?:parser|trace|evaluator|canonical-full-evaluation)/
  );
});
