import assert from "node:assert/strict";
import test from "node:test";
import { checkMotionObservation, motionObservationExample } from "../src/semantic/motion-observation.ts";
import { compileMotionObservationAsset } from "../src/authoring/motion-observation-authoring.ts";
import { validateKpAnimationAsset, checkKpAnimationAssetSeekRewindLaw } from "../src/animation/asset.ts";

test("motion source traverses governed construction with exact operation and lineage closure", () => {
  const result = checkMotionObservation(motionObservationExample);
  assert.equal(result.status, "checked"); if (result.status !== "checked") return;
  const compiled = compileMotionObservationAsset(result.record);
  assert.deepEqual(validateKpAnimationAsset(compiled.animation), []);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(compiled.animation).passed, true);
  assert.deepEqual(compiled.construction.mathematicalVerification.operations.map(op => op.operationId), ["motion.observe-linear-trip", "motion.change-fixed-origin"]);
  assert.ok(compiled.construction.mathematicalVerification.operations.every(op => op.lineageIds.length === 5 && op.strictLawIds.length === 1));
  assert.throws(() => compileMotionObservationAsset({ ...result.record }), /domain checker/);
});

test("user observation IDs cannot collide with tracked-point role identity", () => {
  const result = checkMotionObservation({ ...motionObservationExample, observations: [
    { id: "point", time: 0, position: 0 }, { id: "end", time: 2, position: 1 }
  ] });
  if (result.status !== "checked") throw new Error(result.expected);
  assert.deepEqual(validateKpAnimationAsset(compileMotionObservationAsset(result.record).animation), []);
});
