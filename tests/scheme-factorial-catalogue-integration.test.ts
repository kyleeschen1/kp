import assert from "node:assert/strict";
import test from "node:test";

import { loadKpAnimationAsset } from "../src/animation/catalog-loader.ts";
import { createKpAnimationCatalogueProjection } from
  "../src/editor/animation-catalogue-projection.ts";
import {
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "../src/editor/animation-catalogue-route.ts";
import { createKpAnimationLibraryDisplayCatalog } from
  "../src/editor/animation-library-display-catalog.ts";
import { createKpEditorAnimationLibrary } from
  "../src/editor/animation-library.ts";

const animationId = "animation.programming.scheme-factorial";
const descriptorId = `editor-animation.${animationId}`;

test("Scheme exemplar is one standard lazy programming catalogue entry", async () => {
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ id }) => id === descriptorId);
  const entry = createKpAnimationCatalogueProjection().entries.find(
    ({ animationId: candidate }) => candidate === animationId);
  const display = createKpAnimationLibraryDisplayCatalog().find(
    ({ animationId: candidate }) => candidate === animationId);
  const loaded = await loadKpAnimationAsset(animationId);

  assert.equal(descriptor?.animationId, animationId);
  assert.equal(descriptor?.durationMs, 30_000);
  assert.equal(descriptor?.beatCount, 19);
  assert.equal(entry?.primaryDescriptorId, descriptorId);
  assert.equal(entry?.packId, "programming");
  assert.deepEqual(entry?.renderTargetKinds, ["programming"]);
  assert.ok(entry?.searchTerms.includes("scheme"));
  assert.ok(entry?.searchTerms.includes("factorial"));
  assert.equal(loaded.packId, "programming");
  assert.equal(loaded.animation, loaded.catalog.find(
    ({ id }) => id === animationId));
  assert.ok(display?.representations.some(({ href, role }) =>
    href === "/tutorials/programming/scheme-factorial/" &&
    role === "projection"));
});

test("Scheme catalogue selection has stable artifact and playhead URLs", () => {
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
