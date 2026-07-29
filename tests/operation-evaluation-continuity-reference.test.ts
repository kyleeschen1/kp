import assert from "node:assert/strict";
import test from "node:test";

import {
  kpOperationEvaluationContinuityReference as reference
} from "../src/animation/operation-evaluation-continuity-reference.ts";

test("operation evaluation continuity freezes one canonical compiler contract", () => {
  assert.equal(
    reference.schemaVersion,
    "kp.operation-evaluation-continuity-reference.v1"
  );
  assert.equal(reference.canonicalExemplar.sourceLatex, "1 + 2");
  assert.equal(reference.canonicalExemplar.targetLatex, "3");
  assert.deepEqual(
    reference.requiredConformanceCallers.map(({ id }) => id),
    [
      "kp.operation-evaluation.caller.one-plus-two",
      "kp.operation-evaluation.caller.five-plus-two",
      "kp.operation-evaluation.caller.three-sixths"
    ]
  );
  assert.equal(
    new Set(
      reference.requiredConformanceCallers.map(
        ({ transformationKind }) => transformationKind
      )
    ).size,
    2
  );
});

test("continuity permits only equivalent paint or one shared zero-area junction", () => {
  assert.equal(reference.ownership.policy, "exclusive-continuous-carrier");
  assert.deepEqual(reference.ownership.legalTransfer, [
    "paint-equivalent-pose",
    "shared-zero-area-junction"
  ]);
  assert.equal(reference.ownership.nonZeroPaintOpacity, 1);
  assert.equal(reference.ownership.nativeEndpointAuthority, true);
  assert.equal(reference.renderer.newRendererAllowed, false);
  assert.equal(
    reference.renderer.unsupportedPresentation,
    "explicit-static-checkpoint"
  );
});

test("callers cannot author presentation mechanics or compress readable action", () => {
  assert.deepEqual(reference.temporalSampling.browserEngines, [
    "chromium",
    "firefox",
    "webkit"
  ]);
  assert.ok(reference.temporalSampling.epsilonProgress > 0);
  assert.ok(reference.pacing.minimumActionDurationMs >= 1_100);
  assert.deepEqual(reference.forbiddenCallerAuthority, [
    "opacity",
    "paint-policy",
    "path-family",
    "handoff-progress",
    "scheduler",
    "dom",
    "pixel-geometry",
    "keyframes",
    "duration"
  ]);
  assert.ok(reference.preservation.includes("exact-seek-and-rewind"));
  assert.ok(reference.preservation.includes("one-runtime-clock-and-session"));
});
