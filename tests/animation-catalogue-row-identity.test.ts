import assert from "node:assert/strict";
import test from "node:test";

import { loadKpAnimationAsset } from "../src/animation/catalog-loader.ts";
import {
  createKpAnimationCatalogueLoadableRegistry
} from "../src/editor/animation-catalogue-loadable-registry.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";

test("catalogue rows equal concrete registry and resolved asset identities", async () => {
  const registry = createKpAnimationCatalogueLoadableRegistry();
  const projection = createKpAnimationCatalogueProjection();
  const resolved = await Promise.all(
    registry.map(({ animationId }) => loadKpAnimationAsset(animationId))
  );
  const rowIds = projection.entries.map(({ animationId }) => animationId);
  const registryIds = registry.map(({ animationId }) => animationId);
  const resolvedIds = resolved.map(({ animation }) => animation.id).sort();

  assert.equal(new Set(rowIds).size, 35);
  assert.deepEqual(rowIds, registryIds);
  assert.deepEqual(rowIds, resolvedIds);
  assert.deepEqual(
    resolved.map(({ animation, packId }) => [animation.id, packId]).sort(),
    registry.map(({ animationId, packId }) => [animationId, packId]).sort()
  );
});

test("descriptors and contexts remain subordinate to their concrete row", () => {
  const projection = createKpAnimationCatalogueProjection();
  const descriptors = createKpEditorAnimationLibrary();
  const rowIds = new Set(
    projection.entries.map(({ animationId }) => animationId)
  );
  const contextIds = projection.entries.flatMap(
    ({ relatedContexts }) => relatedContexts.map(({ id }) => id)
  );

  assert.equal(projection.entries.length, 35);
  assert.equal(descriptors.length, 52);
  assert.equal(contextIds.length, 76);
  assert.equal(new Set(contextIds).size, 76);
  assert.equal(
    descriptors.some(({ id }) => rowIds.has(id)),
    false
  );
  assert.equal(contextIds.some((id) => rowIds.has(id)), false);
  for (const descriptor of descriptors) {
    assert.equal(rowIds.has(descriptor.animationId), true);
  }
});

test("duplicate loadable membership fails before a duplicate row can render", () => {
  const registry = createKpAnimationCatalogueLoadableRegistry();
  const first = registry[0];
  assert.ok(first);

  assert.throws(
    () => createKpAnimationCatalogueProjection({
      loadable: [...registry, first]
    }),
    /Duplicate loadable catalogue animation id/
  );
});
