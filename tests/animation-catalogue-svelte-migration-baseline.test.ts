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
    component,
    entry,
    selectionPreparation,
    capabilityHost,
    playerHost,
    shell,
    bootstrap
  ] = await Promise.all([
    readFile(
      "src/editor/svelte-catalogue/KpSvelteCatalogueExemplar.svelte",
      "utf8"
    ),
    readFile(
      "src/editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts",
      "utf8"
    ),
    readFile(
      "src/editor/animation-catalogue-selection-preparation.ts",
      "utf8"
    ),
    readFile("src/editor/selected-surface-capability-host.ts", "utf8"),
    readFile("src/editor/animation-catalogue-player-host.ts", "utf8"),
    readFile("src/editor/animation-catalogue-shell.ts", "utf8"),
    readFile("src/bootstrap.ts", "utf8")
  ]);
  const lifecycleSource = [
    component,
    entry,
    selectionPreparation,
    capabilityHost,
    playerHost
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
  // Keep the frozen rollback path in the historical fixture, but ratchet the
  // live bootstrap so that migration-only composition cannot return unnoticed.
  assert.equal(
    baseline.rollbackEntry,
    "src/editor/animation-catalogue-application.ts"
  );
  assert.doesNotMatch(
    bootstrap,
    /import\(\s*"\.\/editor\/animation-catalogue-application\.ts"\s*\)/
  );
});
