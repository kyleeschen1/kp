import assert from "node:assert/strict";
import test from "node:test";

import { loadKpAnimationAsset } from "../src/animation/catalog-loader.ts";
import { createKpAnimationCatalogueProjection } from
  "../src/editor/animation-catalogue-projection.ts";
import {
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "../src/editor/animation-catalogue-route.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";

const animationId = "animation.programming.python-free-shipping-refactor";
const descriptorId = `editor-animation.${animationId}`;

test("Python exemplar is one standard lazy programming catalogue entry", async () => {
  const descriptor = createKpEditorAnimationLibrary().find(({ id }) => id === descriptorId);
  const entry = createKpAnimationCatalogueProjection().entries.find(
    ({ animationId: candidate }) => candidate === animationId
  );
  const loaded = await loadKpAnimationAsset(animationId);

  assert.equal(descriptor?.animationId, animationId);
  assert.equal(descriptor?.durationMs, 14_000);
  assert.equal(descriptor?.beatCount, 7);
  assert.deepEqual(descriptor?.controlKinds, ["playback", "step", "scrubber", "rewind"]);
  assert.equal(entry?.primaryDescriptorId, descriptorId);
  assert.equal(entry?.packId, "programming");
  assert.deepEqual(entry?.renderTargetKinds, ["programming"]);
  assert.ok(entry?.searchTerms.includes("python"));
  assert.equal(loaded.packId, "programming");
  assert.equal(loaded.animation, loaded.catalog.find(({ id }) => id === animationId));
});

test("Python catalogue selection has a stable artifact and playhead URL", () => {
  const search = writeKpAnimationCatalogueRoute("", {
    artifactId: animationId,
    playhead: 0.68
  });

  assert.deepEqual(readKpAnimationCatalogueRoute(search), {
    active: true,
    source: "default",
    artifactId: animationId,
    playhead: 0.68
  });
});
