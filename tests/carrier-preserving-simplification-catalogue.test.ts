import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpTwoTimesOneCarrierAnimationAsset,
  kpTwoTimesOneCarrierAnimationId
} from "../src/animation/operation-evaluation-adapter.ts";
import {
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";
import {
  projectKpEquationSurfaceFamily
} from "../src/domain-ir/equation-surface-family-declarations.ts";
import {
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "../src/editor/animation-catalogue-route.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  resolveKpAnimationCatalogueSelection
} from "../src/editor/animation-catalogue-selection.ts";
import {
  kpEditorCarrierPreservingSimplificationSurfaceAdapter
} from "../src/editor/carrier-preserving-simplification-surface-adapter.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  createKpEditorAnimationPlayerState
} from "../src/editor/animation-player-state.ts";
import {
  kpEditorSelectedSurfaceCapabilityDeclarationSet
} from "../src/editor/selected-surface-capability-declarations.ts";
import {
  createKpGeneratedAddZeroCarrierSource,
  kpGeneratedAddZeroAnimationId
} from "../src/semantic/generated-add-zero-carrier-preserving-simplification.ts";

test("the carrier exemplar is one stable lazy catalogue asset", async () => {
  const animation = createKpTwoTimesOneCarrierAnimationAsset();
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ animationId }) => animationId === kpTwoTimesOneCarrierAnimationId
  );
  assert.ok(descriptor);
  assert.equal(animation.id, kpTwoTimesOneCarrierAnimationId);
  assert.equal(animation.title, "2 \\times 1 → 2");
  assert.equal(descriptor.title, animation.title);

  const loaded = await loadKpAnimationAsset(kpTwoTimesOneCarrierAnimationId);
  assert.equal(loaded.packId, "operation-evaluation");
  assert.equal(loaded.animation.id, kpTwoTimesOneCarrierAnimationId);
  assert.equal(
    loaded.catalog.some(({ id }) => id === kpTwoTimesOneCarrierAnimationId),
    true
  );

  const state = createKpEditorAnimationPlayerState({
    descriptor,
    animation,
    catalog: loaded.catalog
  });
  assert.equal(
    kpEditorCarrierPreservingSimplificationSurfaceAdapter.supports(state),
    true
  );
  assert.equal(
    kpEditorCarrierPreservingSimplificationSurfaceAdapter.priority,
    142
  );
  assert.deepEqual(
    kpEditorSelectedSurfaceCapabilityDeclarationSet.find(
      "carrier-preserving-simplification"
    ).adapterIds,
    [kpEditorCarrierPreservingSimplificationSurfaceAdapter.id]
  );
});

test("generated add-zero selects the same lazy carrier surface", () => {
  const source = createKpGeneratedAddZeroCarrierSource();
  const descriptor = createKpEditorAnimationLibrary().find(
    ({ animationId }) => animationId === kpGeneratedAddZeroAnimationId
  );
  assert.ok(descriptor);
  const state = createKpEditorAnimationPlayerState({
    descriptor,
    animation: source.animation,
    catalog: []
  });
  assert.equal(
    kpEditorCarrierPreservingSimplificationSurfaceAdapter.supports(state),
    true
  );
  const family = projectKpEquationSurfaceFamily(kpGeneratedAddZeroAnimationId);
  assert.deepEqual(family.selectedCapabilityIds,
    ["carrier-preserving-simplification"]);
  assert.equal(family.rendererAdapterId,
    kpEditorCarrierPreservingSimplificationSurfaceAdapter.id);
  assert.equal(family.presentationRoute, "specialized-native-adapter");
  assert.equal(family.genericLayerTransition, "forbidden");
  assert.deepEqual(family.operationPlanRecipeIds, [
    "recipe.operation-plan.carrier-preserving-simplification.v1"
  ]);
});

test("the carrier exemplar restores from its semantic artifact URL", () => {
  const search = writeKpAnimationCatalogueRoute("", {
    artifactId: kpTwoTimesOneCarrierAnimationId,
    playhead: 0.42
  });
  const route = readKpAnimationCatalogueRoute(search);
  assert.deepEqual(route, {
    active: true,
    source: "default",
    artifactId: kpTwoTimesOneCarrierAnimationId,
    playhead: 0.42
  });
  const selection = resolveKpAnimationCatalogueSelection({
    projection: createKpAnimationCatalogueProjection(),
    artifactId: route.artifactId
  });
  assert.equal(selection.status, "selected");
  if (selection.status !== "selected") return;
  assert.equal(selection.entry.title, "2 \\times 1 → 2");
  assert.equal(selection.entry.packId, "operation-evaluation");
});

test("the promoted route retains its exact specialized adapter", () => {
  const family = projectKpEquationSurfaceFamily(
    kpTwoTimesOneCarrierAnimationId
  );
  assert.equal(family.rendererAdapterId,
    kpEditorCarrierPreservingSimplificationSurfaceAdapter.id);
  assert.equal(family.disposition, "adapter-backed");
  assert.equal(family.presentationRoute, "specialized-native-adapter");
  assert.equal(family.genericLayerTransition, "forbidden");
});
