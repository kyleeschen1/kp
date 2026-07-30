import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpExactFractionQuantityAnimationAsset,
  kpExactFractionQuantityAnimationId
} from "../src/animation/exact-fraction-quantity-adapter.ts";
import {
  kpAnimationCatalogPackId,
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";
import {
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry
} from "../src/editor/animation-surface-adapter-registry.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../src/editor/animation-library-display-catalog.ts";
import {
  createKpExactFractionQuantityLibraryState,
  readKpExactFractionQuantityLibraryState,
  writeKpExactFractionQuantityLibraryState
} from "../src/editor/exact-fraction-quantity-library-state.ts";
import {
  KP_EXACT_FRACTION_FOLDABLE_NODE_IDS
} from "../src/semantic/exact-fraction-quantity-evaluation-tree.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../src/reader/compiler/exact-fraction-quantity-preservation-manifest.ts";

test("exact quantity asset is one valid lazy four-view library exemplar", async () => {
  const asset = createKpExactFractionQuantityAnimationAsset();

  assert.equal(asset.id, manifest.animationId);
  assert.deepEqual(validateKpAnimationAsset(asset), []);
  assert.equal(asset.renderTargets.length, 1);
  assert.equal(asset.renderTargets[0]?.kind, "diagram");
  assert.deepEqual(
    asset.timeline?.markerIds,
    manifest.checkpoints.map(({ id }) => id)
  );
  assert.deepEqual(
    asset.exportTargets.map(({ kind }) => kind),
    ["static-step"]
  );

  assert.equal(kpAnimationCatalogPackId(asset.id), "exact-quantity");
  const loaded = await loadKpAnimationAsset(asset.id);
  assert.equal(loaded.packId, "exact-quantity");
  assert.deepEqual(loaded.catalog.map(({ id }) => id), [asset.id]);
  assert.ok(
    kpEditorAnimationSurfaceAdapterRegistry.list().some(
      ({ id }) =>
        id ===
          "editor-animation-surface.exact-fraction-quantity.synchronized"
    )
  );
});

test("exact controls round-trip typed permille without disturbing library selection", () => {
  const state = createKpExactFractionQuantityLibraryState({
    progress: 0.56,
    activeView: "number-line",
    foldMode: "pinned",
    pinnedNodeIds: [KP_EXACT_FRACTION_FOLDABLE_NODE_IDS[1]]
  });
  const search = writeKpExactFractionQuantityLibraryState({
    search:
      `?animation=editor-animation.${kpExactFractionQuantityAnimationId}` +
      "&unrelated=retained",
    state
  });

  assert.match(search, /exactProgress=560/u);
  assert.match(search, /animation=editor-animation/u);
  assert.match(search, /unrelated=retained/u);
  assert.deepEqual(
    readKpExactFractionQuantityLibraryState(search),
    state
  );
  assert.ok(!search.includes("scroll"));
  assert.ok(!search.includes("pixel"));
});

test("invalid URL controls fall back to deterministic canonical defaults", () => {
  assert.deepEqual(
    readKpExactFractionQuantityLibraryState(
      "?exactProgress=not-a-number&exactView=unknown" +
      "&exactFold=pinned&exactPins=unknown"
    ),
    createKpExactFractionQuantityLibraryState()
  );
});

test("exact renderer remains behind its lazy capability pack and adds no page", async () => {
  const [main, loader, htmlFiles] = await Promise.all([
    readFile(new URL("../src/main.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../src/animation/catalog-loader.ts", import.meta.url),
      "utf8"
    ),
    readFile(new URL("../index.html", import.meta.url), "utf8")
  ]);

  assert.ok(!main.includes("exact-fraction-quantity-surface-adapter"));
  assert.ok(loader.includes('case "exact-quantity"'));
  assert.ok(!htmlFiles.includes("exact-fraction-quantity"));
});

test("display catalog derives ported status from the approved motif cohort", () => {
  const entry = createKpAnimationLibraryDisplayCatalog().find(
    ({ animationId }) => animationId === kpExactFractionQuantityAnimationId
  );

  assert.equal(entry?.availability, "playable");
  assert.equal(entry?.canonicalFormat, "ported");
  assert.equal(
    entry?.representations.filter(
      ({ role }) => role === "canonical-host"
    ).length,
    1
  );
});
