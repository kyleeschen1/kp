import assert from "node:assert/strict";
import test from "node:test";
import generatedInventory from
  "../src/architecture/equation-surface-inventory.generated.json" with {
    type: "json"
  };
import {
  compileKpEquationSurfaceInventory,
  createKpEquationSurfaceInventory,
  KpEquationSurfaceInventoryError,
  kpPostBaselineEquationSurfaceIds
} from "../src/architecture/equation-surface-inventory.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../src/editor/animation-library-display-catalog.ts";

test("generated inventory matches all current equation catalogue surfaces", () => {
  const inventory = createKpEquationSurfaceInventory();
  const catalogue = createKpAnimationCatalogueProjection();
  const catalogueEquationIds = catalogue.entries
    .filter(({ renderTargetKinds }) => renderTargetKinds.includes("equation"))
    .map(({ animationId }) => animationId);

  assert.deepEqual(generatedInventory, inventory);
  // Twenty-four is historical evidence from the cited snapshot, not a live
  // catalogue total. Current closure is exact set equality below.
  assert.equal(inventory.baseline.historicalCount, 24);
  assert.equal(inventory.baseline.currentCount, inventory.entries.length);
  assert.deepEqual(
    inventory.baseline.postBaselineAnimationIds,
    kpPostBaselineEquationSurfaceIds
  );
  assert.deepEqual(
    new Set(inventory.entries.map(({ animationId }) => animationId)),
    new Set(catalogueEquationIds)
  );
  assert.equal(
    inventory.entries.every(({ currentPresentationAuthority }) =>
      currentPresentationAuthority.href.length > 0
    ),
    true
  );
});

test("inventory rejects duplicate catalogue animation ids", () => {
  const catalogue = createKpAnimationCatalogueProjection();
  const duplicate = catalogue.entries.find(({ renderTargetKinds }) =>
    renderTargetKinds.includes("equation")
  )!;

  assert.throws(
    () => compileKpEquationSurfaceInventory({
      catalogue: {
        ...catalogue,
        entries: [...catalogue.entries, duplicate]
      },
      display: createKpAnimationLibraryDisplayCatalog()
    }),
    (error: unknown) =>
      error instanceof KpEquationSurfaceInventoryError &&
      error.diagnostics.some(({ code }) =>
        code === "duplicate-catalogue-animation-id"
      )
  );
});

test("inventory rejects missing display identities and primary routes", () => {
  const catalogue = createKpAnimationCatalogueProjection();
  const display = createKpAnimationLibraryDisplayCatalog();
  const equationId = catalogue.entries.find(({ renderTargetKinds }) =>
    renderTargetKinds.includes("equation")
  )!.animationId;

  assert.throws(
    () => compileKpEquationSurfaceInventory({
      catalogue,
      display: display.filter(({ animationId }) => animationId !== equationId)
    }),
    (error: unknown) =>
      error instanceof KpEquationSurfaceInventoryError &&
      error.diagnostics.some(({ code }) => code === "missing-display-entry")
  );

  assert.throws(
    () => compileKpEquationSurfaceInventory({
      catalogue,
      display: display.map((entry) => entry.animationId === equationId
        ? { ...entry, primaryRepresentationId: "missing-representation" }
        : entry)
    }),
    (error: unknown) =>
      error instanceof KpEquationSurfaceInventoryError &&
      error.diagnostics.some(({ code }) =>
        code === "missing-primary-representation"
      )
  );
});
