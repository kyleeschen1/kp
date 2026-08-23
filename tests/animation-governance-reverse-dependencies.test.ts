import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { compileKpAnimationConformanceManifestSet } from
  "../src/architecture/animation-conformance-manifest.ts";
import { compileKpAnimationGovernanceInventory } from
  "../src/architecture/animation-governance-inventory.ts";
import {
  compileKpAnimationGovernanceReverseDependencies,
  resolveKpAnimationReviewInvalidations
} from "../src/architecture/animation-governance-reverse-dependencies.ts";
import { createKpAnimationCatalogueProjection } from
  "../src/editor/animation-catalogue-projection.ts";
import { createKpEditorAnimationLibrary } from
  "../src/editor/animation-library.ts";
import { kpEditorSelectedSurfaceCapabilityDeclarationSet } from
  "../src/editor/selected-surface-capability-declarations.ts";

function graphInputs() {
  const assets = createKpAnimationAssets();
  const descriptors = createKpEditorAnimationLibrary();
  const inventory = compileKpAnimationGovernanceInventory({
    assets,
    catalogue: createKpAnimationCatalogueProjection({ descriptors }),
    descriptors,
    capabilityDeclarations: kpEditorSelectedSurfaceCapabilityDeclarationSet
  });
  const manifests = compileKpAnimationConformanceManifestSet({
    assets,
    inventory
  });
  return {
    manifests,
    graph: compileKpAnimationGovernanceReverseDependencies(manifests)
  };
}

test("structured manifests generate reverse dependencies for every authority kind", () => {
  const { manifests, graph } = graphInputs();
  assert.equal(graph.assetCount, manifests.manifests.length);
  assert.deepEqual(
    [...new Set(graph.dependencies.map(({ kind }) => kind))].sort(),
    ["motif", "principle", "renderer", "typography-policy"]
  );
  const clock = graph.dependencies.find(({ dependencyId }) =>
    dependencyId === "principle.animation.deterministic-single-clock"
  )!;
  assert.equal(clock.callerAssetIds.length, manifests.manifests.length);
});

test("dependency changes identify callers and review invalidations exactly", () => {
  const { graph } = graphInputs();
  const equationRenderer = graph.dependencies.find(({ dependencyId }) =>
    dependencyId.includes("native-katex")
  );
  assert.ok(equationRenderer);
  const invalidations = resolveKpAnimationReviewInvalidations({
    graph,
    changedDependencyIds: [equationRenderer.dependencyId]
  });
  assert.deepEqual(
    invalidations.affectedAssetIds,
    equationRenderer.callerAssetIds
  );
  assert.deepEqual(invalidations.causes, [{
    dependencyId: equationRenderer.dependencyId,
    kind: equationRenderer.kind
  }]);
});

test("graph reads explicit dependency declarations rather than source imports", () => {
  const { manifests } = graphInputs();
  const first = manifests.manifests[0]!;
  const modified = {
    ...manifests,
    manifests: [{
      ...first,
      dependencies: {
        ...first.dependencies,
        motifIds: ["motif.test.structured-declaration"]
      }
    }, ...manifests.manifests.slice(1)]
  };
  const graph = compileKpAnimationGovernanceReverseDependencies(modified);
  assert.deepEqual(
    graph.dependencies.find(({ dependencyId }) =>
      dependencyId === "motif.test.structured-declaration"
    )?.callerAssetIds,
    [first.assetId]
  );
});

test("committed reverse dependency graph matches compilation", async () => {
  const generated = JSON.parse(await readFile(new URL(
    "../src/architecture/animation-governance-reverse-dependencies.generated.json",
    import.meta.url
  ), "utf8"));
  assert.deepEqual(generated, graphInputs().graph);
});
