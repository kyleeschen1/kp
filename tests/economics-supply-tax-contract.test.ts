import assert from "node:assert/strict";
import test from "node:test";

import {
  kpPerUnitTaxWelfareExemplarInput,
  kpPerUnitTaxWelfarePreservation,
  kpPerUnitTaxWelfareSchemaVersion,
  validateKpPerUnitTaxWelfareInput
} from "../domains/economics/per-unit-tax-welfare.ts";

test("supply-tax input freezes one exact zero-to-positive tax contract", () => {
  const input = kpPerUnitTaxWelfareExemplarInput;
  assert.equal(input.schemaVersion, kpPerUnitTaxWelfareSchemaVersion);
  assert.deepEqual(input.supply.priceIntercept,
    { numerator: "2", denominator: "1" });
  assert.deepEqual(input.demand.priceIntercept,
    { numerator: "12", denominator: "1" });
  assert.deepEqual(input.tax.initialAmount,
    { numerator: "0", denominator: "1" });
  assert.deepEqual(input.tax.finalAmount,
    { numerator: "4", denominator: "1" });
  assert.deepEqual(validateKpPerUnitTaxWelfareInput(input), []);
});

test("supply-tax semantic IDs distinguish original supply from taxed supply", () => {
  const input = kpPerUnitTaxWelfareExemplarInput;
  assert.equal(input.supply.id, "curve.economics.tax.supply");
  assert.equal(input.supply.taxedId,
    "curve.economics.tax.supply-with-tax");
  assert.notEqual(input.supply.id, input.supply.taxedId);
  assert.deepEqual(input.equilibriumIds, {
    untaxed: "equilibrium.economics.tax.untaxed",
    taxed: "equilibrium.economics.tax.taxed"
  });
  assert.equal(input.wedgeId, "wedge.economics.tax");
  assert.deepEqual(input.preservation, kpPerUnitTaxWelfarePreservation);
});

test("supply-tax input rejects a nonzero initial tax or nonpositive final tax", () => {
  const initialTax = {
    ...kpPerUnitTaxWelfareExemplarInput,
    tax: {
      ...kpPerUnitTaxWelfareExemplarInput.tax,
      initialAmount: { numerator: "1", denominator: "1" }
    }
  };
  assert.deepEqual(
    validateKpPerUnitTaxWelfareInput(initialTax),
    [{
      path: "tax.initialAmount",
      message: "Must be exactly zero for this exemplar."
    }]
  );

  const finalTax = {
    ...kpPerUnitTaxWelfareExemplarInput,
    tax: {
      ...kpPerUnitTaxWelfareExemplarInput.tax,
      finalAmount: { numerator: "0", denominator: "1" }
    }
  };
  assert.deepEqual(
    validateKpPerUnitTaxWelfareInput(finalTax),
    [{ path: "tax.finalAmount", message: "Must be positive." }]
  );
});
