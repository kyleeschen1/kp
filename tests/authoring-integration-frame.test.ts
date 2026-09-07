import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createKpAuthoredMarketSource } from "../src/tutorial/typed-linear-supply-demand/authoring-market-source.ts";
import { createKpAuthoringMarketFrameSession } from "../src/tutorial/authoring-market/authoring-market-frame.ts";
import { sampleKpEconomicsSupplyTaxAnimationFrame } from "../src/animation/economics-supply-tax-asset.ts";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { prepareKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-prepare.ts";
import { projectKpSupplyTaxSceneTransition } from "../src/tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax-scene.ts";

test("revision-owned model, formulas, prose and attention survive eviction and other specimen inspection", () => {
  const prepared = ["reference", "variation"].map(name => prepareKpAuthoringMarketPreview(
    buildKpAuthoringMarketPreview(name as "reference" | "variation")));
  const sessions = prepared.map(item => createKpAuthoringMarketFrameSession(item.authored, { cacheCapacity: 1 }));
  const view = (index: number, progress: number) => {
    const item = prepared[index]!;
    return { sampled: sessions[index]!.sample(progress), text: item.boundArticle.text,
      formulas: item.companion.stageFacts,
      attention: projectKpSupplyTaxSceneTransition({ from: item.companion.stops[1]!.scene,
        to: item.companion.stops[2]!.scene, progress, profile: "scrub" }) };
  };
  try {
    const baseline = prepared.map((_, index) => view(index, 0.371));
    for (const progress of [1, 0, 0.8, 0.2, 0.9, 0.1]) {
      view(1, progress); view(0, 1 - progress);
      sessions.forEach(session => session.reset());
      assert.deepEqual(view(0, 0.371), baseline[0]);
      assert.deepEqual(view(1, 0.371), baseline[1]);
    }
    assert.notEqual(baseline[0]!.sampled.revisionId, baseline[1]!.sampled.revisionId);
    for (const session of sessions) assert.equal(session.history.snapshots.length, 3);
  } finally { sessions.forEach(session => session.dispose()); }
});

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
  const source = readFileSync(new URL("../src/tutorial/authoring-market/authoring-market-frame.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /sampleKpEconomics|sampleKpPerUnitTax|createKpPerUnitTaxWelfareAccounting|createKpPerUnitTaxWelfareModel|addKpRationals|multiplyKpRationals|divideKpRationals/);
  assert.equal(source.match(/query\.evaluate\(/g)?.length, 1);
});
