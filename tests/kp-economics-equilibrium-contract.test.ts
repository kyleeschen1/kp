import assert from "node:assert/strict";
import test from "node:test";

import {
  kpSupplyDemandEquilibriumExemplarInput,
  kpSupplyDemandEquilibriumPreservation,
  kpSupplyDemandEquilibriumSchemaVersion
} from "../domains/economics/supply-demand-equilibrium.ts";

test("economics equilibrium exemplar freezes one exact bounded model contract", () => {
  assert.equal(
    kpSupplyDemandEquilibriumExemplarInput.schemaVersion,
    kpSupplyDemandEquilibriumSchemaVersion
  );
  assert.deepEqual(kpSupplyDemandEquilibriumExemplarInput.axes, {
    quantity: {
      id: "axis.economics.quantity",
      symbol: "Q",
      label: "Quantity",
      orientation: "horizontal",
      minimum: { numerator: "0", denominator: "1" },
      maximum: { numerator: "12", denominator: "1" },
      tickStep: { numerator: "2", denominator: "1" }
    },
    price: {
      id: "axis.economics.price",
      symbol: "P",
      label: "Price",
      orientation: "vertical",
      minimum: { numerator: "0", denominator: "1" },
      maximum: { numerator: "20", denominator: "1" },
      tickStep: { numerator: "2", denominator: "1" }
    }
  });
  assert.deepEqual(kpSupplyDemandEquilibriumExemplarInput.supply, {
    id: "curve.economics.supply",
    label: "Supply",
    direction: "upward",
    equationForm: "price-intercept-plus-slope-times-quantity",
    priceIntercept: { numerator: "2", denominator: "1" },
    priceChangePerQuantity: { numerator: "1", denominator: "1" }
  });
  assert.deepEqual(kpSupplyDemandEquilibriumExemplarInput.demand, {
    id: "curve.economics.demand",
    label: "Demand",
    direction: "downward",
    equationForm: "price-intercept-minus-slope-times-quantity",
    priceChangePerQuantity: { numerator: "1", denominator: "1" },
    interceptParameterId: "parameter.economics.demand-price-intercept",
    priceInterceptBefore: { numerator: "14", denominator: "1" },
    priceInterceptAfter: { numerator: "18", denominator: "1" }
  });
});

test("economics contract fixes axis meaning and cross-view preservation roles", () => {
  assert.equal(
    kpSupplyDemandEquilibriumExemplarInput.axes.quantity.orientation,
    "horizontal"
  );
  assert.equal(
    kpSupplyDemandEquilibriumExemplarInput.axes.price.orientation,
    "vertical"
  );
  assert.equal(
    kpSupplyDemandEquilibriumExemplarInput.surplusSide,
    "above-equilibrium-price"
  );
  assert.equal(
    kpSupplyDemandEquilibriumExemplarInput.shortageSide,
    "below-equilibrium-price"
  );
  assert.deepEqual(
    kpSupplyDemandEquilibriumExemplarInput.preservation,
    kpSupplyDemandEquilibriumPreservation
  );
});

