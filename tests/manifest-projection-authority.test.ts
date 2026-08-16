import assert from "node:assert/strict";
import test from "node:test";

import { createKpEquationAssetManifest } from
  "../src/architecture/equation-asset-manifest.ts";
import { createKpEquationSurfaceDispositionLedger } from
  "../src/architecture/equation-surface-disposition-ledger.ts";
import { createKpEquationSurfaceInventory } from
  "../src/architecture/equation-surface-inventory.ts";
import {
  kpManifestProjectionAuthorityDeclarations
} from "../src/architecture/manifest-projection-authority.ts";
import { createKpPostConvergenceInfrastructureInventory } from
  "../src/architecture/post-convergence-infrastructure-inventory.ts";
import { createKpAnimationCatalogueProjection } from
  "../src/editor/animation-catalogue-projection.ts";
import { equationAnimationCatalogEntries } from
  "../src/editor/equation-animation-catalog.ts";
import { listKpEquationAnimationSelections } from
  "../src/public/equation-animation-manifest.ts";

test("every manifest and projection fact has one provenance owner", () => {
  assert.equal(kpManifestProjectionAuthorityDeclarations.length, 7);
  assert.equal(
    new Set(kpManifestProjectionAuthorityDeclarations.map(
      ({ factId }) => factId
    )).size,
    kpManifestProjectionAuthorityDeclarations.length
  );
  assert.ok(kpManifestProjectionAuthorityDeclarations.every(
    ({ declarationOwnerPath, projectionPaths }) =>
      !projectionPaths.includes(declarationOwnerPath)
  ));
});

test("equation manifests and ledgers preserve the inventory exact set", () => {
  const inventoryIds = createKpEquationSurfaceInventory().entries.map(
    ({ animationId }) => animationId
  );
  const dispositionIds = createKpEquationSurfaceDispositionLedger().entries.map(
    ({ animationId }) => animationId
  );
  const manifestIds = createKpEquationAssetManifest().entries.map(
    ({ assetId }) => assetId
  );
  const catalogueIds = new Set(createKpAnimationCatalogueProjection().entries.map(
    ({ animationId }) => animationId
  ));

  assert.deepEqual(sorted(dispositionIds), sorted(inventoryIds));
  assert.deepEqual(sorted(manifestIds), sorted(inventoryIds));
  assert.ok(inventoryIds.every((animationId) => catalogueIds.has(animationId)));
});

test("aggregate counts are derived and the public SDK remains a separate exact set", () => {
  const infrastructure = createKpPostConvergenceInfrastructureInventory();
  const equationIds = createKpEquationSurfaceInventory().entries.map(
    ({ animationId }) => animationId
  );
  const sdkCatalogIds = equationAnimationCatalogEntries.map(({ id }) => id);
  const sdkSelectionIds = listKpEquationAnimationSelections().map(({ id }) => id);

  assert.equal(infrastructure.equationSurfaces.count, equationIds.length);
  assert.equal(
    infrastructure.catalogue.loadableAssetCount,
    createKpAnimationCatalogueProjection().entries.length
  );
  assert.deepEqual(sorted(sdkSelectionIds), sorted(sdkCatalogIds));
  assert.equal(
    equationIds.some((id) => (sdkSelectionIds as readonly string[]).includes(id)),
    false
  );
});

function sorted(values: readonly string[]): readonly string[] {
  return [...values].sort();
}
