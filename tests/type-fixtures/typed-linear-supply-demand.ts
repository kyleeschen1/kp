import {
  createKpStandardMathAuthoringContext
} from "../../src/math/authoring/algebra.ts";
import {
  createKpUnitDescriptor,
  createKpUnitValue
} from "../../src/math/authoring/units.ts";
import {
  createKpLinearSupplyDemandExperiment,
  evaluateKpLinearMarketScenario
} from "../../src/experiments/typed-linear-supply-demand/typed-linear-supply-demand.ts";

const quantityUnit = createKpUnitDescriptor({ id: "fixture.unit.item", symbol: "item" });
const priceUnit = createKpUnitDescriptor({ id: "fixture.unit.usd", symbol: "USD" });
const welfareUnit = createKpUnitDescriptor({ id: "fixture.unit.welfare", symbol: "USD item" });
const market = createKpLinearSupplyDemandExperiment({
  author: createKpStandardMathAuthoringContext({ namespace: "fixture.market" }),
  key: "widgets",
  units: { quantity: quantityUnit, price: priceUnit, welfare: welfareUnit },
  demand: {
    priceAtZero: createKpUnitValue(priceUnit, 100),
    priceDropPerQuantity: 2
  },
  supply: {
    priceAtZero: createKpUnitValue(priceUnit, 10),
    priceRisePerQuantity: 1
  }
});

const demandPrice = market.demand.priceAt.evaluate(createKpUnitValue(quantityUnit, 10));
const exactPriceUnit: "fixture.unit.usd" = demandPrice.unitId;
void exactPriceUnit;

evaluateKpLinearMarketScenario(market, {
  kind: "per-unit-seller-tax",
  id: "valid-tax",
  amount: createKpUnitValue(priceUnit, 15)
});

evaluateKpLinearMarketScenario(market, {
  kind: "per-unit-seller-tax",
  id: "invalid-tax-unit",
  // @ts-expect-error A quantity cannot be supplied where a price wedge is required.
  amount: createKpUnitValue(quantityUnit, 15)
});

// @ts-expect-error A price floor must declare its rationing assumption.
evaluateKpLinearMarketScenario(market, {
  kind: "price-floor",
  id: "missing-rationing",
  price: createKpUnitValue(priceUnit, 55)
});
