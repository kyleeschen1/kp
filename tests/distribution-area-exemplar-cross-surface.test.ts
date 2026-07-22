import assert from "node:assert/strict";
import test from "node:test";

import { validateKpAssetBundle } from "../src/semantic/asset.ts";
import { kpDistributionAreaExemplarContract } from "../src/semantic/distribution-area-exemplar-contract.ts";
import {
  createKpDistributionAreaExemplarCrossSurfaceModel
} from "../src/semantic/distribution-area-exemplar-cross-surface.ts";

test("area exemplar links algebra factors and terms to geometric dimensions", () => {
  const model = createKpDistributionAreaExemplarCrossSurfaceModel();
  const links = new Map(model.links.map((link) => [link.conceptId, link]));

  assert.deepEqual(
    [...links.keys()],
    ["factor.3", "term.x", "term.2", "product.3x", "product.6"]
  );
  assert.match(links.get("factor.3")?.geometrySelectorIds[0] ?? "", /height\.factor\.3$/);
  assert.match(links.get("term.x")?.geometrySelectorIds[0] ?? "", /width\.term\.x$/);
  assert.match(links.get("term.2")?.geometrySelectorIds[0] ?? "", /width\.term\.2$/);
});

test("area exemplar links algebraic products to exactly the contracted regions", () => {
  const model = createKpDistributionAreaExemplarCrossSurfaceModel();
  const regionLinks = model.links.filter(({ conceptId }) => conceptId.startsWith("product."));

  assert.deepEqual(
    regionLinks.map(({ conceptId }) => conceptId),
    kpDistributionAreaExemplarContract.geometry.regions.map(
      ({ areaLatex }) => `product.${areaLatex}`
    )
  );
  assert.deepEqual(
    regionLinks.map(({ geometrySelectorIds }) => geometrySelectorIds.length),
    [1, 1]
  );
});

test("all cross-surface links resolve to exact semantic selectors", () => {
  const model = createKpDistributionAreaExemplarCrossSurfaceModel();
  const algebraSelectorIds = new Set(
    model.trace.bundle.objects.flatMap((object) =>
      object.selectors.map(({ id }) => id)
    )
  );
  const geometrySelectorIds = new Set(
    model.geometryBundle.objects.flatMap((object) =>
      object.selectors.map(({ id }) => id)
    )
  );

  assert.deepEqual(validateKpAssetBundle(model.geometryBundle), []);
  for (const link of model.links) {
    assert.ok(link.algebraSelectorIds.length > 0, link.id);
    assert.ok(link.geometrySelectorIds.length > 0, link.id);
    for (const selectorId of link.algebraSelectorIds) {
      assert.equal(algebraSelectorIds.has(selectorId), true, selectorId);
    }
    for (const selectorId of link.geometrySelectorIds) {
      assert.equal(geometrySelectorIds.has(selectorId), true, selectorId);
    }
  }
});

test("cross-surface semantics contain no renderer geometry or timing authority", () => {
  const model = createKpDistributionAreaExemplarCrossSurfaceModel();
  const serialized = JSON.stringify(model);

  for (const forbidden of ["durationMs", "viewBox", "pathData", "fontSize", "coordinates"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});
