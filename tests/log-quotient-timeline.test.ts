import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpSemanticMotionChoreography
} from "../src/domain-ir/public-api.ts";
import {
  kpCanonicalCompiledLogQuotientSemanticMotion,
  kpCanonicalLogQuotientSemanticMotionRequest
} from "../src/semantic/log-quotient-semantic-motion.ts";

function sample(input: {
  readonly progress: number;
  readonly direction?: "forward" | "rewind";
  readonly reducedMotion?: boolean;
}) {
  return sampleKpSemanticMotionChoreography({
    choreography: kpCanonicalCompiledLogQuotientSemanticMotion,
    progress: input.progress,
    direction: input.direction ?? "forward",
    reducedMotion: input.reducedMotion
  });
}

test("log-quotient enters through compiler authority without temporal padding", () => {
  assert.equal(
    kpCanonicalCompiledLogQuotientSemanticMotion.recipeId,
    "recipe.semantic-motion.log-quotient-fusion.v1"
  );
  assert.equal(
    kpCanonicalCompiledLogQuotientSemanticMotion.compilation.transformationId,
    kpCanonicalLogQuotientSemanticMotionRequest.operation.transformationId
  );
  for (let index = 0; index <= 100; index += 1) {
    const progress = index / 100;
    const first = sample({ progress });
    const second = sample({ progress });
    assert.deepEqual(first, second);
    assert.equal(first.semanticProgress, progress);
  }
});

test("rewind resolves the same semantic frame in the opposite direction", () => {
  for (const progress of [0, 0.125, 0.5, 0.875, 1]) {
    const rewind = sample({
      progress,
      direction: "rewind"
    });
    const forward = sample({ progress: 1 - progress });
    assert.equal(rewind.semanticProgress, forward.semanticProgress);
  }
});

test("reduced motion snaps to native endpoints and invalid input is rejected", () => {
  assert.equal(sample({
    progress: 0.49,
    reducedMotion: true
  }).semanticProgress, 0);
  assert.equal(sample({
    progress: 0.5,
    reducedMotion: true
  }).semanticProgress, 1);
  assert.throws(
    () => sample({ progress: Number.NaN }),
    /must be finite/
  );
});
