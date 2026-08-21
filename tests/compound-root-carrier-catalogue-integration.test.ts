import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCompoundRootCarrierAnimationAsset,
  kpCompoundRootCarrierAnimationId
} from "../src/animation/compound-root-carrier-adapter.ts";
import {
  kpAnimationCatalogPackId,
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";
import { validateKpAnimationAsset } from "../src/animation/asset.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../src/editor/selected-surface-capability.ts";
import {
  kpEditorSelectedSurfaceCapabilityDeclarations
} from "../src/editor/selected-surface-capability-declarations.ts";

test("compound-root asset exposes the verified carrier rewrite", () => {
  const asset = createKpCompoundRootCarrierAnimationAsset();
  assert.deepEqual(validateKpAnimationAsset(asset), []);
  assert.equal(asset.id, kpCompoundRootCarrierAnimationId);
  assert.equal(asset.bundle.objects.length, 2);
  assert.equal(asset.transformations.length, 1);
  assert.equal(asset.metadata?.["fallbackEndpoint"],
    "\\sqrt{(x+1)^{2}}");
  assert.ok(asset.presentationConstraints?.requiredCapabilities.includes(
    "direct-seek"
  ));
});

test("lazy algebra pack owns the compound-root exemplar", async () => {
  assert.equal(kpAnimationCatalogPackId(kpCompoundRootCarrierAnimationId),
    "algebra");
  const loaded = await loadKpAnimationAsset(kpCompoundRootCarrierAnimationId);
  assert.equal(loaded.packId, "algebra");
  assert.equal(loaded.animation.id, kpCompoundRootCarrierAnimationId);
  assert.equal(loaded.catalog.filter(({ id }) =>
    id === kpCompoundRootCarrierAnimationId).length, 1);
});

test("compound-root selection loads the root family capability", () => {
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: kpCompoundRootCarrierAnimationId,
    slotKinds: ["equation"]
  }), ["even-root", "equation-katex"]);
  const root = kpEditorSelectedSurfaceCapabilityDeclarations.find(
    ({ capabilityId }) => capabilityId === "even-root"
  );
  assert.ok(root);
  assert.ok(root.adapterIds.includes(
    "editor-animation-surface.root.compound-carrier.canonical-native-katex"
  ));
});
