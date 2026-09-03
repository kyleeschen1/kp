import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPerUnitTaxWelfareAccounting
} from "../domains/economics/per-unit-tax-welfare-accounting.ts";
import {
  createKpPerUnitTaxWelfareModel
} from "../domains/economics/per-unit-tax-welfare-model.ts";
import {
  kpPerUnitTaxWelfareExemplarInput
} from "../domains/economics/per-unit-tax-welfare.ts";
import {
  projectKpExactRationalLinearMarket
} from "../src/experiments/typed-linear-supply-demand/exact-rational-adapter.ts";
import {
  createKpStandardMathAuthoringContext
} from "../src/math/authoring/algebra.ts";
import {
  createKpUnitDescriptor
} from "../src/math/authoring/units.ts";

const quantityUnit = createKpUnitDescriptor({
  id: "kp.unit.economics.item",
  symbol: "item"
});
const priceUnit = createKpUnitDescriptor({
  id: "kp.unit.economics.usd-per-item",
  symbol: "USD/item"
});
const welfareUnit = createKpUnitDescriptor({
  id: "kp.unit.economics.usd",
  symbol: "USD"
});

function createCharacterizedPair() {
  const exactModel = createKpPerUnitTaxWelfareModel();
  const exactWelfare = createKpPerUnitTaxWelfareAccounting(exactModel);
  const projection = projectKpExactRationalLinearMarket({
    author: createKpStandardMathAuthoringContext({
      namespace: "lesson.economics.supply-tax-parity"
    }),
    key: "canonical-exemplar",
    model: exactModel,
    units: {
      quantity: quantityUnit,
      price: priceUnit,
      welfare: welfareUnit
    }
  });
  return Object.freeze({
    exactModel,
    exactWelfare,
    projection,
    typedMarket: projection.market,
    typedUntaxed: projection.snapshots.untaxed,
    typedTaxed: projection.snapshots.taxed
  });
}

test("canonical and typed baseline cases expose the same characterized truth", () => {
  const pair = createCharacterizedPair();

  assert.deepEqual(pair.exactModel.states.untaxed, {
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
  assert.deepEqual(pair.typedUntaxed.quantities.traded, unit(5, quantityUnit.id));
  assert.deepEqual(pair.typedUntaxed.prices, {
    buyer: unit(7, priceUnit.id),
    seller: unit(7, priceUnit.id)
  });
  assert.deepEqual(pair.typedUntaxed.welfare, {
    consumerSurplus: unit(12.5, welfareUnit.id),
    producerSurplus: unit(12.5, welfareUnit.id),
    governmentRevenue: unit(0, welfareUnit.id),
    deadweightLoss: unit(0, welfareUnit.id),
    totalSurplus: unit(25, welfareUnit.id)
  });
  assert.deepEqual(pair.exactWelfare.states.untaxed, {
    marketStateId: pair.exactModel.states.untaxed.id,
    consumerSurplus: exact("25", "2"),
    producerSurplus: exact("25", "2"),
    governmentRevenue: exact("0"),
    privateSurplus: exact("25"),
    totalSurplus: exact("25")
  });
});

test("canonical and typed seller-tax cases expose incidence and welfare", () => {
  const pair = createCharacterizedPair();

  assert.deepEqual(pair.exactModel.states.taxed, {
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
  assert.deepEqual(pair.typedTaxed.quantities.traded, unit(3, quantityUnit.id));
  assert.deepEqual(pair.typedTaxed.prices, {
    buyer: unit(9, priceUnit.id),
    seller: unit(5, priceUnit.id)
  });
  assert.equal(
    pair.typedTaxed.prices.buyer.magnitude -
      pair.typedUntaxed.prices.buyer.magnitude,
    2
  );
  assert.equal(
    pair.typedUntaxed.prices.seller.magnitude -
      pair.typedTaxed.prices.seller.magnitude,
    2
  );
  assert.deepEqual(pair.typedTaxed.welfare, {
    consumerSurplus: unit(4.5, welfareUnit.id),
    producerSurplus: unit(4.5, welfareUnit.id),
    governmentRevenue: unit(12, welfareUnit.id),
    deadweightLoss: unit(4, welfareUnit.id),
    totalSurplus: unit(21, welfareUnit.id)
  });
  assert.deepEqual(pair.exactWelfare.states.taxed, {
    marketStateId: pair.exactModel.states.taxed.id,
    consumerSurplus: exact("9", "2"),
    producerSurplus: exact("9", "2"),
    governmentRevenue: exact("12"),
    privateSurplus: exact("9"),
    totalSurplus: exact("21")
  });
  assert.deepEqual(pair.exactWelfare.deadweightLoss, exact("4"));
});

test("each side retains explicit units and source identities before adaptation", () => {
  const pair = createCharacterizedPair();

  assert.deepEqual(pair.typedTaxed.sourceIds, [
    "lesson.economics.supply-tax-parity.markets.canonical-exemplar",
    "lesson.economics.supply-tax-parity.markets.canonical-exemplar.curves.demand",
    "lesson.economics.supply-tax-parity.markets.canonical-exemplar.curves.supply"
  ]);
  assert.deepEqual({
    model: pair.exactModel.id,
    demand: pair.exactModel.input.demand.id,
    supply: pair.exactModel.input.supply.id,
    tax: pair.exactModel.input.tax.id
  }, {
    model: `model.${kpPerUnitTaxWelfareExemplarInput.id}`,
    demand: "curve.economics.tax.demand",
    supply: "curve.economics.tax.supply",
    tax: "parameter.economics.per-unit-tax"
  });
  assert.deepEqual(pair.typedMarket.units, {
    quantity: quantityUnit,
    price: priceUnit,
    welfare: welfareUnit
  });
  assert.deepEqual(pair.projection.sourceIds, [
    pair.exactModel.id,
    pair.exactWelfare.id,
    pair.exactModel.input.demand.id,
    pair.exactModel.input.supply.id,
    pair.exactModel.input.tax.id,
    pair.exactModel.states.untaxed.id,
    pair.exactModel.states.taxed.id
  ]);
  assert.deepEqual(pair.projection.stateLinks, {
    untaxed: {
      canonicalStateId: pair.exactModel.states.untaxed.id,
      typedSnapshotId: pair.typedUntaxed.id
    },
    taxed: {
      canonicalStateId: pair.exactModel.states.taxed.id,
      typedSnapshotId: pair.typedTaxed.id
    }
  });
  assert.equal(Object.isFrozen(pair), true);
  assert.equal(Object.isFrozen(pair.typedUntaxed), true);
  assert.equal(Object.isFrozen(pair.exactModel), true);
});

test("the one-way adapter consumes normalized exact-rational inputs", () => {
  const model = createKpPerUnitTaxWelfareModel({
    ...kpPerUnitTaxWelfareExemplarInput,
    demand: {
      ...kpPerUnitTaxWelfareExemplarInput.demand,
      priceIntercept: exact("24", "2"),
      priceChangePerQuantity: exact("2", "2")
    },
    supply: {
      ...kpPerUnitTaxWelfareExemplarInput.supply,
      priceIntercept: exact("6", "3"),
      priceChangePerQuantity: exact("4", "4")
    },
    tax: {
      ...kpPerUnitTaxWelfareExemplarInput.tax,
      initialAmount: exact("0", "8"),
      finalAmount: exact("8", "2")
    }
  });
  const projection = projectKpExactRationalLinearMarket({
    author: createKpStandardMathAuthoringContext({
      namespace: "lesson.economics.normalized-parity"
    }),
    key: "normalized",
    model,
    units: { quantity: quantityUnit, price: priceUnit, welfare: welfareUnit }
  });

  assert.deepEqual(projection.canonical.model.input.demand.priceIntercept,
    exact("12"));
  assert.deepEqual(projection.canonical.model.input.tax.finalAmount, exact("4"));
  assert.deepEqual(projection.snapshots.taxed.quantities.traded,
    unit(3, quantityUnit.id));
});

function exact(numerator: string, denominator = "1") {
  return { numerator, denominator };
}

function unit(magnitude: number, unitId: string) {
  return { magnitude, unitId };
}
