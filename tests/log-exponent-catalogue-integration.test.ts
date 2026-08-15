import assert from "node:assert/strict";
import test from "node:test";

import {
  kpLogExponentAnimationId
} from "../src/animation/log-exponent-adapter.ts";
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

const descriptorId = `editor-animation.${kpLogExponentAnimationId}`;

test("canonical log-exponent sequence is one lazy algebra catalogue asset", async () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ id }) => id === descriptorId
  );
  const entry = createKpAnimationCatalogueProjection().entries.find(
    ({ animationId }) => animationId === kpLogExponentAnimationId
  );
  const loaded = await loadKpAnimationAsset(kpLogExponentAnimationId);

  assert.equal(kpAnimationCatalogPackId(kpLogExponentAnimationId), "algebra");
  assert.equal(loaded.packId, "algebra");
  assert.equal(loaded.animation.id, kpLogExponentAnimationId);
  assert.equal(descriptor?.animationId, kpLogExponentAnimationId);
  assert.equal(descriptor?.durationMs, 8_400);
  assert.equal(descriptor?.beatCount, 168);
  assert.equal(entry?.primaryDescriptorId, descriptorId);
  assert.equal(entry?.packId, "algebra");
  assert.deepEqual(entry?.renderTargetKinds, ["equation"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: kpLogExponentAnimationId,
    slotKinds: ["equation"]
  }), ["log-exponent"]);
});

test("canonical log-exponent catalogue route preserves artifact and playhead", () => {
  const search = writeKpAnimationCatalogueRoute("", {
    artifactId: kpLogExponentAnimationId,
    playhead: 0.625
  });

  assert.deepEqual(readKpAnimationCatalogueRoute(search), {
    active: true,
    source: "default",
    artifactId: kpLogExponentAnimationId,
    playhead: 0.625
  });
});
