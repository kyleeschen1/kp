import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  loadKpAnimationAsset,
  type KpLoadedAnimationAsset
} from "../src/animation/catalog-loader.ts";
import {
  assertKpEquationAssetConformance,
  inspectKpEquationAssetConformance,
  kpEquationAssetConformanceBudget,
  kpEquationConformanceLawIds,
  KpEquationAssetConformanceError
} from "../src/architecture/equation-asset-conformance.ts";
import {
  createKpEquationAssetManifest,
  type KpEquationAssetManifest
} from "../src/architecture/equation-asset-manifest.ts";

test("generated conformance runs six bounded laws against every manifest row", async () => {
  const manifest = createKpEquationAssetManifest();
  const report = await assertKpEquationAssetConformance({
    manifest,
    assets: createKpAnimationAssets()
  });

  assert.equal(report.passed, true);
  assert.equal(report.assetCount, manifest.entries.length);
  assert.equal(report.checkCount,
    manifest.entries.length * kpEquationConformanceLawIds.length);
  assert.equal(report.lazyLoadCount, manifest.entries.length);
  assert.equal(report.assetCount <= kpEquationAssetConformanceBudget.maximumAssets,
    true);
  for (const entry of manifest.entries) {
    assert.deepEqual(
      report.results.filter(({ assetId }) => assetId === entry.assetId)
        .map(({ lawId }) => lawId),
      kpEquationConformanceLawIds
    );
  }
});

test("broken manifest and catalogue joins fail closed with scoped laws", async () => {
  const manifest = createKpEquationAssetManifest();
  const assets = createKpAnimationAssets();
  const first = manifest.entries[0]!;
  const broken = {
    ...manifest,
    entries: [
      {
        ...first,
        accessibilityTruth: {
          ...first.accessibilityTruth,
          reducedMotionValue: "animate-anyway"
        },
        lazyLoader: {
          ...first.lazyLoader,
          packId: "comparison"
        },
        staticTruth: {
          ...first.staticTruth,
          route: {
            ...first.staticTruth.route,
            href: "/wrong"
          }
        }
      },
      ...manifest.entries.slice(1),
      first
    ]
  } as unknown as KpEquationAssetManifest;
  const report = await inspectKpEquationAssetConformance({
    manifest: broken,
    assets: assets.slice(1),
    loadAsset: async (assetId): Promise<KpLoadedAnimationAsset> =>
      loadKpAnimationAsset(assetId)
  });

  assert.equal(report.passed, false);
  assert.equal(report.diagnostics.some((message) =>
    message.includes(`Duplicate manifest id ${first.assetId}`)), true);
  assert.equal(report.diagnostics.some((message) =>
    message.includes("Reduced-motion contract is invalid")), true);
  assert.equal(report.diagnostics.some((message) =>
    message.includes("Manifest pack comparison should be")), true);
  assert.equal(report.diagnostics.some((message) =>
    message.includes("Manifest route should be")), true);
  assert.equal(report.diagnostics.some((message) =>
    message.includes("Missing catalogue asset")), true);
});

test("assertion form preserves the complete report on failure", async () => {
  const manifest = createKpEquationAssetManifest();
  await assert.rejects(
    () => assertKpEquationAssetConformance({
      manifest,
      assets: createKpAnimationAssets(),
      budget: { maximumAssets: 1, lawsPerAsset: 5 }
    }),
    (error: unknown) =>
      error instanceof KpEquationAssetConformanceError &&
      !error.report.passed &&
      error.report.diagnostics.some((message) =>
        message.includes("conformance budget allows 1")) &&
      error.report.diagnostics.some((message) =>
        message.includes("every canonical law once"))
  );
});
