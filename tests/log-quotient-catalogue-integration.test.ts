import assert from "node:assert/strict";
import test from "node:test";

import {
  kpLogQuotientAnimationId
} from "../src/animation/log-quotient-adapter.ts";
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

const descriptorId = `editor-animation.${kpLogQuotientAnimationId}`;

test("log quotient is one lazy algebra catalogue asset", async () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ id }) => id === descriptorId
  );
  const entry = createKpAnimationCatalogueProjection().entries.find(
    ({ animationId }) => animationId === kpLogQuotientAnimationId
  );
  const loaded = await loadKpAnimationAsset(kpLogQuotientAnimationId);

  assert.equal(kpAnimationCatalogPackId(kpLogQuotientAnimationId), "algebra");
  assert.equal(loaded.packId, "algebra");
  assert.equal(loaded.animation.id, kpLogQuotientAnimationId);
  assert.equal(descriptor?.durationMs, 4_800);
  assert.equal(descriptor?.beatCount, 96);
  assert.equal(entry?.primaryDescriptorId, descriptorId);
  assert.equal(entry?.packId, "algebra");
  assert.deepEqual(entry?.renderTargetKinds, ["equation"]);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: kpLogQuotientAnimationId,
    slotKinds: ["equation"]
  }), ["log-quotient"]);
});

test("log-quotient catalogue route preserves direct semantic playhead", () => {
  const search = writeKpAnimationCatalogueRoute("", {
    artifactId: kpLogQuotientAnimationId,
    playhead: 0.625
  });
  assert.deepEqual(readKpAnimationCatalogueRoute(search), {
    active: true,
    source: "default",
    artifactId: kpLogQuotientAnimationId,
    playhead: 0.625
  });
});
