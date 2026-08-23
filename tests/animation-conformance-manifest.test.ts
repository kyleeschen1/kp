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
import { createKpAnimationCatalogueProjection } from
  "../src/editor/animation-catalogue-projection.ts";
import { createKpEditorAnimationLibrary } from
  "../src/editor/animation-library.ts";
import { kpEditorSelectedSurfaceCapabilityDeclarationSet } from
  "../src/editor/selected-surface-capability-declarations.ts";

function manifests() {
  const assets = createKpAnimationAssets();
  const descriptors = createKpEditorAnimationLibrary();
  const inventory = compileKpAnimationGovernanceInventory({
    assets,
    catalogue: createKpAnimationCatalogueProjection({ descriptors }),
    descriptors,
    capabilityDeclarations: kpEditorSelectedSurfaceCapabilityDeclarationSet
  });
  return compileKpAnimationConformanceManifestSet({ assets, inventory });
}

test("every loadable asset has one renderer-neutral conformance manifest", () => {
  const result = manifests();
  assert.equal(result.manifests.length, createKpAnimationAssets().length);
  assert.equal(
    new Set(result.manifests.map(({ assetId }) => assetId)).size,
    result.manifests.length
  );
  for (const manifest of result.manifests) {
    assert.ok(manifest.domains.length > 0);
    assert.ok(manifest.semanticAuthority.transformationIds.length > 0);
    assert.ok(manifest.projection.adapterIds.length > 0);
    assert.equal(manifest.clock.authority, "kp-animation-runtime-clock");
    assert.deepEqual(manifest.policy.requiredPrincipleIds, [
      "principle.animation.semantic-lineage-authority",
      "principle.animation.deterministic-single-clock"
    ]);
  }
});

test("current equation gaps are explicit compatibility, not silent conformance", () => {
  const equationManifests = manifests().manifests.filter(({ domains }) =>
    domains.includes("equation")
  );
  assert.ok(equationManifests.length > 0);
  assert.equal(equationManifests.every(({ disposition }) =>
    disposition.status === "compatibility" &&
    disposition.gapCodes.includes("equation-grammar-v2-missing") &&
    disposition.gapCodes.includes("typography-policy-implicit")
  ), true);
});

test("manifest schema cannot carry renderer geometry or styling resources", () => {
  const forbidden = new Set([
    "coordinates",
    "css",
    "dom",
    "element",
    "height",
    "path",
    "rendererResource",
    "width",
    "x",
    "y"
  ]);
  for (const manifest of manifests().manifests) {
    visit(manifest, (key) => {
      assert.equal(forbidden.has(key), false, `${manifest.assetId} owns ${key}`);
    });
  }
});

test("committed conformance manifest matches deterministic compilation", async () => {
  const generated = JSON.parse(await readFile(
    new URL(
      "../src/architecture/animation-conformance-manifest.generated.json",
      import.meta.url
    ),
    "utf8"
  ));
  assert.deepEqual(generated, manifests());
});

function visit(value: unknown, checkKey: (key: string) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, checkKey);
    return;
  }
  if (value === null || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    checkKey(key);
    visit(child, checkKey);
  }
}
