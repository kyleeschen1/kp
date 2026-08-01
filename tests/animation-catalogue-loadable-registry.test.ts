import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../src/editor/animation-library-display-catalog.ts";
import {
  createKpAnimationCatalogueLoadableRegistry
} from "../src/editor/animation-catalogue-loadable-registry.ts";
import {
  createKpEditorAnimationDescriptor
} from "../src/editor/animation-descriptor.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  createKpSemanticAnimationWorkbenchIndex
} from "../src/editor/semantic-animation-workbench-data.ts";

test("loadable registry has one compact entry per concrete animation asset", async () => {
  const assets = createKpAnimationAssets();
  const registry = createKpAnimationCatalogueLoadableRegistry();
  const expectedIds = assets.map(({ id }) => id).sort();

  assert.equal(registry.length, 34);
  assert.equal(new Set(registry.map(({ animationId }) => animationId)).size, 34);
  assert.deepEqual(registry.map(({ animationId }) => animationId), expectedIds);
  assert.deepEqual(
    [...new Set(registry.map(({ packId }) => packId))].sort(),
    [
      "algebra",
      "comparison",
      "complex-katex",
      "economics",
      "exact-quantity",
      "generated-drafts",
      "generated-problems",
      "graph",
      "operation-evaluation",
      "place-value",
      "programming"
    ]
  );
  assert.deepEqual(
    registry.map((entry) => Object.keys(entry).sort()),
    registry.map(() => [
      "animationId",
      "kind",
      "packId",
      "primaryDescriptorId",
      "schemaVersion"
    ])
  );

  const loaded = await Promise.all(
    registry.map(({ animationId }) => loadKpAnimationAsset(animationId))
  );
  assert.deepEqual(
    loaded.map(({ animation }) => animation.id).sort(),
    expectedIds
  );
  assert.deepEqual(
    loaded.map(({ packId }) => packId).sort(),
    registry.map(({ packId }) => packId).sort()
  );
});

test("loadable registry excludes planned and reader-only display identities", () => {
  const registryIds = new Set(
    createKpAnimationCatalogueLoadableRegistry().map(
      ({ animationId }) => animationId
    )
  );
  const workbench = createKpSemanticAnimationWorkbenchIndex();
  const display = createKpAnimationLibraryDisplayCatalog();
  const plannedIds = workbench.entries
    .filter(({ identity }) => identity.availability === "planned")
    .map(({ identity }) => identity.animationId);
  const readerOnlyIds = display
    .filter(({ animationId, availability }) =>
      availability === "playable" && !registryIds.has(animationId)
    )
    .map(({ animationId }) => animationId);

  assert.deepEqual(plannedIds, [
    "animation.algebra.quadratic.solution-branching"
  ]);
  assert.equal(readerOnlyIds.length, 7);
  assert.equal(
    [...plannedIds, ...readerOnlyIds].some((id) => registryIds.has(id)),
    false
  );
});

test("loadable registry requires one exact asset-level descriptor per id", () => {
  const descriptor = createKpEditorAnimationLibrary()[0];
  assert.ok(descriptor);
  const related = createKpEditorAnimationDescriptor({
    ...descriptor,
    id: "editor-animation.related-context",
    familyId: "family.related",
    sampleId: "sample.related"
  });

  assert.throws(
    () => createKpAnimationCatalogueLoadableRegistry([related]),
    /requires exactly one asset-level descriptor/
  );
  assert.throws(
    () => createKpAnimationCatalogueLoadableRegistry([
      descriptor,
      descriptor
    ]),
    /Duplicate editor animation descriptor id/
  );
  assert.equal(
    createKpAnimationCatalogueLoadableRegistry([descriptor, related]).length,
    1
  );
});
