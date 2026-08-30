import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPerUnitTaxWelfareAsset,
  kpPerUnitTaxWelfareAssetSchemaVersion
} from "../domains/economics/per-unit-tax-welfare-asset.ts";

test("supply-tax asset keeps original and buyer-facing supply distinct", () => {
  const asset = createKpPerUnitTaxWelfareAsset();
  assert.equal(asset.schemaVersion, kpPerUnitTaxWelfareAssetSchemaVersion);
  assert.deepEqual(asset.entities.curves.map(({ id, role, intercept }) => ({
    id,
    role,
    intercept
  })), [
    {
      id: "curve.economics.tax.demand",
      role: "demand",
      intercept: { numerator: "12", denominator: "1" }
    },
    {
      id: "curve.economics.tax.supply",
      role: "marginal-cost-supply",
      intercept: { numerator: "2", denominator: "1" }
    },
    {
      id: "curve.economics.tax.supply-with-tax",
      role: "buyer-facing-taxed-supply",
      intercept: { numerator: "6", denominator: "1" }
    }
  ]);
});

test("supply-tax welfare regions carry exact value and semantic boundaries", () => {
  const asset = createKpPerUnitTaxWelfareAsset();
  const byRole = Object.fromEntries(asset.entities.regions.map((region) => [
    region.id,
    region
  ]));
  assert.deepEqual(
    byRole["region.economics.tax.government-revenue"],
    {
      id: "region.economics.tax.government-revenue",
      kind: "welfare-region",
      role: "government-revenue",
      phase: "taxed",
      value: { numerator: "12", denominator: "1" },
      quantityInterval: {
        start: { numerator: "0", denominator: "1" },
        end: { numerator: "3", denominator: "1" }
      },
      upperBoundary: {
        kind: "price-level",
        entityId: "price.economics.tax.consumer"
      },
      lowerBoundary: {
        kind: "price-level",
        entityId: "price.economics.tax.producer"
      }
    }
  );
  assert.deepEqual(
    byRole["region.economics.tax.deadweight-loss"]?.quantityInterval,
    {
      start: { numerator: "3", denominator: "1" },
      end: { numerator: "5", denominator: "1" }
    }
  );
});

test("supply-tax correspondence and lineage references resolve semantically", () => {
  const asset = createKpPerUnitTaxWelfareAsset();
  const entityIds = new Set([
    ...asset.entities.curves.map(({ id }) => id),
    ...asset.entities.prices.map(({ id }) => id),
    ...asset.entities.regions.map(({ id }) => id),
    asset.entities.wedge.id,
    asset.model.states.untaxed.id,
    asset.model.states.taxed.id,
    asset.model.input.tax.id
  ]);
  for (const relation of [...asset.correspondences, ...asset.lineage]) {
    for (const id of [...relation.sourceEntityIds, ...relation.targetEntityIds]) {
      assert.ok(entityIds.has(id), `${relation.id} references missing ${id}`);
    }
  }
  assert.equal(
    asset.correspondences.find(({ id }) =>
      id.endsWith("supply-persists-as-marginal-cost"))?.relation,
    "persist"
  );
});

test("supply-tax semantic asset owns no geometry, paint, or timing fields", () => {
  const serialized = JSON.stringify(createKpPerUnitTaxWelfareAsset());
  for (const forbidden of [
    "durationMs",
    "progress",
    "color",
    "opacity",
    "viewBox",
    "pathData"
  ]) {
    assert.doesNotMatch(serialized, new RegExp(`\\"${forbidden}\\"`));
  }
});
