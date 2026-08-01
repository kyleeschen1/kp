import assert from "node:assert/strict";
import test from "node:test";

import { loadKpAnimationAsset } from "../src/animation/catalog-loader.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  KP_ANIMATION_CATALOGUE_EXEMPLAR_ID,
  resolveKpAnimationCatalogueSelection
} from "../src/editor/animation-catalogue-selection.ts";

const projection = createKpAnimationCatalogueProjection();

test("default and explicit selection resolve the exact solve-x exemplar", () => {
  const defaultSelection = resolveKpAnimationCatalogueSelection({ projection });
  const routeSelection = resolveKpAnimationCatalogueSelection({
    projection,
    artifactId: KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
  });

  assert.equal(defaultSelection.status, "selected");
  assert.equal(defaultSelection.source, "default");
  assert.equal(routeSelection.status, "selected");
  assert.equal(routeSelection.source, "route");
  if (routeSelection.status !== "selected") assert.fail("Expected selection.");
  assert.deepEqual(
    {
      animationId: routeSelection.entry.animationId,
      descriptorId: routeSelection.entry.primaryDescriptorId,
      packId: routeSelection.entry.packId
    },
    {
      animationId: "animation.linear-solve.solve-x",
      descriptorId:
        "editor-animation.animation.linear-solve.solve-x",
      packId: "algebra"
    }
  );
});

test("the selected projection entry resolves the exact lazy asset", async () => {
  const selection = resolveKpAnimationCatalogueSelection({ projection });
  if (selection.status !== "selected") assert.fail("Expected selection.");
  const loaded = await loadKpAnimationAsset(selection.entry.animationId);

  assert.equal(loaded.animation.id, selection.entry.animationId);
  assert.equal(loaded.packId, selection.entry.packId);
});

test("sibling and unknown artifacts never silently replace the exemplar", () => {
  const sibling = resolveKpAnimationCatalogueSelection({
    projection,
    artifactId: "animation.generated.radical.square-root-as-power"
  });
  const unknown = resolveKpAnimationCatalogueSelection({
    projection,
    artifactId: "animation.unknown"
  });

  assert.equal(sibling.status, "deferred");
  assert.equal(
    sibling.status === "deferred" ? sibling.entry.animationId : undefined,
    "animation.generated.radical.square-root-as-power"
  );
  assert.deepEqual(unknown, {
    status: "not-found",
    source: "route",
    requestedArtifactId: "animation.unknown"
  });
});
