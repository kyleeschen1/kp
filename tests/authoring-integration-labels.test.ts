import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredMarketSource } from "../src/tutorial/typed-linear-supply-demand/authoring-market-source.ts";
import { createKpAuthoringMarketFrameSession } from "../src/tutorial/authoring-market/authoring-market-frame.ts";
import { renderKpSupplyTaxInteractiveSvg, renderKpSupplyTaxWelfareLedger } from "../src/tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax-svg.ts";
import { renderLatexToHtml } from "../src/rendering/katex-adapter.ts";

test("existing native labels derive baseline and target values from the authored revision", () => {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax", parameters: {
    demandPriceIntercept: { numerator: "14", denominator: "1" }, taxAmount: { numerator: "2", denominator: "1" }
  } });
  const html = renderKpSupplyTaxInteractiveSvg(authored.source.canonical.semantics);
  for (const latex of ["E_0=(6,8)", "P_c=9", "P_p=7", "Q_t=5", "t=P_c-P_p=2"]) {
    assert.ok(html.includes(renderLatexToHtml(latex, { displayMode: false })), latex);
  }
  assert.ok(html.includes("quantity 6 and price 8"));
  assert.ok(html.includes("Demand P equals 14 minus Q"));
  assert.ok(!html.includes("E_0=(5,7)"));
});

test("the explicit before/after ledger equals the same revision's frame endpoints", () => {
  for (const parameters of [undefined, {
    demandPriceIntercept: { numerator: "14", denominator: "1" }, taxAmount: { numerator: "2", denominator: "1" }
  }]) {
    const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax", ...(parameters ? { parameters } : {}) });
    const frames = createKpAuthoringMarketFrameSession(authored);
    const before = frames.sample(0).frame.welfare;
    const after = frames.sample(1).frame.welfare;
    const html = renderKpSupplyTaxWelfareLedger(authored.source.canonical.semantics);
    const values = [...html.matchAll(/data-kp-exact-value="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(values, [before.consumerSurplus, after.consumerSurplus, before.producerSurplus,
      after.producerSurplus, before.governmentRevenue, after.governmentRevenue,
      before.deadweightLoss, after.deadweightLoss].map(value => `${value.numerator}/${value.denominator}`));
    assert.ok(html.includes("<span>Before</span><span>After</span>"));
    frames.dispose();
  }
});
