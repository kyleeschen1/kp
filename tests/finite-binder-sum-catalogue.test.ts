import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationAssets
} from "../src/animation/catalog.ts";
import {
  kpAnimationCatalogPackId,
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";
import {
  kpFiniteSumExpansionExemplarId
} from "../src/animation/finite-sum-expansion-exemplar.ts";
import {
  projectKpEquationSurfaceFamily
} from "../src/domain-ir/equation-surface-family-declarations.ts";
import {
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "../src/editor/animation-catalogue-route.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../src/editor/selected-surface-capability.ts";
import {
  kpEditorSelectedSurfaceCapabilityDeclarationSet
} from "../src/editor/selected-surface-capability-declarations.ts";

test("finite sum is reachable through one lazy Catalogue capability", async () => {
  const loaded = await loadKpAnimationAsset(kpFiniteSumExpansionExemplarId);
  assert.equal(kpAnimationCatalogPackId(kpFiniteSumExpansionExemplarId),
    "algebra");
  assert.equal(loaded.animation.id, kpFiniteSumExpansionExemplarId);
  assert.equal(createKpAnimationAssets().filter(
    ({ id }) => id === kpFiniteSumExpansionExemplarId
  ).length, 1);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: kpFiniteSumExpansionExemplarId,
    slotKinds: ["equation"]
  }), ["finite-binder-expansion"]);

  const capability = kpEditorSelectedSurfaceCapabilityDeclarationSet.find(
    "finite-binder-expansion"
  );
  assert.deepEqual(capability.adapterIds, [
    "editor-animation-surface.finite-sum-expansion.canonical-native-katex",
    "editor-animation-surface.finite-product-expansion.canonical-native-katex"
  ]);
});

test("finite sum keeps candidate presentation local at its visual checkpoint", () => {
  const projection = projectKpEquationSurfaceFamily(
    kpFiniteSumExpansionExemplarId
  );
  assert.equal(projection.primaryCapabilityId, "finite-binder-expansion");
  assert.equal(projection.disposition, "adapter-backed");
  assert.equal(projection.presentationRoute, "specialized-native-adapter");
  assert.equal(projection.genericLayerTransition, "forbidden");
  assert.deepEqual(projection.structuralRecipeIds, []);
});

test("finite sum playhead URL round-trips without running prior frames", () => {
  const search = writeKpAnimationCatalogueRoute("", {
    artifactId: kpFiniteSumExpansionExemplarId,
    playhead: 0.625
  });
  assert.deepEqual(readKpAnimationCatalogueRoute(search), {
    active: true,
    source: "default",
    artifactId: kpFiniteSumExpansionExemplarId,
    playhead: 0.63
  });
});
