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

test("makes current equation governance bypasses explicit", () => {
  const equations = inventory().entries.filter(({ domains }) =>
    domains.includes("equation")
  );
  assert.ok(equations.length > 0);
  assert.equal(equations.every(({ bypasses }) =>
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
