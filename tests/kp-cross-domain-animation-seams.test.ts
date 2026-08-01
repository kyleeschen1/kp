import assert from "node:assert/strict";
import test from "node:test";

import {
  formatKpDimensionalContinuityDynamicDisplay,
  kpDimensionalContinuityDynamicDisplayRelation
} from "../src/animation/dimensional-continuity-dynamic-display.ts";
import {
  easeKpSynchronizedModelProgress,
  exactKpSynchronizedModelProgress,
  sampleKpSynchronizedModelProjectionProgress
} from "../src/animation/synchronized-model-projection.ts";
import {
  normalizeKpBoundedIntegerQueryParameter,
  readKpBoundedIntegerQueryParameter,
  writeKpBoundedIntegerQueryParameter
} from "../src/editor/bounded-integer-query-parameter.ts";
import {
  createKpDimensionalContinuityGraphPresentationProfile,
  kpDimensionalContinuityGraphLanguageId
} from "../src/rendering/dimensional-continuity-graph-profile.ts";

test("synchronized model projection mirrors forward and rewind exactly", () => {
  const forward = sampleKpSynchronizedModelProjectionProgress(clock(0.37, "forward"));
  const rewind = sampleKpSynchronizedModelProjectionProgress(clock(0.63, "rewind"));
  assert.equal(forward.presentationProgress, 0.37);
  assert.equal(rewind.presentationProgress, forward.presentationProgress);
  assert.deepEqual(exactKpSynchronizedModelProgress(1 / 3), {
    numerator: "333333",
    denominator: "1000000"
  });
  assert.equal(easeKpSynchronizedModelProgress(0.5), 0.5);
});

test("bounded integer query codec omits defaults and preserves unrelated state", () => {
  const parameter = {
    queryKey: "netForce",
    minimum: 1,
    maximum: 5,
    defaultValue: 3
  } as const;
  assert.equal(readKpBoundedIntegerQueryParameter({
    search: "?artifact=physics&netForce=5",
    parameter
  }), 5);
  assert.equal(normalizeKpBoundedIntegerQueryParameter({
    value: 8,
    parameter
  }), 3);
  assert.equal(writeKpBoundedIntegerQueryParameter({
    search: "?artifact=physics&netForce=5",
    parameter,
    value: 3
  }), "?artifact=physics");
});

test("dimensional continuity profile fixes roles and moving display policy", () => {
  const economics = createKpDimensionalContinuityGraphPresentationProfile(
    "economics"
  );
  const physics = createKpDimensionalContinuityGraphPresentationProfile(
    "physics"
  );
  assert.equal(economics.languageId, kpDimensionalContinuityGraphLanguageId);
  assert.equal(physics.languageId, economics.languageId);
  assert.deepEqual(physics.visualRoles, economics.visualRoles);
  assert.equal(formatKpDimensionalContinuityDynamicDisplay({
    numerator: "4",
    denominator: "1"
  }), "4.00");
  assert.equal(kpDimensionalContinuityDynamicDisplayRelation(true), "\\approx");
  assert.equal(kpDimensionalContinuityDynamicDisplayRelation(false), "=");
  assert.throws(
    () => createKpDimensionalContinuityGraphPresentationProfile("Physics UI"),
    /Invalid dimensional-continuity graph domain/
  );
});

function clock(
  progress: number,
  direction: "forward" | "rewind"
) {
  return {
    progress,
    direction,
    elapsedMs: 0,
    beat: 0,
    durationMs: 1,
    beatCount: 1
  } as const;
}
