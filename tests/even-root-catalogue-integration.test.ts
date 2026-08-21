import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEvenRootSolveAnimationAsset,
  kpEvenRootSolveAnimationId
} from "../src/animation/even-root-solve-adapter.ts";
import {
  loadKpAnimationAsset,
  kpAnimationCatalogPackId
} from "../src/animation/catalog-loader.ts";
import {
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../src/editor/selected-surface-capability.ts";
import {
  kpEditorSelectedSurfaceCapabilityDeclarations
} from "../src/editor/selected-surface-capability-declarations.ts";

test("even-root asset exposes a two-operation searchable sequence", () => {
  const asset = createKpEvenRootSolveAnimationAsset();
  assert.deepEqual(validateKpAnimationAsset(asset), []);
  assert.equal(asset.id, kpEvenRootSolveAnimationId);
  assert.equal(asset.bundle.objects.length, 3);
  assert.equal(asset.transformations.length, 2);
  assert.deepEqual(asset.timeline?.markerIds, asset.transformations.map(({ id }) => id));
  assert.equal(asset.metadata?.["fallbackEndpoint"], "x^2=9");
  assert.ok(asset.presentationConstraints?.requiredCapabilities.includes(
    "direct-seek"
  ));
});

test("lazy algebra pack owns and loads the exact even-root asset", async () => {
  assert.equal(kpAnimationCatalogPackId(kpEvenRootSolveAnimationId), "algebra");
  const loaded = await loadKpAnimationAsset(kpEvenRootSolveAnimationId);
  assert.equal(loaded.packId, "algebra");
  assert.equal(loaded.animation.id, kpEvenRootSolveAnimationId);
  assert.equal(
    loaded.catalog.filter(({ id }) => id === kpEvenRootSolveAnimationId).length,
    1
  );
});

test("selection loads the specialized root surface with generic static fallback", () => {
  assert.deepEqual(
    deriveKpEditorSelectedSurfaceCapabilities({
      animationId: kpEvenRootSolveAnimationId,
      slotKinds: ["equation"]
    }),
    ["even-root", "equation-katex"]
  );
  const evenRoot = kpEditorSelectedSurfaceCapabilityDeclarations.find(
    ({ capabilityId }) => capabilityId === "even-root"
  );
  assert.ok(evenRoot);
  assert.deepEqual(evenRoot.adapterIds, [
    "editor-animation-surface.even-root.canonical-native-katex"
  ]);
});
