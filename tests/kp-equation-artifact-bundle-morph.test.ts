import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpRadicalArtifactBundlePlan,
  sampleKpDomArtifactBundleMorph
} from "../src/rendering/equation-artifact-bundle-morph.ts";

const plan = createKpRadicalArtifactBundlePlan({
  id: "bundle.radical",
  sourceTokenId: "source.exponent",
  sourceRect: { left: 60, top: 10, width: 20, height: 12 },
  targetTokenId: "target.radical",
  targetRect: { left: 20, top: 20, width: 40, height: 28 }
});

test("radical bundle plan retains the dashboard fold geometry and grids", () => {
  assert.deepEqual(plan.sourceGrid, { columns: 6, rows: 2 });
  assert.deepEqual(plan.targetGrid, { columns: 10, rows: 2 });
  assert.deepEqual(plan.bundleRect, {
    left: 25.6,
    top: 35.4,
    width: 8,
    height: 6.16
  });
  assert.equal(plan.sourceMotion.kind, "collapse-to-bundle");
  assert.equal(plan.targetMotion.kind, "unfold-from-bundle");
});

test("DOM artifact poses reconcile through the exact same bundle", () => {
  const bundled = sampleKpDomArtifactBundleMorph({
    plan,
    sourceCollapseProgress: 1,
    sourceFadeProgress: 0,
    targetRevealProgress: 0,
    collapseScale: 0.3
  });
  const sourceCenter = {
    x: plan.source.rect.left + plan.source.rect.width / 2 + bundled.sourcePose.x,
    y: plan.source.rect.top + plan.source.rect.height / 2 + bundled.sourcePose.y
  };
  const targetCenter = {
    x: plan.target.rect.left + plan.target.rect.width / 2 + bundled.targetPose.x,
    y: plan.target.rect.top + plan.target.rect.height / 2 + bundled.targetPose.y
  };
  const bundleCenter = {
    x: plan.bundleRect.left + plan.bundleRect.width / 2,
    y: plan.bundleRect.top + plan.bundleRect.height / 2
  };
  assert.ok(Math.abs(sourceCenter.x - bundleCenter.x) < 0.000001);
  assert.ok(Math.abs(sourceCenter.y - bundleCenter.y) < 0.000001);
  assert.ok(Math.abs(targetCenter.x - bundleCenter.x) < 0.000001);
  assert.ok(Math.abs(targetCenter.y - bundleCenter.y) < 0.000001);
  assert.equal(bundled.sourcePose.scale, 0.3);
  assert.equal(bundled.targetPose.scale, 0.3);
});
