import assert from "node:assert/strict";
import test from "node:test";

import {
  kpExponentialHomomorphismAnimationId
} from "../src/animation/exponential-homomorphism-adapter.ts";
import {
  kpAnimationCatalogPackId,
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "../src/editor/animation-catalogue-route.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../src/editor/selected-surface-capability.ts";

const descriptorId = `editor-animation.${kpExponentialHomomorphismAnimationId}`;

test("exponential homomorphism is one independently lazy catalogue asset", async () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ id }) => id === descriptorId
  );
  const entry = createKpAnimationCatalogueProjection().entries.find(
    ({ animationId }) =>
      animationId === kpExponentialHomomorphismAnimationId
  );
  const loaded = await loadKpAnimationAsset(
    kpExponentialHomomorphismAnimationId
  );

  assert.equal(
    kpAnimationCatalogPackId(kpExponentialHomomorphismAnimationId),
    "exponential-homomorphism"
  );
  assert.equal(loaded.packId, "exponential-homomorphism");
  assert.equal(loaded.catalog.length, 1);
  assert.equal(loaded.animation.id, kpExponentialHomomorphismAnimationId);
  assert.equal(loaded.animation.metadata?.["fallbackEndpoint"], "e^{a+b}");
  assert.equal(descriptor?.durationMs, 4_800);
  assert.equal(descriptor?.beatCount, 96);
  assert.equal(entry?.primaryDescriptorId, descriptorId);
  assert.equal(entry?.packId, "exponential-homomorphism");
  assert.deepEqual(entry?.renderTargetKinds, ["equation"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: kpExponentialHomomorphismAnimationId,
    slotKinds: ["equation"]
  }), ["exponential-homomorphism"]);
});

test("exponential catalogue route preserves exact review identity and playhead", () => {
  const search = writeKpAnimationCatalogueRoute("", {
    artifactId: kpExponentialHomomorphismAnimationId,
    playhead: 0.625
  });
  assert.deepEqual(readKpAnimationCatalogueRoute(search), {
    active: true,
    source: "default",
    artifactId: kpExponentialHomomorphismAnimationId,
    playhead: 0.63
  });
});
