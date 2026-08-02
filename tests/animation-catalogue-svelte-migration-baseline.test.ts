import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { kpAnimationPerformanceTargets } from
  "../src/animation/performance-budget.ts";
import { kpAnimationLibraryBundleBoundary } from
  "../scripts/check-animation-library-bundle-boundary.ts";
import baseline from
  "./fixtures/animation-catalogue-svelte-migration-baseline.json" with
  { type: "json" };

test("Svelte migration baseline freezes catalogue ownership and ceilings", async () => {
  assert.equal(
    baseline.schemaVersion,
    "kp.animation-catalogue-svelte-migration-baseline.v1"
  );
  assert.equal(
    baseline.canonicalAnimationId,
    "animation.dot-projection.basic"
  );
  assert.deepEqual(baseline.regions, ["rail", "stage", "inspector"]);
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

  const [
    application,
    selectionPreparation,
    capabilityHost,
    shell,
    bootstrap
  ] = await Promise.all([
    readFile(baseline.rollbackEntry, "utf8"),
    readFile(
      "src/editor/animation-catalogue-selection-preparation.ts",
      "utf8"
    ),
    readFile("src/editor/selected-surface-capability-host.ts", "utf8"),
    readFile("src/editor/animation-catalogue-shell.ts", "utf8"),
    readFile("src/bootstrap.ts", "utf8")
  ]);
  const lifecycleSource = [
    application,
    selectionPreparation,
    capabilityHost
  ].join("\n");
  for (const owner of baseline.lifecycleOwners) {
    const migratedOwner = baseline.lifecycleOwnerMigrations[
      owner as keyof typeof baseline.lifecycleOwnerMigrations
    ] ?? owner;
    assert.ok(
      lifecycleSource.includes(migratedOwner),
      `missing lifecycle owner ${owner} (${migratedOwner})`
    );
  }
  for (const selector of baseline.requiredSelectors) {
    assert.ok(shell.includes(selector), `missing shell selector ${selector}`);
  }
  for (const action of baseline.requiredActions) {
    assert.ok(shell.includes(action), `missing shell action ${action}`);
  }
  // The imperative entry remains the independent rollback path until the
  // approved Svelte exemplar passes human review.
  assert.match(
    bootstrap,
    /import\(\s*"\.\/editor\/animation-catalogue-application\.ts"\s*\)/
  );
});
