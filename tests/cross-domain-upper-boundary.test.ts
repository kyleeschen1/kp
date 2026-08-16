import assert from "node:assert/strict";
import test from "node:test";

import {
  kpAnimationCatalogPackId,
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";
import {
  createKpEditorAnimationDescriptor
} from "../src/editor/animation-descriptor.ts";
import {
  createKpEditorAnimationPlayerState
} from "../src/editor/animation-player-state.ts";
import {
  findKpCrossDomainUpperBoundaryDeclaration,
  kpCrossDomainUpperBoundaryDeclarations
} from "../src/editor/cross-domain-upper-boundary.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../src/editor/selected-surface-capability.ts";

test("graph and code exemplars share only the upper lifecycle boundary", () => {
  assert.deepEqual(
    kpCrossDomainUpperBoundaryDeclarations.map((entry) => entry.animationId),
    [
      "animation.economics.supply-demand-equilibrium-shift",
      "animation.programming.typescript-free-shipping-refactor"
    ]
  );
  assert.deepEqual(
    kpCrossDomainUpperBoundaryDeclarations[0]?.sharedCapabilityIds,
    kpCrossDomainUpperBoundaryDeclarations[1]?.sharedCapabilityIds
  );
  assert.deepEqual(
    kpCrossDomainUpperBoundaryDeclarations[0]?.sharedCapabilityIds,
    [
      "catalogue-asset-loader",
      "selected-surface-capability-host",
      "animation-player-shared-clock",
      "animation-catalogue-review-capture"
    ]
  );
  assert.notEqual(
    kpCrossDomainUpperBoundaryDeclarations[0]?.rendererAdapterId,
    kpCrossDomainUpperBoundaryDeclarations[1]?.rendererAdapterId
  );
  assert.ok(kpCrossDomainUpperBoundaryDeclarations.every((entry) =>
    entry.equationRecipeBoundary.status === "not-applicable" &&
    entry.equationRecipeBoundary.recipeIds.length === 0
  ));
});

test("cross-domain declarations own selected surface capability routing", () => {
  const economics = kpCrossDomainUpperBoundaryDeclarations[0]!;
  const programming = kpCrossDomainUpperBoundaryDeclarations[1]!;

  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: economics.animationId,
    slotKinds: [economics.slotKind]
  }), ["graph-svg-economics"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: programming.animationId,
    slotKinds: [programming.slotKind]
  }), ["programming-trace"]);
  assert.equal(
    findKpCrossDomainUpperBoundaryDeclaration("animation.unknown"),
    undefined
  );
});

test("graph and code exemplars load independent packs on the shared player clock", async () => {
  for (const declaration of kpCrossDomainUpperBoundaryDeclarations) {
    assert.equal(
      kpAnimationCatalogPackId(declaration.animationId),
      declaration.catalogPackId
    );
    const loaded = await loadKpAnimationAsset(declaration.animationId);
    const descriptor = createKpEditorAnimationDescriptor({
      animationId: loaded.animation.id,
      title: loaded.animation.title,
      summary: `Cross-domain clock probe for ${loaded.animation.title}.`,
      renderTargetKinds: [declaration.slotKind]
    });
    const player = createKpEditorAnimationPlayerState({
      descriptor,
      animation: loaded.animation,
      catalog: loaded.catalog,
      runtimeCapabilities: loaded.runtimeCapabilities,
      progress: 0.5
    });

    assert.equal(loaded.packId, declaration.catalogPackId);
    assert.equal(player.animationId, declaration.animationId);
    assert.equal(player.runtimeFrame.clock.progress, 0.5);
    assert.equal(player.progress, player.runtimeFrame.clock.progress);
  }
});
