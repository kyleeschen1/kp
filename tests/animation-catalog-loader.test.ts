import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  kpAnimationCatalogPackId,
  loadKpAnimationAsset,
  type KpAnimationCatalogPackId
} from "../src/animation/catalog-loader.ts";
import {
  checkKpAnimationRuntimeRewindClockLaw
} from "../src/animation/runtime-laws.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";

test("lazy capability packs preserve the complete concrete catalog", async () => {
  const expectedIds = createKpAnimationAssets()
    .map((animation) => animation.id)
    .sort();
  const metadataIds = [...new Set(
    createKpEditorAnimationLibrary().map((descriptor) => descriptor.animationId)
  )].sort();

  assert.deepEqual(metadataIds, expectedIds);

  const loaded = await Promise.all(
    metadataIds.map((animationId) => loadKpAnimationAsset(animationId))
  );
  assert.deepEqual(
    loaded.map(({ animation }) => animation.id).sort(),
    expectedIds
  );
  loaded.forEach(({ animation, catalog, packId }) => {
    assert.equal(kpAnimationCatalogPackId(animation.id), packId);
    assert.equal(catalog.some((candidate) => candidate.id === animation.id), true);
    assert.equal(
      checkKpAnimationRuntimeRewindClockLaw({
        animation,
        childAnimations: catalog
      }).passed,
      true,
      `${animation.id} has unresolved child animations in ${packId}`
    );
  });
});

test("all declared pack boundaries are exercised by editor metadata", () => {
  const expectedPackIds: readonly KpAnimationCatalogPackId[] = [
    "exact-quantity",
    "algebra",
    "generated-drafts",
    "generated-problems",
    "graph",
    "programming",
    "comparison",
    "complex-katex"
  ];
  const actualPackIds = new Set(
    createKpEditorAnimationLibrary().map((descriptor) =>
      kpAnimationCatalogPackId(descriptor.animationId)
    )
  );

  assert.deepEqual([...actualPackIds].sort(), [...expectedPackIds].sort());
});

test("catalog loader retains literal dynamic-import boundaries", async () => {
  const source = await readFile(
    new URL("../src/animation/catalog-loader.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /from "\.\/catalog\.ts"/);
  assert.equal(
    [...source.matchAll(/import\("\.\/catalog-packs\/[^"]+\.ts"\)/g)].length,
    8
  );
});
