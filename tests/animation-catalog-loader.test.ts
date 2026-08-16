import assert from "node:assert/strict";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  KpAnimationCatalogLoadError,
  kpAnimationCatalogPackDeclarations,
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
  loaded.forEach(({ animation, catalog, packId, runtimeCapabilities }) => {
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
    if (packId === "algebra") {
      assert.equal(
        typeof runtimeCapabilities.distributionChoreography?.compile,
        "function"
      );
      assert.equal(
        typeof runtimeCapabilities.factoringChoreography?.sample,
        "function"
      );
    } else {
      assert.deepEqual(runtimeCapabilities, {});
    }
  });
});

test("catalog loading reports typed ownership and pack-membership failures", async () => {
  assert.throws(
    () => kpAnimationCatalogPackId("animation.unowned.example"),
    (error: unknown) => error instanceof KpAnimationCatalogLoadError &&
      error.code === "unowned-animation" &&
      error.animationId === "animation.unowned.example"
  );
  await assert.rejects(
    loadKpAnimationAsset("animation.generated.linear-solve.absent"),
    (error: unknown) => error instanceof KpAnimationCatalogLoadError &&
      error.code === "asset-missing-from-pack" &&
      error.packId === "algebra"
  );
});

test("all declared pack boundaries are exercised by editor metadata", () => {
  const expectedPackIds: readonly KpAnimationCatalogPackId[] = [
    "exact-quantity",
    "economics",
    "physics",
    "place-value",
    "algebra",
    "log-product",
    "generated-drafts",
    "generated-problems",
    "graph",
    "operation-evaluation",
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
  assert.deepEqual(
    kpAnimationCatalogPackDeclarations.map(({ id }) => id).sort(),
    [...expectedPackIds].sort()
  );
  for (const animation of createKpAnimationAssets()) {
    assert.equal(
      kpAnimationCatalogPackDeclarations.filter(({ owns }) =>
        owns(animation.id)
      ).length,
      1,
      `${animation.id} must have exactly one lazy pack declaration`
    );
  }
});
