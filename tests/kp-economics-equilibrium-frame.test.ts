import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpSupplyDemandEquilibriumFrame
} from "../domains/economics/supply-demand-equilibrium-frame.ts";
import {
  createKpSupplyDemandEquilibriumModel,
  evaluateKpSupplyPrice
} from "../domains/economics/supply-demand-equilibrium-model.ts";

const exact = (numerator: string, denominator = "1") => ({
  numerator,
  denominator
});

test("economics frame projection samples exact before, midpoint, and after truth", () => {
  const model = createKpSupplyDemandEquilibriumModel();
  const before = sampleKpSupplyDemandEquilibriumFrame({
    model,
    progress: exact("0")
  });
  const midpoint = sampleKpSupplyDemandEquilibriumFrame({
    model,
    progress: exact("1", "2")
  });
  const after = sampleKpSupplyDemandEquilibriumFrame({
    model,
    progress: exact("1")
  });

  assert.deepEqual(
    [before.phase, midpoint.phase, after.phase],
    ["before", "shifting", "after"]
  );
  assert.deepEqual(
    [
      before.demand.priceInterceptCurrent,
      midpoint.demand.priceInterceptCurrent,
      after.demand.priceInterceptCurrent
    ],
    [exact("14"), exact("16"), exact("18")]
  );
  assert.deepEqual(midpoint.equilibrium, {
    id: "equilibrium.economics.supply-demand",
    quantity: exact("7"),
    price: exact("9")
  });
  assert.deepEqual(
    evaluateKpSupplyPrice({ model, quantity: midpoint.equilibrium.quantity }),
    midpoint.equilibrium.price
  );
});

test("every frame preserves persistent model and market-side identities", () => {
  const model = createKpSupplyDemandEquilibriumModel();
  const frames = ["0", "1", "2", "3", "4"].map((numerator) =>
    sampleKpSupplyDemandEquilibriumFrame({
      model,
      progress: exact(numerator, "4")
    })
  );

  for (const frame of frames) {
    assert.deepEqual(frame.axes, {
      quantityAxisId: "axis.economics.quantity",
      priceAxisId: "axis.economics.price",
      horizontalSymbol: "Q",
      verticalSymbol: "P"
    });
    assert.deepEqual(frame.activeSemanticIds, [
      "curve.economics.supply",
      "curve.economics.demand",
      "equilibrium.economics.supply-demand",
      "parameter.economics.demand-price-intercept"
    ]);
    assert.deepEqual(frame.marketSides, {
      surplus: "above-equilibrium-price",
      shortage: "below-equilibrium-price"
    });
  }
});

test("forward and rewind sample the same exact model states", () => {
  const model = createKpSupplyDemandEquilibriumModel();

  for (const numerator of ["0", "1", "2", "3", "4"]) {
    const forward = sampleKpSupplyDemandEquilibriumFrame({
      model,
      direction: "forward",
      progress: exact(numerator, "4")
    });
    const rewind = sampleKpSupplyDemandEquilibriumFrame({
      model,
      direction: "rewind",
      progress: exact(String(4 - Number(numerator)), "4")
    });

    assert.deepEqual(rewind.modelProgress, forward.modelProgress);
    assert.deepEqual(rewind.demand, forward.demand);
    assert.deepEqual(rewind.equilibrium, forward.equilibrium);
    assert.deepEqual(rewind.activeSemanticIds, forward.activeSemanticIds);
  }
});

test("economics frame projection rejects progress outside the unit interval", () => {
  const model = createKpSupplyDemandEquilibriumModel();

  assert.throws(
    () => sampleKpSupplyDemandEquilibriumFrame({ model, progress: exact("5", "4") }),
    /between zero and one/
  );
  assert.throws(
    () => sampleKpSupplyDemandEquilibriumFrame({ model, progress: exact("0", "0") }),
    /denominator cannot be zero/
  );
});

