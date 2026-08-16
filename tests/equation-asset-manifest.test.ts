import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import generatedManifest from
  "../src/architecture/equation-asset-manifest.generated.json" with {
    type: "json"
  };
import {
  compileKpEquationAssetManifest,
  createKpEquationAssetManifest,
  deriveKpAnimationDisplayCatalogueFromEquationManifest,
  KpEquationAssetManifestError,
  projectKpEquationAssetDisplayCatalogue
} from "../src/architecture/equation-asset-manifest.ts";
import {
  kpAnimationCatalogPackId,
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";
import {
  createKpEquationSurfaceDispositionLedger
} from "../src/architecture/equation-surface-disposition-ledger.ts";
import {
  createKpEquationSurfaceInventory
} from "../src/architecture/equation-surface-inventory.ts";
import {
  createKpEquationSurfacePreservationMatrix
} from "../src/architecture/equation-surface-preservation-matrix.ts";
import {
  createKpAnimationLibraryDisplayCatalog as createSourceDisplayCatalogue
} from "../src/editor/animation-library-display-catalog-builder.ts";

test("manifest covers every equation asset with durable static truth", () => {
  const manifest = createKpEquationAssetManifest();
  const inventory = createKpEquationSurfaceInventory();

  assert.deepEqual(generatedManifest, manifest);
  assert.equal(manifest.entries.length, 30);
  assert.deepEqual(
    new Set(manifest.entries.map(({ assetId }) => assetId)),
    new Set(inventory.entries.map(({ animationId }) => animationId))
  );
  for (const entry of manifest.entries) {
    assert.equal(entry.semanticSource.transformationIds.length > 0, true);
    assert.equal(entry.staticTruth.semanticEndpointFingerprints.length > 0,
      true);
    assert.equal(entry.staticTruth.route.href.length > 0, true);
    assert.equal(entry.pedagogicalIntent.summary.length > 0, true);
    assert.equal(entry.accessibilityTruth.playerLabel,
      "descriptor-title-animation-player");
  }
});

test("manifest lazy-loader truth resolves exact packs and source modules", async () => {
  const manifest = createKpEquationAssetManifest();
  const loadedPacks = new Set<string>();

  for (const entry of manifest.entries) {
    assert.equal(kpAnimationCatalogPackId(entry.assetId),
      entry.lazyLoader.packId);
    await access(new URL(`../${entry.lazyLoader.packSourcePath}`,
      import.meta.url));
    if (!loadedPacks.has(entry.lazyLoader.packId)) {
      const loaded = await loadKpAnimationAsset(entry.assetId);
      assert.equal(loaded.packId, entry.lazyLoader.packId);
      assert.equal(loaded.animation.id, entry.assetId);
      loadedPacks.add(entry.lazyLoader.packId);
    }
  }
});

test("equation display metadata is a lossless manifest projection", () => {
  const source = createSourceDisplayCatalogue();
  const manifest = createKpEquationAssetManifest({ display: source });
  const equationIds = new Set(manifest.entries.map(({ assetId }) => assetId));
  const projected = projectKpEquationAssetDisplayCatalogue(manifest);

  assert.deepEqual(
    [...projected].sort((left, right) =>
      left.animationId.localeCompare(right.animationId)),
    source.filter(({ animationId }) => equationIds.has(animationId))
      .sort((left, right) => left.animationId.localeCompare(right.animationId))
  );
  assert.deepEqual(
    deriveKpAnimationDisplayCatalogueFromEquationManifest({
      source,
      manifest
    }),
    source
  );
});

test("manifest rejects incomplete source joins and excludes host state", async () => {
  const inventory = createKpEquationSurfaceInventory();
  const preservation = createKpEquationSurfacePreservationMatrix();
  const disposition = createKpEquationSurfaceDispositionLedger();
  const display = createSourceDisplayCatalogue();
  const omittedId = inventory.entries[0]!.animationId;

  assert.throws(() => compileKpEquationAssetManifest({
    inventory,
    preservation: {
      ...preservation,
      entries: preservation.entries.filter(({ animationId }) =>
        animationId !== omittedId)
    },
    disposition,
    display
  }), (error: unknown) =>
    error instanceof KpEquationAssetManifestError &&
    error.diagnostics.some((message) => message.includes(omittedId)));

  const source = await readFile(new URL(
    "../src/architecture/equation-asset-manifest.ts",
    import.meta.url
  ), "utf8");
  for (const forbidden of [
    "editorState",
    "viewport",
    "layoutMode",
    "activeSelection",
    "durationMs",
    "beatCount",
    "clockAuthority"
  ]) {
    assert.doesNotMatch(source, new RegExp(`readonly\\s+${forbidden}\\b`));
    assert.equal(JSON.stringify(createKpEquationAssetManifest())
      .includes(`\"${forbidden}\"`), false);
  }
});
