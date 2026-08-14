import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure
} from "../src/animation/asset.ts";
import {
  kpNormalMatrixProofVignetteRegistry,
  kpNormalMatrixProofVignetteRelease
} from "../src/article/vignettes/normal-matrix-proof-vignette.ts";
import {
  createKpNormalMatrixProofAnimationAsset
} from "../src/semantic/normal-matrix-proof-animation-asset.ts";
import { kpNormalMatrixProofCheckpointIds } from
  "../src/semantic/normal-matrix-proof-checkpoints.ts";
import { kpNormalMatrixProofPromptIds } from
  "../src/semantic/normal-matrix-proof-prompts.ts";

test("normal-matrix proof asset closes semantic and timeline references", () => {
  const exemplar = createKpNormalMatrixProofAnimationAsset();

  assert.deepEqual(checkKpAnimationAssetReferenceClosure(exemplar.animation), {
    lawId: "animation.reference-closure",
    passed: true,
    failures: []
  });
  assert.deepEqual(
    exemplar.checkpoints.map(({ id }) => id),
    kpNormalMatrixProofCheckpointIds
  );
  assert.deepEqual(exemplar.prompts.map(({ id }) => id), kpNormalMatrixProofPromptIds);
});

test("versioned vignette exports the local lazy capability and static truth", () => {
  const release = kpNormalMatrixProofVignetteRelease;

  assert.equal(release.version, "1.0.0");
  assert.equal(release.moduleSpecifier, "../../semantic/normal-matrix-proof-animation-asset.ts");
  assert.equal(release.checkpointPaths.length, 6);
  assert.equal(release.transitionPaths.length, 6);
  assert.equal(release.objectPaths.length, 15);
  assert.equal(release.staticProjection?.checkpoints.length, 6);
  assert.equal(release.staticProjection?.transitions.length, 6);
  assert.equal(release.accessibility?.reducedMotion, "direct-checkpoint-seek");
  assert.deepEqual(kpNormalMatrixProofVignetteRegistry, [release]);
});

test("vignette keeps static checkpoint descriptions aligned with semantic endpoints", () => {
  const projection = kpNormalMatrixProofVignetteRelease.staticProjection!;

  for (const checkpointId of kpNormalMatrixProofCheckpointIds) {
    const checkpoint = projection.checkpoints.find(({ id }) => id === checkpointId);
    assert.ok(checkpoint);
    assert.match(checkpoint.assetPath, new RegExp(`${checkpointId}\\.svg$`));
    assert.ok(checkpoint.alt.length > 30);
    assert.ok(checkpoint.caption.endsWith("?"));
  }
});
