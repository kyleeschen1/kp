import assert from "node:assert/strict";
import test from "node:test";

import { createKpPerUnitTaxWelfareAsset } from
  "../domains/economics/per-unit-tax-welfare-asset.ts";
import {
  kpSupplyTaxGraphViewport,
  projectKpSupplyTaxBaselineSvg,
  renderKpSupplyTaxBaselineSvg
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
