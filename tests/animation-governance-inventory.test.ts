import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpAnimationGovernanceInventory
} from "../src/architecture/animation-governance-inventory.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  kpEditorSelectedSurfaceCapabilityDeclarationSet
} from "../src/editor/selected-surface-capability-declarations.ts";
import {
  kpEquationGovernanceV2MigrationDeclarations
} from "../src/domain-ir/equation-governance-v2-migrations.ts";

function inventory() {
  const descriptors = createKpEditorAnimationLibrary();
  return compileKpAnimationGovernanceInventory({
    assets: createKpAnimationAssets(),
    catalogue: createKpAnimationCatalogueProjection({ descriptors }),
    descriptors,
    capabilityDeclarations: kpEditorSelectedSurfaceCapabilityDeclarationSet
  });
}

test("classifies every loadable asset without starting a runtime", () => {
  const result = inventory();
  assert.equal(result.entries.length, createKpAnimationAssets().length);
  assert.equal(result.summary.assetCount, result.entries.length);
  assert.equal(result.summary.unsupportedAssetCount, 0);
  assert.equal(
    result.entries.some(({ renderer }) => renderer.authority === "unclassified"),
    false
  );
  assert.equal(
    result.entries.every(({ domains }) => domains.length > 0),
    true
  );
});

test("distinguishes migrated equation governance from explicit compatibility", () => {
  const equations = inventory().entries.filter(({ domains }) =>
    domains.includes("equation")
  );
  const migratedIds = new Set(
    kpEquationGovernanceV2MigrationDeclarations.map(({ assetId }) => assetId)
  );
  const migrated = equations.filter(({ assetId }) => migratedIds.has(assetId));
  const compatibility = equations.filter(({ assetId }) =>
    !migratedIds.has(assetId));
  assert.ok(equations.length > 0);
  assert.equal(migrated.length, migratedIds.size);
  assert.equal(migrated.every(({ bypasses, typography }) =>
    !bypasses.includes("equation-grammar-v2-missing") &&
    !bypasses.includes("typography-policy-implicit") &&
    !bypasses.includes("specialized-equation-adapter-direct") &&
    typography.mathStyle === "governance-policy-v2" &&
    typography.opticalScale === "governance-policy-v2"
  ), true);
  assert.equal(compatibility.every(({ bypasses }) =>
    bypasses.includes("equation-grammar-v2-missing") &&
    bypasses.includes("typography-policy-implicit")
  ), true);
  assert.equal(equations.every(({ renderer }) =>
    renderer.capabilityIds.length > 0 && renderer.adapterIds.length > 0
  ), true);
});

test("committed inventory matches the deterministic compiler", async () => {
  const generated = JSON.parse(await readFile(
    new URL(
      "../src/architecture/animation-governance-inventory.generated.json",
      import.meta.url
    ),
    "utf8"
  ));
  assert.deepEqual(generated, inventory());
});
