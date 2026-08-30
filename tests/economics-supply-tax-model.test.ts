import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPerUnitTaxWelfareModel,
  evaluateKpPerUnitTaxBuyerFacingSupplyPrice,
  evaluateKpPerUnitTaxDemandPrice,
  evaluateKpPerUnitTaxSupplyPrice,
  kpPerUnitTaxWelfareModelSchemaVersion
} from "../domains/economics/per-unit-tax-welfare-model.ts";

const exact = (numerator: string, denominator = "1") => ({
  numerator,
  denominator
});

test("supply-tax model solves exact untaxed market clearing", () => {
  const model = createKpPerUnitTaxWelfareModel();
  assert.equal(model.schemaVersion, kpPerUnitTaxWelfareModelSchemaVersion);
  assert.deepEqual(model.states.untaxed, {
    id: "equilibrium.economics.tax.untaxed",
    phase: "untaxed",
    taxAmount: exact("0"),
    quantity: exact("5"),
    consumerPrice: exact("7"),
    producerPrice: exact("7"),
    demandPriceAtEquilibrium: exact("7"),
    originalSupplyPriceAtEquilibrium: exact("7"),
    buyerFacingSupplyPriceAtEquilibrium: exact("7"),
    priceWedge: exact("0"),
    marketClearsExactly: true,
    wedgeEqualsTaxExactly: true
  });
});

test("supply-tax model solves quantity and both prices after tax", () => {
  const model = createKpPerUnitTaxWelfareModel();
  assert.deepEqual(model.states.taxed, {
    id: "equilibrium.economics.tax.taxed",
    phase: "taxed",
    taxAmount: exact("4"),
    quantity: exact("3"),
    consumerPrice: exact("9"),
    producerPrice: exact("5"),
    demandPriceAtEquilibrium: exact("9"),
    originalSupplyPriceAtEquilibrium: exact("5"),
    buyerFacingSupplyPriceAtEquilibrium: exact("9"),
    priceWedge: exact("4"),
    marketClearsExactly: true,
    wedgeEqualsTaxExactly: true
  });
});

test("supply-tax evaluators retain demand, marginal cost, and buyer-facing supply", () => {
  const model = createKpPerUnitTaxWelfareModel();
  const quantity = exact("3");
  assert.deepEqual(evaluateKpPerUnitTaxDemandPrice({ model, quantity }),
    exact("9"));
  assert.deepEqual(evaluateKpPerUnitTaxSupplyPrice({ model, quantity }),
    exact("5"));
  assert.deepEqual(evaluateKpPerUnitTaxBuyerFacingSupplyPrice({
    model,
    phase: "taxed",
    quantity
  }), exact("9"));
});
