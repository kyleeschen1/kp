import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createKpAuthoredMarketSource } from "../src/experiments/typed-linear-supply-demand/authoring-market-source.ts";
import { createKpAuthoringMarketFrameSession } from "../src/experiments/authoring-market/authoring-market-frame.ts";
import { sampleKpEconomicsSupplyTaxAnimationFrame } from "../src/animation/economics-supply-tax-asset.ts";

test("state-derived frames exactly match canonical tax sampling across dense progress", () => {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  const session = createKpAuthoringMarketFrameSession(authored, { cacheCapacity: 2 });
  for (let index = 0; index <= 256; index++) {
    const sample = session.sample(index / 256);
    const canonical = sampleKpEconomicsSupplyTaxAnimationFrame({ asset: authored.source.canonical,
      progress: sample.frame.modelProgress });
    assert.deepEqual(sample.frame, canonical);
    assert.equal(sample.frame.market.quantity, sample.evaluation.market.quantity);
    assert.equal(sample.frame.welfare.deadweightLoss, sample.evaluation.deadweightLoss);
    assert.equal(sample.revisionId, authored.source.authority.revisionId);
  }
  assert.equal(session.history.snapshots.length, 3);
  session.dispose();
});

test("frame projection preserves variant truth, reverse seeks and cache independence", () => {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax", parameters: {
    demandPriceIntercept: { numerator: "14", denominator: "1" }, taxAmount: { numerator: "2", denominator: "1" }
  } });
  const session = createKpAuthoringMarketFrameSession(authored, { cacheCapacity: 1 });
  const samples = [0, 0.3, 0.7, 1];
  const forward = samples.map(progress => session.sample(progress));
  session.reset();
  assert.deepEqual([...samples].reverse().map(progress => session.sample(progress)), [...forward].reverse());
  for (const sample of forward) assert.deepEqual(sample.frame,
    sampleKpEconomicsSupplyTaxAnimationFrame({ asset: authored.source.canonical, progress: sample.frame.modelProgress }));
  const final = forward[3]!.frame;
  assert.deepEqual(final.market.quantity, { numerator: "5", denominator: "1" });
  assert.deepEqual(final.welfare.totalSurplus, { numerator: "35", denominator: "1" });
  assert.deepEqual(forward[0]!.frame.welfare.deadweightLoss, { numerator: "0", denominator: "1" });
  session.dispose();
  assert.throws(() => session.sample(0.5), /disposed/);
});

test("frame adapter projects evaluated economics without another sampler or calculator", () => {
  const source = readFileSync(new URL("../src/experiments/authoring-market/authoring-market-frame.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /sampleKpEconomics|sampleKpPerUnitTax|createKpPerUnitTaxWelfareAccounting|createKpPerUnitTaxWelfareModel|addKpRationals|multiplyKpRationals|divideKpRationals/);
  assert.equal(source.match(/query\.evaluate\(/g)?.length, 1);
});
