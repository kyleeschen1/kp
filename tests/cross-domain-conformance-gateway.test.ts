import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpAnimationConformanceManifestSet
} from "../src/architecture/animation-conformance-manifest.ts";
import {
  compileKpAnimationGovernanceInventory
} from "../src/architecture/animation-governance-inventory.ts";
import {
  compileKpAnimationGovernanceReverseDependencies
} from "../src/architecture/animation-governance-reverse-dependencies.ts";
import {
  compileKpCrossDomainConformanceGateway
} from "../src/architecture/cross-domain-conformance-gateway.ts";
import { kpEquationGovernanceV2MigrationDeclarations } from
  "../src/domain-ir/equation-governance-v2-migrations.ts";
import { createKpAnimationCatalogueProjection } from
  "../src/editor/animation-catalogue-projection.ts";
import { createKpEditorAnimationLibrary } from
  "../src/editor/animation-library.ts";
import { kpEditorSelectedSurfaceCapabilityDeclarationSet } from
  "../src/editor/selected-surface-capability-declarations.ts";
import { kpAnimationConformanceRegistrationDeclarations } from
  "../src/generated/animation-conformance-registrations.generated.ts";

function compile() {
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
    registrations: kpAnimationConformanceRegistrationDeclarations,
    reverseDependencies:
      compileKpAnimationGovernanceReverseDependencies(manifests),
    equationGrammarAssetIds:
      kpEquationGovernanceV2MigrationDeclarations.map(({ assetId }) => assetId)
  };
}

test("one common gateway covers graph, programming, diagram, and 3D", () => {
  const gateway = compileKpCrossDomainConformanceGateway(compile());
  assert.deepEqual(gateway.summary, {
    assetCount: 17,
    domainCounts: { graph: 8, programming: 6, diagram: 3 },
    threeDimensionalAssetCount: 1
  });
  assert.equal(gateway.entries.every(({ rendererAdapterIds }) =>
    rendererAdapterIds.length > 0
  ), true);
  assert.deepEqual(gateway.entries.filter(({ threeDimensional }) =>
    threeDimensional
  ).map(({ assetId }) => assetId), [
    "animation.graph.surface-mode.mesh-to-donut"
  ]);
});

test("equation grammar remains limited to mixed assets' equation segment", () => {
  const gateway = compileKpCrossDomainConformanceGateway(compile());
  assert.deepEqual(gateway.entries.filter(({ equationGovernance }) =>
    equationGovernance === "mixed-equation-segment"
  ).map(({ assetId }) => assetId), [
    "animation.comparison.linear-solve-programming",
    "animation.generated.linear-algebra.matrix-vector.two-by-two"
  ]);
  assert.equal(gateway.entries.filter(({ equationGovernance }) =>
    equationGovernance === "absent"
  ).length, 15);
});

test("pure cross-domain assets fail closed if routed through equation grammar", () => {
  const input = compile();
  assert.throws(() => compileKpCrossDomainConformanceGateway({
    ...input,
    equationGrammarAssetIds: [
      ...input.equationGrammarAssetIds,
      "animation.graph.surface-mode.mesh-to-donut"
    ]
  }), /pure graph but entered equation grammar v2/u);
});

test("the cross-domain gateway cannot eagerly import renderer families", async () => {
  const sources = await Promise.all([
    "../src/architecture/cross-domain-conformance-gateway.ts",
    "../src/animation/animation-conformance-registration.ts",
    "../src/generated/animation-conformance-registrations.generated.ts"
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  for (const source of sources) {
    assert.doesNotMatch(
      source,
      /(?:catalog-packs\/|codemirror|from ["']three|from ["']katex)/iu
    );
    assert.doesNotMatch(source, /import\(/u);
  }
  const loader = await readFile(new URL(
    "../src/animation/catalog-loader.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(loader, /^import .*catalog-packs\//mu);
});
