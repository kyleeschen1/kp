import assert from "node:assert/strict";
import test from "node:test";

import { createKpPerUnitTaxWelfareAsset } from
  "../domains/economics/per-unit-tax-welfare-asset.ts";
import { sampleKpPerUnitTaxWelfareFrame } from
  "../domains/economics/per-unit-tax-welfare-frame.ts";
import {
  kpSupplyTaxGraphViewport,
  projectKpSupplyTaxBaselineSvg,
  projectKpSupplyTaxTransitSvg,
  projectKpSupplyTaxWelfareRegionsSvg,
  renderKpSupplyTaxInteractiveSvg,
  renderKpSupplyTaxBaselineSvg,
  renderKpSupplyTaxWelfareLedger
} from "../src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-svg.ts";

test("baseline SVG geometry projects exact semantic curves and equilibrium", () => {
  const semantics = createKpPerUnitTaxWelfareAsset();
  const projection = projectKpSupplyTaxBaselineSvg(semantics);
  const plotRight = kpSupplyTaxGraphViewport.width - kpSupplyTaxGraphViewport.right;
  const plotBottom = kpSupplyTaxGraphViewport.height - kpSupplyTaxGraphViewport.bottom;

  assert.deepEqual(projection.demand.start, { x: 64, y: 67.14285714285717 });
  assert.deepEqual(projection.supply.start, { x: 64, y: 282.8571428571429 });
  assert.equal(projection.demand.end.x, plotRight);
  assert.equal(projection.supply.end.x, plotRight);
  assert.deepEqual(projection.equilibrium.point, { x: 430.25, y: 175 });
  assert.equal(plotBottom, 326);
  assert.equal(projection.equilibrium.entityId, semantics.model.states.untaxed.id);
});

test("baseline SVG retains semantic identities independent of paint order", () => {
  const semantics = createKpPerUnitTaxWelfareAsset();
  const svg = renderKpSupplyTaxBaselineSvg(semantics);

  assert.match(svg, new RegExp(`data-kp-supply-tax-entity="${semantics.model.input.demand.id}"`, "u"));
  assert.match(svg, new RegExp(`data-kp-supply-tax-entity="${semantics.model.input.supply.id}"`, "u"));
  assert.match(svg, new RegExp(`data-kp-supply-tax-entity="${semantics.model.states.untaxed.id}"`, "u"));
  assert.doesNotMatch(svg, new RegExp(`data-kp-supply-tax-entity="${semantics.model.input.supply.taxedId}"`, "u"));
  assert.doesNotMatch(svg, /nth-child/u);
});

test("every visible graph label is rendered through KaTeX", () => {
  const svg = renderKpSupplyTaxBaselineSvg();
  const labels = [...svg.matchAll(/data-kp-supply-tax-math-label="([^"]+)"/gu)]
    .map((match) => match[1]);

  assert.equal(labels.length, 21);
  assert.ok(labels.includes("quantity-axis"));
  assert.ok(labels.includes("price-axis"));
  assert.ok(labels.includes("demand"));
  assert.ok(labels.includes("supply"));
  assert.ok(labels.includes("untaxed-equilibrium"));
  assert.doesNotMatch(svg, /<text(?:\s|>)/u);
  assert.equal((svg.match(/class="katex"/gu) ?? []).length, labels.length);
});

test("baseline graph provides one accessible image description", () => {
  const svg = renderKpSupplyTaxBaselineSvg();

  assert.match(svg, /role="img"/u);
  assert.match(svg, /<title[^>]*>Untaxed supply and demand equilibrium<\/title>/u);
  assert.match(svg, /<desc[^>]*>Demand P equals 12 minus Q/u);
  assert.match(svg, /data-kp-supply-tax-svg-state="baseline-market"/u);
});

test("tax transit shifts buyer-facing supply while original supply stays fixed", () => {
  const semantics = createKpPerUnitTaxWelfareAsset();
  const projectionAt = (numerator: string) => projectKpSupplyTaxTransitSvg({
    semantics,
    frame: sampleKpPerUnitTaxWelfareFrame({
      asset: semantics,
      progress: { numerator, denominator: "2" }
    })
  });
  const start = projectionAt("0");
  const middle = projectionAt("1");
  const end = projectionAt("2");

  assert.deepEqual(start.originalSupply, middle.originalSupply);
  assert.deepEqual(middle.originalSupply, end.originalSupply);
  assert.equal(start.buyerFacingSupply.present, false);
  assert.equal(start.buyerFacingSupply.opacity, 0);
  assert.equal(middle.buyerFacingSupply.present, true);
  assert.equal(middle.buyerFacingSupply.opacity, 1);
  assert.ok(middle.buyerFacingSupply.start.y < start.buyerFacingSupply.start.y);
  assert.ok(end.buyerFacingSupply.start.y < middle.buyerFacingSupply.start.y);
  assert.equal(end.buyerFacingSupply.end.y, kpSupplyTaxGraphViewport.top);
});

test("interactive SVG retains both supply identities in separate groups", () => {
  const semantics = createKpPerUnitTaxWelfareAsset();
  const svg = renderKpSupplyTaxInteractiveSvg(semantics);

  assert.equal(count(svg, `data-kp-supply-tax-entity="${semantics.model.input.supply.id}"`), 1);
  assert.equal(count(svg, `data-kp-supply-tax-entity="${semantics.model.input.supply.taxedId}"`), 1);
  assert.match(svg, /data-kp-supply-tax-math-label="taxed-supply"/u);
  assert.match(svg, /data-kp-presence="false" style="opacity:0"/u);
  assert.doesNotMatch(svg, /createKpReaderTimelinePlaybackClock/u);
});

test("forward and rewind project identical tax geometry at the same model state", () => {
  const semantics = createKpPerUnitTaxWelfareAsset();
  const forward = projectKpSupplyTaxTransitSvg({
    semantics,
    frame: sampleKpPerUnitTaxWelfareFrame({
      asset: semantics,
      progress: { numerator: "1", denominator: "4" },
      direction: "forward"
    })
  });
  const rewind = projectKpSupplyTaxTransitSvg({
    semantics,
    frame: sampleKpPerUnitTaxWelfareFrame({
      asset: semantics,
      progress: { numerator: "3", denominator: "4" },
      direction: "rewind"
    })
  });

  assert.deepEqual(rewind, forward);
});

test("taxed market projects exact equilibrium, incidence, guides, and wedge", () => {
  const semantics = createKpPerUnitTaxWelfareAsset();
  const projection = projectKpSupplyTaxTransitSvg({
    semantics,
    frame: sampleKpPerUnitTaxWelfareFrame({
      asset: semantics,
      progress: { numerator: "1", denominator: "1" }
    })
  });

  assert.equal(projection.market.entityId, semantics.model.states.taxed.id);
  assert.equal(projection.market.wedgeEntityId, semantics.entities.wedge.id);
  assert.equal(projection.market.quantity, 3);
  assert.equal(projection.market.consumerPrice, 9);
  assert.equal(projection.market.producerPrice, 5);
  assert.equal(projection.market.priceWedge, 4);
  assert.equal(projection.market.equilibriumPoint.x,
    projection.market.producerPoint.x);
  assert.equal(projection.market.consumerPriceAxisPoint.y,
    projection.market.equilibriumPoint.y);
  assert.equal(projection.market.producerPriceAxisPoint.y,
    projection.market.producerPoint.y);
  assert.equal(projection.market.quantityAxisPoint.x,
    projection.market.equilibriumPoint.x);
  const pixelsPerPriceUnit = (kpSupplyTaxGraphViewport.height -
    kpSupplyTaxGraphViewport.bottom - kpSupplyTaxGraphViewport.top) / 14;
  assert.ok(Math.abs(projection.market.producerPoint.y -
    projection.market.equilibriumPoint.y - 4 * pixelsPerPriceUnit) < 1e-9);
});

test("interactive SVG contains one exact taxed-market view with KaTeX labels", () => {
  const semantics = createKpPerUnitTaxWelfareAsset();
  const svg = renderKpSupplyTaxInteractiveSvg(semantics);

  assert.equal(count(svg,
    `data-kp-supply-tax-entity="${semantics.model.states.taxed.id}"`), 1);
  assert.equal(count(svg,
    `data-kp-supply-tax-entity="${semantics.entities.wedge.id}"`), 1);
  for (const role of ["taxed-equilibrium", "consumer-price", "producer-price",
    "taxed-quantity", "tax-wedge"]) {
    assert.equal(count(svg, `data-kp-supply-tax-math-label="${role}"`), 1);
  }
  assert.match(svg, /data-kp-supply-tax-market-mark="wedge"/u);
  assert.match(svg, /data-kp-supply-tax-market-mark="quantity-guide"/u);
  assert.doesNotMatch(svg, /<text(?:\s|>)/u);
});

test("welfare polygons project every semantic region boundary without owning value truth", () => {
  const semantics = createKpPerUnitTaxWelfareAsset();
  const projection = projectKpSupplyTaxWelfareRegionsSvg(semantics);

  assert.equal(projection.regions.length, semantics.entities.regions.length);
  for (const semanticRegion of semantics.entities.regions) {
    const projected = projection.regions.find(({ entityId }) =>
      entityId === semanticRegion.id);
    assert.ok(projected);
    assert.equal(projected.phase, semanticRegion.phase);
    assert.equal(projected.role, semanticRegion.role);
    assert.deepEqual(projected.value, semanticRegion.value);
    assert.equal(projected.points.length, 4);
  }
  const deadweightLoss = projection.regions.find(({ role }) =>
    role === "deadweight-loss");
  assert.ok(deadweightLoss);
  assert.deepEqual(deadweightLoss.points[1], deadweightLoss.points[2]);
});

test("interactive SVG retains each welfare region exactly once and initially absent", () => {
  const semantics = createKpPerUnitTaxWelfareAsset();
  const svg = renderKpSupplyTaxInteractiveSvg(semantics);
  for (const region of semantics.entities.regions) {
    assert.equal(count(svg, `data-kp-supply-tax-entity="${region.id}"`), 1);
  }
  assert.equal(count(svg, 'class="kp-supply-tax-graph__region '), 6);
  assert.equal(count(svg, 'data-kp-supply-tax-region-phase="untaxed"'), 2);
  assert.equal(count(svg, 'data-kp-supply-tax-region-phase="taxed"'), 4);
  assert.equal(count(svg, 'data-kp-presence="false" points='), 6);
});

test("welfare ledger reads exact before and after values from semantic regions", () => {
  const semantics = createKpPerUnitTaxWelfareAsset();
  const html = renderKpSupplyTaxWelfareLedger(semantics);

  assert.match(html, /aria-label="Exact welfare accounting"/u);
  assert.equal(count(html, "kp-supply-tax-ledger__row"), 4);
  for (const region of semantics.entities.regions) {
    assert.equal(count(html, `data-kp-supply-tax-entity="${region.id}"`), 1);
  }
  assert.equal(count(html, 'data-kp-supply-tax-ledger-zero="true"'), 2);
  assert.equal(count(html, 'data-kp-exact-value="25/2"'), 2);
  assert.equal(count(html, 'data-kp-exact-value="9/2"'), 2);
  assert.equal(count(html, 'data-kp-exact-value="12/1"'), 1);
  assert.equal(count(html, 'data-kp-exact-value="4/1"'), 1);
});

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
