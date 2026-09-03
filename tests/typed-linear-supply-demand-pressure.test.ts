import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpStandardMathAuthoringContext
} from "../src/math/authoring/algebra.ts";
import {
  createKpUnitDescriptor,
  createKpUnitValue
} from "../src/math/authoring/units.ts";
import {
  createKpLinearSupplyDemandExperiment,
  evaluateKpLinearMarketScenario
} from "../src/experiments/typed-linear-supply-demand/typed-linear-supply-demand.ts";

const quantityUnit = createKpUnitDescriptor({
  id: "kp.unit.pressure.item",
  symbol: "item"
});
const priceUnit = createKpUnitDescriptor({
  id: "kp.unit.pressure.usd",
  symbol: "USD"
});
const welfareUnit = createKpUnitDescriptor({
  id: "kp.unit.pressure.usd-item",
  symbol: "USD\\cdot item"
});

function createMarket() {
  return createKpLinearSupplyDemandExperiment({
    author: createKpStandardMathAuthoringContext({
      namespace: "lesson.linear-market"
    }),
    key: "widgets",
    units: {
      quantity: quantityUnit,
      price: priceUnit,
      welfare: welfareUnit
    },
    demand: {
      priceAtZero: createKpUnitValue(priceUnit, 100),
      priceDropPerQuantity: 2
    },
    supply: {
      priceAtZero: createKpUnitValue(priceUnit, 10),
      priceRisePerQuantity: 1
    }
  });
}

test("linear curves retain semantic spaces and coordinate-free derivatives", () => {
  const market = createMarket();
  const quantity = createKpUnitValue(quantityUnit, 10);
  const change = createKpUnitValue(quantityUnit, 3);
  const demandDerivative = market.demand.priceAt.derivativeAt(quantity);

  assert.equal(market.id, "lesson.linear-market.markets.widgets");
  assert.deepEqual(market.demand.priceAt.evaluate(quantity), {
    magnitude: 80,
    unitId: priceUnit.id
  });
  assert.deepEqual(market.supply.priceAt.evaluate(quantity), {
    magnitude: 20,
    unitId: priceUnit.id
  });
  assert.deepEqual(demandDerivative.apply(change), {
    magnitude: -6,
    unitId: priceUnit.id
  });
  assert.deepEqual(market.supply.priceAt.derivativeAt(quantity).apply(change), {
    magnitude: 3,
    unitId: priceUnit.id
  });
  assert.deepEqual(demandDerivative.linearity, {
    kind: "tested",
    suiteId: "kp.test.typed-linear-supply-demand.derivative-linearity",
    equalityId: market.spaces.price.vectors.equality.id
  });
  assert.equal(market.demand.derivativeUnitLatex, "\\frac{\\mathrm{USD}}{\\mathrm{item}}");
  assert.equal(market.spaces.quantity, market.demand.priceAt.domain);
  assert.equal(market.spaces.price, market.demand.priceAt.codomain);
  assert.equal(market.demand.priceAt.domain, market.supply.priceAt.domain);
  assert.equal(market.demand.priceAt.codomain, market.supply.priceAt.codomain);
  assert.equal(Object.isFrozen(market), true);
  assert.equal(Object.isFrozen(market.demand), true);

  assert.throws(
    () => market.demand.priceAt.derivativeAt(
      createKpUnitValue(priceUnit, 10) as never
    ),
    /Demand derivative point must use unit kp.unit.pressure.item/
  );
});

test("the pressure caller remains renderer and publication neutral", async () => {
  const source = await readFile(new URL(
    "../src/experiments/typed-linear-supply-demand/typed-linear-supply-demand.ts",
    import.meta.url
  ), "utf8");
  const imports = [...source.matchAll(/from "([^"]+)"/g)]
    .map((match) => match[1]);

  assert.ok(imports.length > 0);
  assert.equal(imports.every((specifier) => specifier?.startsWith("../../math/")), true);
  assert.doesNotMatch(source, /Article|Graph2D|renderer|animation/i);
});

test("baseline and seller-tax snapshots recompute equilibrium and welfare", () => {
  const market = createMarket();
  const baseline = evaluateKpLinearMarketScenario(market, {
    kind: "baseline"
  });
  const taxed = evaluateKpLinearMarketScenario(market, {
    kind: "per-unit-seller-tax",
    id: "tax-15",
    amount: createKpUnitValue(priceUnit, 15)
  });

  assert.deepEqual(baseline.quantities, {
    demanded: { magnitude: 30, unitId: quantityUnit.id },
    supplied: { magnitude: 30, unitId: quantityUnit.id },
    traded: { magnitude: 30, unitId: quantityUnit.id },
    shortage: { magnitude: 0, unitId: quantityUnit.id },
    surplus: { magnitude: 0, unitId: quantityUnit.id }
  });
  assert.deepEqual(baseline.prices, {
    buyer: { magnitude: 40, unitId: priceUnit.id },
    seller: { magnitude: 40, unitId: priceUnit.id }
  });
  assert.deepEqual(welfareMagnitudes(baseline), {
    consumerSurplus: 900,
    producerSurplus: 450,
    governmentRevenue: 0,
    deadweightLoss: 0,
    totalSurplus: 1350
  });

  assert.equal(taxed.id, "lesson.linear-market.markets.widgets.snapshots.tax-15");
  assert.equal(taxed.policy.kind, "per-unit-seller-tax");
  assert.deepEqual(taxed.prices, {
    buyer: { magnitude: 50, unitId: priceUnit.id },
    seller: { magnitude: 35, unitId: priceUnit.id }
  });
  assert.equal(taxed.quantities.traded.magnitude, 25);
  assert.deepEqual(welfareMagnitudes(taxed), {
    consumerSurplus: 625,
    producerSurplus: 312.5,
    governmentRevenue: 375,
    deadweightLoss: 37.5,
    totalSurplus: 1312.5
  });
  assert.equal(baseline.quantities.traded.magnitude, 30);
});

test("a binding price floor exposes surplus and its rationing assumption", () => {
  const market = createMarket();
  const floor = evaluateKpLinearMarketScenario(market, {
    kind: "price-floor",
    id: "floor-55",
    price: createKpUnitValue(priceUnit, 55),
    rationing: "efficient-lowest-cost"
  });

  assert.deepEqual(floor.policy, {
    kind: "price-floor",
    id: "floor-55",
    price: { magnitude: 55, unitId: priceUnit.id },
    rationing: "efficient-lowest-cost",
    binding: true
  });
  assert.deepEqual(floor.quantities, {
    demanded: { magnitude: 22.5, unitId: quantityUnit.id },
    supplied: { magnitude: 45, unitId: quantityUnit.id },
    traded: { magnitude: 22.5, unitId: quantityUnit.id },
    shortage: { magnitude: 0, unitId: quantityUnit.id },
    surplus: { magnitude: 22.5, unitId: quantityUnit.id }
  });
  assert.deepEqual(floor.prices, {
    buyer: { magnitude: 55, unitId: priceUnit.id },
    seller: { magnitude: 55, unitId: priceUnit.id }
  });
  assert.deepEqual(welfareMagnitudes(floor), {
    consumerSurplus: 506.25,
    producerSurplus: 759.375,
    governmentRevenue: 0,
    deadweightLoss: 84.375,
    totalSurplus: 1265.625
  });
});

test("scenario recovery is deterministic, immutable, and unit checked", () => {
  const market = createMarket();
  const scenario = {
    kind: "price-floor" as const,
    id: "nonbinding-floor",
    price: createKpUnitValue(priceUnit, 35),
    rationing: "efficient-lowest-cost" as const
  };
  const first = evaluateKpLinearMarketScenario(market, scenario);
  const second = evaluateKpLinearMarketScenario(market, scenario);

  assert.deepEqual(first, second);
  assert.equal(first.policy.kind, "price-floor");
  assert.equal(first.policy.binding, false);
  assert.equal(first.quantities.traded.magnitude, 30);
  assert.equal(first.prices.buyer.magnitude, 40);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.welfare), true);
  assert.deepEqual(first.sourceIds, [
    market.id,
    market.demand.id,
    market.supply.id
  ]);

  assert.throws(
    () => evaluateKpLinearMarketScenario(market, {
      kind: "per-unit-seller-tax",
      id: "wrong-unit",
      amount: createKpUnitValue(quantityUnit, 5) as never
    }),
    /Tax amount must use unit kp.unit.pressure.usd/
  );
});

function welfareMagnitudes(snapshot: ReturnType<
  typeof evaluateKpLinearMarketScenario<
    typeof quantityUnit.id,
    typeof priceUnit.id,
    typeof welfareUnit.id
  >
>) {
  return {
    consumerSurplus: snapshot.welfare.consumerSurplus.magnitude,
    producerSurplus: snapshot.welfare.producerSurplus.magnitude,
    governmentRevenue: snapshot.welfare.governmentRevenue.magnitude,
    deadweightLoss: snapshot.welfare.deadweightLoss.magnitude,
    totalSurplus: snapshot.welfare.totalSurplus.magnitude
  };
}
