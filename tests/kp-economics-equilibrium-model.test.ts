import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyKpSupplyDemandMarketAtPrice,
  createKpSupplyDemandEquilibriumModel,
  evaluateKpDemandPrice,
  evaluateKpSupplyPrice,
  validateKpSupplyDemandEquilibriumInput
} from "../domains/economics/supply-demand-equilibrium-model.ts";
import {
  kpSupplyDemandEquilibriumExemplarInput,
  type KpSupplyDemandEquilibriumModelInputV1
} from "../domains/economics/supply-demand-equilibrium.ts";

const exact = (numerator: string, denominator = "1") => ({
  numerator,
  denominator
});

test("exact supply-demand model derives both clearing equilibria", () => {
  const model = createKpSupplyDemandEquilibriumModel();

  assert.deepEqual(model.states.before.equilibrium, {
    id: "equilibrium.economics.supply-demand",
    stateId: "equilibrium.economics.supply-demand.before",
    quantity: exact("6"),
    price: exact("8")
  });
  assert.deepEqual(model.states.after.equilibrium, {
    id: "equilibrium.economics.supply-demand",
    stateId: "equilibrium.economics.supply-demand.after",
    quantity: exact("8"),
    price: exact("10")
  });
  assert.equal(model.states.before.marketClearsExactly, true);
  assert.deepEqual(
    model.states.after.supplyPriceAtEquilibrium,
    model.states.after.demandPriceAtEquilibrium
  );
});

test("curve evaluation stays exact for fractional authored parameters", () => {
  const input: KpSupplyDemandEquilibriumModelInputV1 = {
    ...kpSupplyDemandEquilibriumExemplarInput,
    supply: {
      ...kpSupplyDemandEquilibriumExemplarInput.supply,
      priceIntercept: exact("1", "2"),
      priceChangePerQuantity: exact("3", "2")
    },
    demand: {
      ...kpSupplyDemandEquilibriumExemplarInput.demand,
      priceChangePerQuantity: exact("1", "2"),
      priceInterceptBefore: exact("17", "2"),
      priceInterceptAfter: exact("19", "2")
    }
  };
  const model = createKpSupplyDemandEquilibriumModel(input);

  assert.deepEqual(model.states.before.equilibrium.quantity, exact("4"));
  assert.deepEqual(model.states.before.equilibrium.price, exact("13", "2"));
  assert.deepEqual(
    evaluateKpSupplyPrice({ model, quantity: exact("4") }),
    exact("13", "2")
  );
  assert.deepEqual(
    evaluateKpDemandPrice({ model, phase: "before", quantity: exact("4") }),
    exact("13", "2")
  );
});

test("market-side classification preserves surplus and shortage meaning", () => {
  const model = createKpSupplyDemandEquilibriumModel();

  assert.deepEqual(
    classifyKpSupplyDemandMarketAtPrice({ model, phase: "after", price: exact("12") }),
    {
      phase: "after",
      price: exact("12"),
      supplyQuantity: exact("10"),
      demandQuantity: exact("6"),
      condition: "surplus",
      magnitude: exact("4")
    }
  );
  assert.equal(
    classifyKpSupplyDemandMarketAtPrice({ model, phase: "after", price: exact("8") })
      .condition,
    "shortage"
  );
  assert.equal(
    classifyKpSupplyDemandMarketAtPrice({ model, phase: "after", price: exact("10") })
      .condition,
    "equilibrium"
  );
});

test("bounded model rejects invalid slopes, shift direction, and domains", () => {
  const invalid: KpSupplyDemandEquilibriumModelInputV1 = {
    ...kpSupplyDemandEquilibriumExemplarInput,
    axes: {
      ...kpSupplyDemandEquilibriumExemplarInput.axes,
      quantity: {
        ...kpSupplyDemandEquilibriumExemplarInput.axes.quantity,
        maximum: exact("0")
      }
    },
    supply: {
      ...kpSupplyDemandEquilibriumExemplarInput.supply,
      priceChangePerQuantity: exact("0")
    },
    demand: {
      ...kpSupplyDemandEquilibriumExemplarInput.demand,
      priceInterceptAfter: exact("12")
    }
  };
  const issues = validateKpSupplyDemandEquilibriumInput(invalid);

  assert.deepEqual(
    issues.map(({ path }) => path),
    [
      "axes.quantity.maximum",
      "supply.priceChangePerQuantity",
      "demand.priceInterceptAfter"
    ]
  );
  assert.throws(
    () => createKpSupplyDemandEquilibriumModel(invalid),
    /Value must be positive/
  );
});

