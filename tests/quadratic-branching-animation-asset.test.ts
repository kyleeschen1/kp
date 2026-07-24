import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  createCanonicalKpQuadraticAnimation,
  kpQuadraticBranchingAnimationId,
  kpQuadraticBranchingTimelineId,
  sampleKpCanonicalQuadraticAnimation
} from "../src/animation/quadratic-branching-asset.ts";
import { validateKpSampledFrameEnvelope } from "../src/animation/sampled-frame-envelope.ts";

test("canonical quadratic animation is a valid renderer-neutral asset", () => {
  const asset = createCanonicalKpQuadraticAnimation();
  assert.equal(asset.animation.id, kpQuadraticBranchingAnimationId);
  assert.deepEqual(validateKpAnimationAsset(asset.animation), []);
  assert.equal(checkKpAnimationAssetReferenceClosure(asset.animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(asset.animation).passed, true);
  assert.deepEqual(asset.animation.renderTargets, []);
  assert.deepEqual(asset.inspection.concreteRendererDependencies, []);
});

test("one shared clock covers both explicit method paths", () => {
  const asset = createCanonicalKpQuadraticAnimation();
  assert.equal(asset.animation.timeline?.id, kpQuadraticBranchingTimelineId);
  assert.deepEqual(asset.inspection.methodIds, [
    "method.quadratic.completing-square",
    "method.quadratic.formula"
  ]);
  assert.equal(asset.inspection.sharedClockId, kpQuadraticBranchingTimelineId);
  assert.ok(asset.inspection.checkpointIds.length > 10);
});

test("sampled frames attach typed equation payloads and semantic activity", () => {
  const asset = createCanonicalKpQuadraticAnimation();
  const envelope = sampleKpCanonicalQuadraticAnimation({
    asset,
    methodId: "method.quadratic.formula",
    progress: 0.72
  });
  assert.deepEqual(validateKpSampledFrameEnvelope(envelope), []);
  assert.equal(envelope.payload?.domain, "equation");
  assert.equal(envelope.payload?.surface, "custom");
  assert.deepEqual(
    envelope.payload?.objects.map(({ objectId }) => objectId),
    envelope.activity.semanticObjectIds
  );
});

test("sampling is deterministic and mirrored under rewind", () => {
  const asset = createCanonicalKpQuadraticAnimation();
  const methodId = "method.quadratic.completing-square";
  const direct = sampleKpCanonicalQuadraticAnimation({
    asset,
    methodId,
    progress: 0.37
  });
  assert.deepEqual(
    direct,
    sampleKpCanonicalQuadraticAnimation({
      asset,
      methodId,
      progress: 0.37
    })
  );
  const rewind = sampleKpCanonicalQuadraticAnimation({
    asset,
    methodId,
    progress: 0.63,
    direction: "rewind"
  });
  assert.equal(rewind.activity.phaseId, direct.activity.phaseId);
  assert.deepEqual(
    rewind.activity.semanticObjectIds,
    direct.activity.semanticObjectIds
  );
});

test("inspection data accounts for every semantic asset object", () => {
  const asset = createCanonicalKpQuadraticAnimation();
  assert.equal(
    asset.inspection.semanticEntityCount,
    asset.animation.bundle.objects.length
  );
  assert.equal(asset.inspection.rendererNeutral, true);
});

test("canonical quadratic asset is JSON-stable", () => {
  const asset = createCanonicalKpQuadraticAnimation();
  assert.deepEqual(JSON.parse(JSON.stringify(asset)), asset);
});
