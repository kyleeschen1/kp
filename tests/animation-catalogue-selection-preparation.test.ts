import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadKpAnimationAsset } from "../src/animation/catalog-loader.ts";
import {
  economicsEquilibriumAnimationId
} from "../src/animation/economics-equilibrium-adapter.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  createKpAnimationCatalogueSelectionPreparationService
} from "../src/editor/animation-catalogue-selection-preparation.ts";
import {
  KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
} from "../src/editor/animation-catalogue-selection.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  createKpEditorAnimationSurfaceAdapterRegistry
} from "../src/editor/animation-surface-adapter-registry.ts";
import type {
  KpEditorSelectedSurfaceCapabilityHost
} from "../src/editor/selected-surface-capability-host.ts";

const projection = createKpAnimationCatalogueProjection();
const descriptors = createKpEditorAnimationLibrary();
const passiveCapabilityHost: KpEditorSelectedSurfaceCapabilityHost = {
  async load() {},
  async loadAll() {},
  async loadSelected() {}
};
const passiveRegistry = createKpEditorAnimationSurfaceAdapterRegistry([{
  id: "test.equation",
  slotKind: "equation",
  supports: () => true,
  render: () => {}
}, {
  id: "test.graph",
  slotKind: "graph",
  supports: () => true,
  render: () => {}
}]);

function entry(animationId: string) {
  const selected = projection.entries.find(
    (candidate) => candidate.animationId === animationId
  );
  assert.ok(selected, `Missing catalogue entry ${animationId}.`);
  return selected;
}

test("shared preparation preserves selected asset, clock, and hostability", async () => {
  const service = createKpAnimationCatalogueSelectionPreparationService({
    descriptors,
    capabilityHost: passiveCapabilityHost,
    registry: passiveRegistry
  });
  const selected = entry(KP_ANIMATION_CATALOGUE_EXEMPLAR_ID);
  const prepared = await service.prepare({
    entry: selected,
    search: "?unrelated=retained",
    playhead: 0.375
  });

  assert.equal(prepared.animation.id, selected.animationId);
  assert.equal(prepared.descriptor.id, selected.primaryDescriptorId);
  assert.equal(prepared.player.progress, 0.375);
  assert.equal(prepared.player.runtimeFrame.clock.progress, 0.375);
  assert.equal(prepared.hostability.status, "ready");
  assert.equal(prepared.health.status, "review");
  assert.equal(prepared.readerCompanion, undefined);
  assert.equal(Object.isFrozen(prepared), true);
});

test("preparation applies explicit URL parameters without browser authority", async () => {
  const service = createKpAnimationCatalogueSelectionPreparationService({
    descriptors,
    capabilityHost: passiveCapabilityHost,
    registry: passiveRegistry
  });
  const prepared = await service.prepare({
    entry: entry(economicsEquilibriumAnimationId),
    search: "?demandIntercept=15",
    playhead: 0.5
  });

  assert.deepEqual(prepared.economicsParameters, {
    schemaVersion: "kp.economics-equilibrium-parameters.v1",
    demandInterceptAfter: 15
  });
  assert.equal(prepared.physicsParameters, undefined);
  assert.equal(prepared.animation.id, economicsEquilibriumAnimationId);
  assert.equal(prepared.player.progress, 0.5);
  assert.equal(prepared.hostability.status, "ready");
});

test("pack and capability loading begin together without a second asset cache", async () => {
  const selected = entry(KP_ANIMATION_CATALOGUE_EXEMPLAR_ID);
  const loaded = await loadKpAnimationAsset(selected.animationId);
  let assetStarted = false;
  let capabilityStarted = false;
  let releaseAsset = () => {};
  let releaseCapability = () => {};
  const assetGate = new Promise<void>((resolve) => {
    releaseAsset = resolve;
  });
  const capabilityGate = new Promise<void>((resolve) => {
    releaseCapability = resolve;
  });
  const capabilityHost: KpEditorSelectedSurfaceCapabilityHost = {
    async load() {},
    async loadAll() {},
    async loadSelected() {
      capabilityStarted = true;
      await capabilityGate;
    }
  };
  const registry = createKpEditorAnimationSurfaceAdapterRegistry([{
    id: "test.equation",
    slotKind: "equation",
    supports: () => true,
    render: () => {}
  }]);
  const service = createKpAnimationCatalogueSelectionPreparationService({
    descriptors,
    capabilityHost,
    registry,
    async loadAsset() {
      assetStarted = true;
      await assetGate;
      return loaded;
    }
  });
  const pending = service.prepare({ entry: selected, search: "" });
  await Promise.resolve();

  assert.equal(assetStarted, true);
  assert.equal(capabilityStarted, true);
  releaseAsset();
  releaseCapability();
  const prepared = await pending;
  assert.equal(prepared.hostability.status, "ready");
});

test("preparation fails closed on loader identity and descriptor drift", async () => {
  const selected = entry(KP_ANIMATION_CATALOGUE_EXEMPLAR_ID);
  const loaded = await loadKpAnimationAsset(selected.animationId);
  const capabilityHost: KpEditorSelectedSurfaceCapabilityHost = {
    async load() {},
    async loadAll() {},
    async loadSelected() {}
  };
  const wrongPack = createKpAnimationCatalogueSelectionPreparationService({
    descriptors,
    capabilityHost,
    loadAsset: async () => ({ ...loaded, packId: "graph" })
  });

  await assert.rejects(
    wrongPack.prepare({ entry: selected, search: "" }),
    /expected .* from algebra/
  );
  const missingDescriptor = createKpAnimationCatalogueSelectionPreparationService({
    descriptors: [],
    capabilityHost
  });
  await assert.rejects(
    missingDescriptor.prepare({ entry: selected, search: "" }),
    /missing descriptor/
  );
});

test("catalogue and legacy editor consume one browser-neutral preparation API", async () => {
  const [serviceSource, catalogueSource, legacySource] = await Promise.all([
    readFile("src/editor/animation-catalogue-selection-preparation.ts", "utf8"),
    readFile(
      "src/editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts",
      "utf8"
    ),
    readFile("src/main.ts", "utf8")
  ]);

  assert.doesNotMatch(
    serviceSource,
    /window\.|document\.|HTMLElement|from "svelte|new Map/
  );
  assert.match(
    serviceSource,
    /loadKpAnimationAsset,\s*\n\s*type KpLoadedAnimationAsset/
  );
  assert.match(
    serviceSource,
    /import\(\s*"\.\/verified-generated-linear-solve-reader\.ts"\s*\)/
  );
  assert.match(
    catalogueSource,
    /createKpAnimationCatalogueSelectionPreparationService/
  );
  assert.match(
    legacySource,
    /createKpAnimationCatalogueSelectionPreparationService/
  );
  assert.doesNotMatch(
    catalogueSource,
    /loadKpAnimationAsset|#loadCapability|#loadGeneratedReader/
  );
  assert.doesNotMatch(
    legacySource,
    /function prepareAnimationCatalogueSelection|function loadSelectedSurfaceCapability/
  );
});
