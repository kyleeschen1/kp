import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { kpAnimationPerformanceTargets } from
  "../src/animation/performance-budget.ts";
import { kpAnimationLibraryBundleBoundary } from
  "../scripts/check-animation-library-bundle-boundary.ts";
import baseline from
  "./fixtures/matrix-linear-map-rank6-baseline.json" with { type: "json" };

test("rank-6 baseline freezes authority owners and production ceilings", async () => {
  assert.equal(
    baseline.schemaVersion,
    "kp.matrix-linear-map-rank6-baseline.v1"
  );
  assert.equal(
    baseline.canonicalAnimationId,
    "animation.generated.linear-algebra.matrix-vector.two-by-two"
  );
  assert.deepEqual(baseline.bundleLimitsGzipBytes, {
    outer: kpAnimationLibraryBundleBoundary.outerGzipBytes,
    mainHost: kpAnimationLibraryBundleBoundary.mainHostGzipBytes,
    measuredCatalogueRouteScript:
      kpAnimationLibraryBundleBoundary.measuredCatalogueRouteScriptGzipBytes,
    placeValueIncremental:
      kpAnimationLibraryBundleBoundary.placeValueIncrementalGzipBytes
  });
  assert.deepEqual(baseline.performanceLimits, {
    initialScriptTransferBytes:
      kpAnimationPerformanceTargets.initialScriptTransferBytes,
    constrainedHydrationMs:
      kpAnimationPerformanceTargets.constrainedHydrationMs,
    constrainedFrameP95Ms:
      kpAnimationPerformanceTargets.constrainedFrameP95Ms,
    constrainedFrameMaxMs:
      kpAnimationPerformanceTargets.constrainedFrameMaxMs,
    longestTaskMs: kpAnimationPerformanceTargets.longestTaskMs,
    lcpMs: kpAnimationPerformanceTargets.lcpMs,
    cls: kpAnimationPerformanceTargets.cls,
    interactionPaintMs: kpAnimationPerformanceTargets.interactionPaintMs,
    initialThreeRequested: kpAnimationPerformanceTargets.initialThreeRequested
  });

  for (const owner of baseline.authorityOwners) {
    const source = await readFile(owner.path, "utf8");
    assert.ok(
      source.includes(owner.authorityToken),
      `${owner.role} moved away from ${owner.path}`
    );
  }
});

test("rank-6 semantic animation authority remains framework neutral", async () => {
  for (const path of baseline.frameworkNeutralPaths) {
    const source = await readFile(path, "utf8");
    assert.doesNotMatch(
      source,
      /(?:from\s+["']svelte|\.svelte["'])/,
      `${path} must not depend on Svelte composition`
    );
  }
});
