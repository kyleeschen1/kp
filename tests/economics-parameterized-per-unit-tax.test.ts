import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  evaluateKpParameterizedPerUnitTax,
  kpParameterizedPerUnitTaxEvaluationSchemaVersion
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

for (const [name, model] of [
  ["canonical market", createKpPerUnitTaxWelfareModel()],
  ["second exact market", createKpPerUnitTaxWelfareModel({
    ...kpPerUnitTaxWelfareExemplarInput,
    demand: {
      ...kpPerUnitTaxWelfareExemplarInput.demand,
      priceIntercept: exact("14")
    }
  })]
] as const) {
  test(`${name} has exact parameterized endpoint parity`, () => {
    const accounting = createKpPerUnitTaxWelfareAccounting(model);
    const initial = evaluateKpParameterizedPerUnitTax({
      model,
      taxAmount: exact("0", "7")
    });
    const final = evaluateKpParameterizedPerUnitTax({
      model,
      taxAmount: exact("8", "2")
    });

    assert.equal(initial.schemaVersion,
      kpParameterizedPerUnitTaxEvaluationSchemaVersion);
    assert.equal(initial.model, model);
    assert.equal(initial.market, model.states.untaxed);
    assert.deepEqual(initial.accounting, accounting.states.untaxed);
    assert.equal(final.model, model);
    assert.equal(final.market, model.states.taxed);
    assert.deepEqual(final.accounting, accounting.states.taxed);
  });
}

test("an intermediate tax reuses exact market and welfare authority", () => {
  const sourceModel = createKpPerUnitTaxWelfareModel();
  const evaluated = evaluateKpParameterizedPerUnitTax({
    model: sourceModel,
    taxAmount: exact("6", "3")
  });

  assert.notEqual(evaluated.model, sourceModel);
  assert.equal(evaluated.sourceModelId, sourceModel.id);
  assert.deepEqual(evaluated.taxAmount, exact("2"));
  assert.deepEqual(evaluated.market, {
    id: sourceModel.input.equilibriumIds.taxed,
    phase: "taxed",
    taxAmount: exact("2"),
    quantity: exact("4"),
    consumerPrice: exact("8"),
    producerPrice: exact("6"),
    demandPriceAtEquilibrium: exact("8"),
    originalSupplyPriceAtEquilibrium: exact("6"),
    buyerFacingSupplyPriceAtEquilibrium: exact("8"),
    priceWedge: exact("2"),
    marketClearsExactly: true,
    wedgeEqualsTaxExactly: true
  });
  assert.deepEqual(evaluated.accounting, {
    marketStateId: sourceModel.input.equilibriumIds.taxed,
    consumerSurplus: exact("8"),
    producerSurplus: exact("8"),
    governmentRevenue: exact("8"),
    privateSurplus: exact("16"),
    totalSurplus: exact("24")
  });
  assert.deepEqual(sourceModel.states.taxed.taxAmount, exact("4"));
});

test("invalid explicit taxes retain typed domain diagnostics", () => {
  const model = createKpPerUnitTaxWelfareModel();

  assert.throws(
    () => evaluateKpParameterizedPerUnitTax({
      model,
      taxAmount: exact("-1")
    }),
    /taxAmount must be nonnegative/
  );
  assert.throws(
    () => evaluateKpParameterizedPerUnitTax({
      model,
      taxAmount: exact("1", "0")
    }),
    /taxAmount is invalid: Exact rational denominator cannot be zero/
  );
  assert.throws(
    () => evaluateKpParameterizedPerUnitTax({
      model,
      taxAmount: exact("12")
    }),
    /Exact taxed quantity lies outside the axis domain/
  );
});

test("the parameter seam delegates formulas and stays state-system neutral", async () => {
  const source = await readFile(
    "domains/economics/per-unit-tax-parameterized.ts",
    "utf8"
  );

  assert.match(source, /createKpPerUnitTaxWelfareModel/u);
  assert.match(source, /createKpPerUnitTaxWelfareAccounting/u);
  assert.doesNotMatch(source, /(?:add|subtract|multiply|divide)KpRationals/u);
  assert.doesNotMatch(source, /semantic-state/u);
});
