import assert from "node:assert/strict";
import test from "node:test";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { prepareKpAuthoringMarketPreview, KpAuthoringMarketPresentationGap } from "../src/experiments/authoring-market/authoring-market-preview-prepare.ts";
import { projectKpSupplyTaxBaselineSvg, projectKpSupplyTaxWelfareRegionsSvg, kpSupplyTaxGraphViewport } from "../src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-svg.ts";
import { createKpSemanticStateQuerySession } from "../src/semantic-state/authoring-query-session.ts";
import { encodeKpSemanticStateCompositionLogicalAddress } from "../src/semantic-state/state-family-composition-address.ts";

test("separately identified variant preserves ordered exact demand and tax history", () => {
  const canonical = buildKpAuthoringMarketPreview("reference");
  const variation = buildKpAuthoringMarketPreview("variation");
  assert.notEqual(variation.specimen.id, canonical.specimen.id);
  assert.notEqual(variation.article.modelRevisionId, canonical.article.modelRevisionId);
  const prepared = prepareKpAuthoringMarketPreview(variation);
  const query = createKpSemanticStateQuerySession(prepared.authored.packet.explanation);
  const records = prepared.facts.checkpoints;
  const actual = records.map(record => {
    const value = query.evaluate(record.address, prepared.authored.packet.stateHandles.refs.outcomes.evaluation);
    assert.deepEqual(value, record.evaluation);
    const { market, accounting } = value;
    return [market.quantity, market.consumerPrice, market.producerPrice, market.taxAmount, accounting.totalSurplus]
      .map(dto => Number(dto.numerator) / Number(dto.denominator));
  });
  // Independently worked endpoints for P_d=12-Q -> 14-Q, P_s=2+Q,
  // then t=2: Q=(14-2-2)/2=5 and GR=2*5=10.
  assert.deepEqual(actual, [[5, 7, 7, 0, 25], [6, 8, 8, 0, 36], [5, 9, 7, 2, 35]]);
  assert.equal(prepared.facts.text("after.revenue"), "10");
  assert.equal(new Set(records.map(record => encodeKpSemanticStateCompositionLogicalAddress(record.address))).size, 3);
  assert.match(variation.article.text, /intercept changes from \$12\$ to \$14\$/);
  assert.match(variation.article.text, /Q=5\$ and \$P=7/);
  assert.match(variation.article.text, /Q_0=6\$ and \$P_0=8/);
  assert.match(variation.article.text, /2\\cdot5=10/);
  assert.equal(prepared.specimen.demandPresentation, "settled-history");
  assert.equal(prepared.companion.score.beats.filter(beat => beat.transitionFromPrevious !== "none").length, 1);
  query.dispose();
});

test("variant baseline and welfare geometry recompute inside the declared graph extent", () => {
  const prepared = prepareKpAuthoringMarketPreview(buildKpAuthoringMarketPreview("variation"));
  const semantics = prepared.authored.source.canonical.semantics;
  const baseline = projectKpSupplyTaxBaselineSvg(semantics);
  const reference = projectKpSupplyTaxBaselineSvg();
  assert.notDeepEqual(baseline.demand, reference.demand);
  assert.notDeepEqual(baseline.equilibrium, reference.equilibrium);
  const { left, right, top, bottom, width, height } = kpSupplyTaxGraphViewport;
  for (const point of [baseline.demand.start, baseline.demand.end, baseline.supply.start,
    baseline.supply.end, baseline.equilibrium.point,
    ...projectKpSupplyTaxWelfareRegionsSvg(semantics).regions.flatMap(region => region.points)]) {
    assert.ok(point.x >= left && point.x <= width - right);
    assert.ok(point.y >= top && point.y <= height - bottom);
  }
  assert.equal(baseline.equilibrium.point.x, left + (6 / 8) * (width - left - right));
});

test("unsupported demand motion fails explicitly rather than borrowing the tax sampler", () => {
  const data = buildKpAuthoringMarketPreview("variation");
  assert.throws(() => prepareKpAuthoringMarketPreview({ ...data, specimen: { ...data.specimen,
    // @ts-expect-error Animated demand has no supported projection in this exemplar.
    demandPresentation: "motion"
  } }), KpAuthoringMarketPresentationGap);
});
