import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpPerUnitTaxWelfareModel,
  type KpPerUnitTaxWelfareModelV1
} from "../domains/economics/per-unit-tax-welfare-model.ts";
import {
  kpPerUnitTaxWelfareExemplarInput
} from "../domains/economics/per-unit-tax-welfare.ts";
import {
  projectKpExactRationalLinearMarket
} from "../src/experiments/typed-linear-supply-demand/exact-rational-adapter.ts";
import {
  evaluateKpLinearMarketScenario
} from "../src/experiments/typed-linear-supply-demand/typed-linear-supply-demand.ts";
import {
  createKpStandardMathAuthoringContext
} from "../src/math/authoring/algebra.ts";
import {
  createKpUnitDescriptor,
  createKpUnitValue
} from "../src/math/authoring/units.ts";

const quantityUnit = createKpUnitDescriptor({
  id: "kp.unit.economics.negative.item",
  symbol: "item"
});
const priceUnit = createKpUnitDescriptor({
  id: "kp.unit.economics.negative.usd-per-item",
  symbol: "USD/item"
});
const welfareUnit = createKpUnitDescriptor({
  id: "kp.unit.economics.negative.usd",
  symbol: "USD"
});

test("the typed boundary rejects a forged tax unit", () => {
  const projection = project(createKpPerUnitTaxWelfareModel());

  assert.throws(
    () => evaluateKpLinearMarketScenario(projection.market, {
      kind: "per-unit-seller-tax",
      id: "forged-unit",
      amount: createKpUnitValue(welfareUnit, 4) as never
    }),
    /Tax amount must use unit kp\.unit\.economics\.negative\.usd-per-item/
  );
});

test("canonical slope validation fails before typed projection", () => {
  assert.throws(
    () => createKpPerUnitTaxWelfareModel({
      ...kpPerUnitTaxWelfareExemplarInput,
      supply: {
        ...kpPerUnitTaxWelfareExemplarInput.supply,
        priceChangePerQuantity: exact("0")
      }
    }),
    /supply\.priceChangePerQuantity: Must be positive/
  );
});

test("an infeasible canonical tax cannot escape through the typed view", () => {
  const model = createKpPerUnitTaxWelfareModel({
    ...kpPerUnitTaxWelfareExemplarInput,
    tax: {
      ...kpPerUnitTaxWelfareExemplarInput.tax,
      finalAmount: exact("10")
    }
  });

  assert.equal(model.states.taxed.quantity.numerator, "0");
  assert.throws(
    () => project(model),
    /requires a positive interior trade quantity/
  );
});

test("non-binary-exact rational input is never silently coerced", () => {
  const model = createKpPerUnitTaxWelfareModel({
    ...kpPerUnitTaxWelfareExemplarInput,
    supply: {
      ...kpPerUnitTaxWelfareExemplarInput.supply,
      priceChangePerQuantity: exact("1", "3")
    }
  });

  assert.throws(
    () => project(model),
    /supply\.priceChangePerQuantity cannot be projected exactly/
  );
});

test("explicit model and equilibrium source identity must close", () => {
  const model = createKpPerUnitTaxWelfareModel();
  const wrongModelId = {
    ...model,
    id: "model.economics.foreign"
  } as KpPerUnitTaxWelfareModelV1;
  const wrongStateId = {
    ...model,
    states: {
      ...model.states,
      taxed: {
        ...model.states.taxed,
        id: "equilibrium.economics.foreign"
      }
    }
  } as KpPerUnitTaxWelfareModelV1;

  assert.throws(
    () => project(wrongModelId),
    /model id must be model\.economics\.supply-demand\.per-unit-tax/
  );
  assert.throws(
    () => project(wrongStateId),
    /state ids must close over the declared equilibrium ids/
  );
});

test("a second exact market closes the welfare invariant", () => {
  const model = createKpPerUnitTaxWelfareModel({
    ...kpPerUnitTaxWelfareExemplarInput,
    demand: {
      ...kpPerUnitTaxWelfareExemplarInput.demand,
      priceIntercept: exact("14")
    }
  });
  const projection = project(model);

  assert.equal(projection.snapshots.untaxed.welfare.totalSurplus.magnitude, 36);
  assert.deepEqual(projection.snapshots.taxed.welfare, {
    consumerSurplus: unit(8, welfareUnit.id),
    producerSurplus: unit(8, welfareUnit.id),
    governmentRevenue: unit(16, welfareUnit.id),
    deadweightLoss: unit(4, welfareUnit.id),
    totalSurplus: unit(32, welfareUnit.id)
  });
  assert.equal(
    projection.snapshots.untaxed.welfare.totalSurplus.magnitude -
      projection.snapshots.taxed.welfare.totalSurplus.magnitude,
    projection.snapshots.taxed.welfare.deadweightLoss.magnitude
  );
});

test("the parity adapter does not acquire price-floor authority", async () => {
  const source = await readFile(
    "src/experiments/typed-linear-supply-demand/exact-rational-adapter.ts",
    "utf8"
  );

  assert.doesNotMatch(source, /price-floor/);
});

function project(model: KpPerUnitTaxWelfareModelV1) {
  return projectKpExactRationalLinearMarket({
    author: createKpStandardMathAuthoringContext({
      namespace: "lesson.economics.negative-parity"
    }),
    key: "market",
    model,
    units: { quantity: quantityUnit, price: priceUnit, welfare: welfareUnit }
  });
}

function exact(numerator: string, denominator = "1") {
  return { numerator, denominator };
}

function unit(magnitude: number, unitId: string) {
  return { magnitude, unitId };
}
