import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPerUnitTaxWelfareAsset
} from "../domains/economics/per-unit-tax-welfare-asset.ts";
import {
  sampleKpPerUnitTaxWelfareFrame
} from "../domains/economics/per-unit-tax-welfare-frame.ts";

const exact = (numerator: string, denominator = "1") => ({
  numerator,
  denominator
});

test("supply-tax frame samples exact untaxed, midpoint, and taxed truth", () => {
  const asset = createKpPerUnitTaxWelfareAsset();
  const frames = [exact("0"), exact("1", "2"), exact("1")].map((progress) =>
    sampleKpPerUnitTaxWelfareFrame({ asset, progress })
  );
  assert.deepEqual(frames.map(({ phase }) => phase),
    ["untaxed", "tax-transit", "taxed"]);
  assert.deepEqual(frames.map(({ market }) => market), [
    {
      taxAmount: exact("0"),
      quantity: exact("5"),
      consumerPrice: exact("7"),
      producerPrice: exact("7"),
      priceWedge: exact("0")
    },
    {
      taxAmount: exact("2"),
      quantity: exact("4"),
      consumerPrice: exact("8"),
      producerPrice: exact("6"),
      priceWedge: exact("2")
    },
    {
      taxAmount: exact("4"),
      quantity: exact("3"),
      consumerPrice: exact("9"),
      producerPrice: exact("5"),
      priceWedge: exact("4")
    }
  ]);
  assert.deepEqual(frames[1]?.welfare, {
    consumerSurplus: exact("8"),
    producerSurplus: exact("8"),
    governmentRevenue: exact("8"),
    totalSurplus: exact("24"),
    deadweightLoss: exact("1")
  });
});

test("supply-tax sampled frame always retains original supply identity", () => {
  const asset = createKpPerUnitTaxWelfareAsset();
  for (const numerator of ["0", "1", "2", "3", "4"]) {
    const frame = sampleKpPerUnitTaxWelfareFrame({
      asset,
      progress: exact(numerator, "4")
    });
    assert.equal(frame.curves.originalSupplyId,
      "curve.economics.tax.supply");
    assert.ok(frame.activeSemanticIds.includes(frame.curves.originalSupplyId));
    assert.deepEqual(frame.curves.originalSupplyIntercept, exact("2"));
  }
});

test("forward, rewind, and direct seek resolve the same exact model frames", () => {
  const asset = createKpPerUnitTaxWelfareAsset();
  for (const numerator of ["0", "1", "2", "3", "4"]) {
    const forward = sampleKpPerUnitTaxWelfareFrame({
      asset,
      direction: "forward",
      progress: exact(numerator, "4")
    });
    const rewind = sampleKpPerUnitTaxWelfareFrame({
      asset,
      direction: "rewind",
      progress: exact(String(4 - Number(numerator)), "4")
    });
    const direct = sampleKpPerUnitTaxWelfareFrame({
      asset,
      progress: forward.modelProgress
    });
    assert.deepEqual(rewind.modelProgress, forward.modelProgress);
    assert.deepEqual(rewind.curves, forward.curves);
    assert.deepEqual(rewind.market, forward.market);
    assert.deepEqual(rewind.welfare, forward.welfare);
    assert.deepEqual(direct.market, forward.market);
    assert.deepEqual(direct.welfare, forward.welfare);
  }
});

test("supply-tax frame rejects playhead values outside the unit interval", () => {
  const asset = createKpPerUnitTaxWelfareAsset();
  assert.throws(
    () => sampleKpPerUnitTaxWelfareFrame({ asset, progress: exact("5", "4") }),
    /between zero and one/
  );
  assert.throws(
    () => sampleKpPerUnitTaxWelfareFrame({ asset, progress: exact("0", "0") }),
    /denominator cannot be zero/
  );
});
