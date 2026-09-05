import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  evaluateKpParameterizedDemandInterceptAndPerUnitTax,
  kpParameterizedDemandInterceptAndTaxEvaluationSchemaVersion
} from "../domains/economics/per-unit-tax-parameterized.ts";
import {
  createKpPerUnitTaxWelfareAccounting
} from "../domains/economics/per-unit-tax-welfare-accounting.ts";
import {
  createKpPerUnitTaxWelfareModel
} from "../domains/economics/per-unit-tax-welfare-model.ts";
import {
  kpPerUnitTaxWelfareExemplarInput
} from "../domains/economics/per-unit-tax-welfare.ts";

const exact = (numerator: string, denominator = "1") => ({
  numerator,
  denominator
});

const markets = [
  ["canonical market", createKpPerUnitTaxWelfareModel()],
  ["second exact market", createKpPerUnitTaxWelfareModel({
    ...kpPerUnitTaxWelfareExemplarInput,
    demand: {
      ...kpPerUnitTaxWelfareExemplarInput.demand,
      priceIntercept: exact("14")
    }
  })]
] as const;

for (const [name, model] of markets) {
  test(`${name} retains both canonical tax endpoints`, () => {
    const accounting = createKpPerUnitTaxWelfareAccounting(model);
    const initial = evaluateKpParameterizedDemandInterceptAndPerUnitTax({
      model,
      demandPriceIntercept: model.input.demand.priceIntercept,
      taxAmount: model.input.tax.initialAmount
    });
    const final = evaluateKpParameterizedDemandInterceptAndPerUnitTax({
      model,
      demandPriceIntercept: model.input.demand.priceIntercept,
      taxAmount: model.input.tax.finalAmount
    });

    assert.equal(initial.schemaVersion,
      kpParameterizedDemandInterceptAndTaxEvaluationSchemaVersion);
    assert.equal(initial.model, model);
    assert.equal(initial.market, model.states.untaxed);
    assert.deepEqual(initial.accounting, accounting.states.untaxed);
    assert.equal(final.model, model);
    assert.equal(final.market, model.states.taxed);
    assert.deepEqual(final.accounting, accounting.states.taxed);
  });
}

for (const [name, source, demandPriceIntercept, taxAmount] of [
  ["canonical market", markets[0][1], exact("14"), exact("2")],
  ["second exact market", markets[1][1], exact("15"), exact("3")]
] as const) {
  test(`${name} rebuilds exact interior demand and tax authority`, () => {
    const sourceDemand = source.input.demand.priceIntercept;
    const sourceTax = source.input.tax.finalAmount;
    const expected = createKpPerUnitTaxWelfareModel({
      ...source.input,
      demand: { ...source.input.demand, priceIntercept: demandPriceIntercept },
      tax: { ...source.input.tax, finalAmount: taxAmount }
    });
    const expectedAccounting = createKpPerUnitTaxWelfareAccounting(expected);
    const evaluated =
      evaluateKpParameterizedDemandInterceptAndPerUnitTax({
        model: source,
        demandPriceIntercept,
        taxAmount
      });

    assert.notEqual(evaluated.model, source);
    assert.equal(evaluated.sourceModelId, source.id);
    assert.deepEqual(evaluated.demandPriceIntercept, demandPriceIntercept);
    assert.deepEqual(evaluated.taxAmount, taxAmount);
    assert.deepEqual(evaluated.model, expected);
    assert.deepEqual(evaluated.market, expected.states.taxed);
    assert.deepEqual(evaluated.accounting, expectedAccounting.states.taxed);
    assert.deepEqual(source.input.demand.priceIntercept, sourceDemand);
    assert.deepEqual(source.input.tax.finalAmount, sourceTax);
  });
}

test("joint exact parameters preserve clearing wedge and accounting laws", () => {
  const evaluated = evaluateKpParameterizedDemandInterceptAndPerUnitTax({
    model: markets[0][1],
    demandPriceIntercept: exact("14"),
    taxAmount: exact("2")
  });
  const accounting = createKpPerUnitTaxWelfareAccounting(evaluated.model);

  assert.deepEqual(evaluated.market.quantity, exact("5"));
  assert.deepEqual(evaluated.market.consumerPrice, exact("9"));
  assert.deepEqual(evaluated.market.producerPrice, exact("7"));
  assert.deepEqual(evaluated.market.priceWedge, exact("2"));
  assert.equal(evaluated.market.marketClearsExactly, true);
  assert.equal(evaluated.market.wedgeEqualsTaxExactly, true);
  assert.deepEqual(evaluated.accounting, {
    marketStateId: evaluated.market.id,
    consumerSurplus: exact("25", "2"),
    producerSurplus: exact("25", "2"),
    governmentRevenue: exact("10"),
    privateSurplus: exact("25"),
    totalSurplus: exact("35")
  });
  assert.deepEqual(accounting.deadweightLoss, exact("1"));
  assert.equal(accounting.welfareClosesExactly, true);
  assert.equal(accounting.redistributionAndLossCloseExactly, true);
});

test("joint parameter diagnostics retain exact field and axis ownership", () => {
  const model = markets[0][1];

  assert.throws(() => evaluateKpParameterizedDemandInterceptAndPerUnitTax({
    model,
    demandPriceIntercept: exact("fourteen"),
    taxAmount: exact("2")
  }), /demandPriceIntercept must use integer numerator and denominator strings/u);
  assert.throws(() => evaluateKpParameterizedDemandInterceptAndPerUnitTax({
    model,
    demandPriceIntercept: exact("14", "0"),
    taxAmount: exact("2")
  }), /demandPriceIntercept is invalid: Exact rational denominator cannot be zero/u);
  assert.throws(() => evaluateKpParameterizedDemandInterceptAndPerUnitTax({
    model,
    demandPriceIntercept: exact("14"),
    taxAmount: exact("-1")
  }), /taxAmount must be nonnegative/u);
  assert.throws(() => evaluateKpParameterizedDemandInterceptAndPerUnitTax({
    model,
    demandPriceIntercept: exact("40"),
    taxAmount: exact("2")
  }), /Exact untaxed quantity lies outside the axis domain/u);
  assert.throws(() => evaluateKpParameterizedDemandInterceptAndPerUnitTax({
    model,
    demandPriceIntercept: exact("14"),
    taxAmount: exact("20")
  }), /Exact taxed quantity lies outside the axis domain/u);
});

test("joint parameter adapter delegates every economic formula", async () => {
  const source = await readFile(
    "domains/economics/per-unit-tax-parameterized.ts",
    "utf8"
  );

  assert.match(source, /createKpPerUnitTaxWelfareModel/u);
  assert.match(source, /createKpPerUnitTaxWelfareAccounting/u);
  assert.doesNotMatch(source, /(?:add|subtract|multiply|divide)KpRationals/u);
  assert.doesNotMatch(source, /semantic-state/u);
  assert.doesNotMatch(source, /render|canvas|svg|katex/iu);
});
