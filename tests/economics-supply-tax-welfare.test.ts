import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPerUnitTaxWelfareAccounting,
  kpPerUnitTaxWelfareAccountingSchemaVersion
} from "../domains/economics/per-unit-tax-welfare-accounting.ts";

const exact = (numerator: string, denominator = "1") => ({
  numerator,
  denominator
});

test("untaxed welfare is split equally between consumers and producers", () => {
  const accounting = createKpPerUnitTaxWelfareAccounting();
  assert.equal(accounting.schemaVersion,
    kpPerUnitTaxWelfareAccountingSchemaVersion);
  assert.deepEqual(accounting.states.untaxed, {
    marketStateId: "equilibrium.economics.tax.untaxed",
    consumerSurplus: exact("25", "2"),
    producerSurplus: exact("25", "2"),
    governmentRevenue: exact("0"),
    privateSurplus: exact("25"),
    totalSurplus: exact("25")
  });
});

test("taxed welfare separates private surplus from government revenue", () => {
  const accounting = createKpPerUnitTaxWelfareAccounting();
  assert.deepEqual(accounting.states.taxed, {
    marketStateId: "equilibrium.economics.tax.taxed",
    consumerSurplus: exact("9", "2"),
    producerSurplus: exact("9", "2"),
    governmentRevenue: exact("12"),
    privateSurplus: exact("9"),
    totalSurplus: exact("21")
  });
});

test("lost private surplus closes as revenue plus deadweight loss", () => {
  const accounting = createKpPerUnitTaxWelfareAccounting();
  assert.deepEqual(accounting.lostPrivateSurplus, exact("16"));
  assert.deepEqual(accounting.deadweightLoss, exact("4"));
  assert.equal(accounting.welfareClosesExactly, true);
  assert.equal(accounting.redistributionAndLossCloseExactly, true);
});
