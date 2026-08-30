import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEconomicsSupplyTaxAnimationAsset,
  KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID,
  KP_ECONOMICS_SUPPLY_TAX_TRANSFORMATION_ID,
  sampleKpEconomicsSupplyTaxAnimationFrame
} from "../src/animation/economics-supply-tax-asset.ts";
import { validateKpAnimationAsset } from "../src/animation/asset.ts";

const exact = (numerator: string, denominator = "1") => ({
  numerator,
  denominator
});

test("supply-tax animation asset closes every semantic reference", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  assert.equal(authority.id, KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID);
  assert.deepEqual(validateKpAnimationAsset(authority.animation), []);
  assert.equal(authority.animation.transformations[0]?.id,
    KP_ECONOMICS_SUPPLY_TAX_TRANSFORMATION_ID);
  assert.deepEqual(authority.animation.timeline, {
    id: "timeline.economics.supply-tax-welfare",
    durationMs: 960,
    beatCount: 32,
    markerIds: [
      "marker.economics.supply-tax.untaxed",
      "marker.economics.supply-tax.transit",
      "marker.economics.supply-tax.taxed"
    ]
  });
});

test("supply-tax transformation retains original supply and introduces taxed supply", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const transformation = authority.animation.transformations[0]!;
  const supplyId = "curve.economics.tax.supply";
  const taxedSupplyId = "curve.economics.tax.supply-with-tax";
  assert.ok(transformation.sourceObjectIds.includes(supplyId));
  assert.ok(transformation.targetObjectIds.includes(supplyId));
  assert.ok(!transformation.sourceObjectIds.includes(taxedSupplyId));
  assert.ok(transformation.targetObjectIds.includes(taxedSupplyId));
  assert.ok(transformation.correspondence.some((record) =>
    record.sourceSelectorId === `${supplyId}.body` &&
    record.targetSelectorId === `${supplyId}.body` &&
    record.preserves.includes("identity")
  ));
});

test("supply-tax animation delegates samples to exact semantic frames", () => {
  const asset = createKpEconomicsSupplyTaxAnimationAsset();
  const midpoint = sampleKpEconomicsSupplyTaxAnimationFrame({
    asset,
    progress: exact("1", "2")
  });
  const rewindMidpoint = sampleKpEconomicsSupplyTaxAnimationFrame({
    asset,
    direction: "rewind",
    progress: exact("1", "2")
  });
  assert.deepEqual(midpoint.market, {
    taxAmount: exact("2"),
    quantity: exact("4"),
    consumerPrice: exact("8"),
    producerPrice: exact("6"),
    priceWedge: exact("2")
  });
  assert.deepEqual(rewindMidpoint.market, midpoint.market);
});

test("supply-tax render target names existing clock and semantic authority", () => {
  const authority = createKpEconomicsSupplyTaxAnimationAsset();
  const target = authority.animation.renderTargets[0]!;
  assert.equal(target.metadata?.["clockAuthority"],
    "reader-timeline-playback-clock");
  assert.equal(target.metadata?.["semanticAuthorityId"], authority.semantics.id);
  assert.equal(target.metadata?.["originalSupplyId"],
    "curve.economics.tax.supply");
});
