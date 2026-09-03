import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpLinearSupplyDemandExperiment
} from "../src/experiments/typed-linear-supply-demand/typed-linear-supply-demand.ts";
import {
  createKpStandardMathAuthoringContext
} from "../src/math/authoring/algebra.ts";
import {
  createKpUnitDescriptor,
  createKpUnitValue
} from "../src/math/authoring/units.ts";
import {
  measureKpUnitScalarAuthoringBurden,
  type KpUnitScalarHelperBaseline
} from "../scripts/measure-unit-scalar-map-helper.ts";
import {
  createKpCircleMeasurement
} from "./fixtures/typed-circle-measurement.ts";

const baseline = JSON.parse(readFileSync(
  "tests/fixtures/unit-scalar-map-helper-baseline.json",
  "utf8"
)) as KpUnitScalarHelperBaseline;

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
const radiusUnit = createKpUnitDescriptor({
  id: "kp.unit.pressure.meter",
  symbol: "m"
});
const areaUnit = createKpUnitDescriptor({
  id: "kp.unit.pressure.square-meter",
  symbol: "m²"
});

test("market and circle retain the frozen before-helper comparison", () => {
  const current = measureKpUnitScalarAuthoringBurden();
  assert.equal(baseline.authoring.totals.authoredSetupLines, 148);
  assert.equal(baseline.authoring.totals.constructorCalls, 8);
  assert.equal(baseline.authoring.totals.unitGuardCalls, 6);

  for (const before of baseline.authoring.callers) {
    assert.deepEqual(before.constructorCalls, {
      createKpUnitTaggedScalarSpace: 2,
      createKpDifferentiableMap: 1,
      createKpLinearMap: 1
    });
    assert.equal(before.unitGuardCalls, 3);
    assert.equal(before.derivativeUnitProjectionCalls, 1);

    const after = current.callers.find(({ id }) => id === before.id);
    if (after === undefined) {
      throw new Error(`Missing current burden measurement for ${before.id}.`);
    }
    if (after.constructorCalls["defineKpAuthoredUnitScalarMap"] === undefined) {
      assert.deepEqual(after, before);
    } else {
      assert.ok(after.authoredSetupLines < before.authoredSetupLines);
      assert.deepEqual(after.constructorCalls, {
        defineKpAuthoredUnitScalarMap: 1
      });
      assert.equal(after.unitGuardCalls, 0);
      assert.equal(after.derivativeUnitProjectionCalls, 0);
    }
  }
});

test("market maps preserve exact identity spaces units rules and evidence", () => {
  const market = createKpLinearSupplyDemandExperiment({
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
  const quantity = createKpUnitValue(quantityUnit, 10);
  const change = createKpUnitValue(quantityUnit, 3);

  assert.deepEqual(describeSpace(market.spaces.quantity), {
    id: "lesson.linear-market.markets.widgets.spaces.quantity.vector-space",
    spaceId: "lesson.linear-market.markets.widgets.spaces.quantity",
    label: "Market quantity",
    dimension: 1,
    unitId: quantityUnit.id,
    equalityId: "lesson.linear-market.markets.widgets.spaces.quantity." +
      "equality.kp.equality.float64.absolute.1e-12"
  });
  assert.deepEqual(describeSpace(market.spaces.price), {
    id: "lesson.linear-market.markets.widgets.spaces.price.vector-space",
    spaceId: "lesson.linear-market.markets.widgets.spaces.price",
    label: "Market price",
    dimension: 1,
    unitId: priceUnit.id,
    equalityId: "lesson.linear-market.markets.widgets.spaces.price." +
      "equality.kp.equality.float64.absolute.1e-12"
  });
  assert.deepEqual(describeMap(market.demand.priceAt, quantity, change), {
    id: "lesson.linear-market.markets.widgets.functions.demand-price-at-quantity",
    sourceFunctionIds: [
      "lesson.linear-market.markets.widgets.curves.demand"
    ],
    value: { magnitude: 80, unitId: priceUnit.id },
    derivativeId: "lesson.linear-market.markets.widgets.derivatives.demand",
    derivativeSourceMapIds: [
      "lesson.linear-market.markets.widgets.curves.demand"
    ],
    derivativeValue: { magnitude: -6, unitId: priceUnit.id },
    linearity: {
      kind: "tested",
      suiteId: "kp.test.typed-linear-supply-demand.derivative-linearity",
      equalityId: market.spaces.price.vectors.equality.id
    }
  });
  assert.deepEqual(describeMap(market.supply.priceAt, quantity, change), {
    id: "lesson.linear-market.markets.widgets.functions.supply-price-at-quantity",
    sourceFunctionIds: [
      "lesson.linear-market.markets.widgets.curves.supply"
    ],
    value: { magnitude: 20, unitId: priceUnit.id },
    derivativeId: "lesson.linear-market.markets.widgets.derivatives.supply",
    derivativeSourceMapIds: [
      "lesson.linear-market.markets.widgets.curves.supply"
    ],
    derivativeValue: { magnitude: 3, unitId: priceUnit.id },
    linearity: {
      kind: "tested",
      suiteId: "kp.test.typed-linear-supply-demand.derivative-linearity",
      equalityId: market.spaces.price.vectors.equality.id
    }
  });
  assert.equal(
    market.demand.derivativeUnitLatex,
    "\\frac{\\mathrm{USD}}{\\mathrm{item}}"
  );
  assert.throws(
    () => market.demand.priceAt.evaluate(
      createKpUnitValue(priceUnit, 10) as never
    ),
    /Demand quantity must use unit kp.unit.pressure.item; received kp.unit.pressure.usd\./
  );
  assert.throws(
    () => market.demand.priceAt.derivativeAt(quantity).apply(
      createKpUnitValue(priceUnit, 1) as never
    ),
    /Demand quantity change must use unit kp.unit.pressure.item; received kp.unit.pressure.usd\./
  );
});

test("circle map preserves nonlinear pointwise behavior and diagnostics", () => {
  const circle = createKpCircleMeasurement({
    author: createKpStandardMathAuthoringContext({
      namespace: "lesson.circle-measurement"
    }),
    key: "garden",
    units: { radius: radiusUnit, area: areaUnit }
  });
  const atTwo = createKpUnitValue(radiusUnit, 2);
  const change = createKpUnitValue(radiusUnit, 0.5);

  assert.deepEqual(describeSpace(circle.spaces.radius), {
    id: "lesson.circle-measurement.circles.garden.spaces.radius.vector-space",
    spaceId: "lesson.circle-measurement.circles.garden.spaces.radius",
    label: "Circle radius",
    dimension: 1,
    unitId: radiusUnit.id,
    equalityId: "lesson.circle-measurement.circles.garden.spaces.radius." +
      "equality.kp.equality.float64.absolute.1e-12"
  });
  assert.deepEqual(describeSpace(circle.spaces.area), {
    id: "lesson.circle-measurement.circles.garden.spaces.area.vector-space",
    spaceId: "lesson.circle-measurement.circles.garden.spaces.area",
    label: "Circle area",
    dimension: 1,
    unitId: areaUnit.id,
    equalityId: "lesson.circle-measurement.circles.garden.spaces.area." +
      "equality.kp.equality.float64.absolute.1e-12"
  });
  assert.deepEqual(describeMap(circle.areaAtRadius, atTwo, change), {
    id: "lesson.circle-measurement.circles.garden.functions.area-at-radius",
    sourceFunctionIds: ["lesson.circle-measurement.circles.garden"],
    value: { magnitude: 4 * Math.PI, unitId: areaUnit.id },
    derivativeId: "lesson.circle-measurement.circles.garden.derivatives.area-at-radius",
    derivativeSourceMapIds: [
      "lesson.circle-measurement.circles.garden.functions.area-at-radius"
    ],
    derivativeValue: { magnitude: 2 * Math.PI, unitId: areaUnit.id },
    linearity: {
      kind: "tested",
      suiteId: "kp.test.typed-circle-measurement.derivative-linearity",
      equalityId: circle.spaces.area.vectors.equality.id
    }
  });
  assert.deepEqual(
    circle.areaAtRadius.derivativeAt(
      createKpUnitValue(radiusUnit, 3)
    ).apply(change),
    { magnitude: 3 * Math.PI, unitId: areaUnit.id }
  );
  assert.equal(circle.derivativeUnitLatex, "\\frac{\\mathrm{m²}}{\\mathrm{m}}");
  assert.throws(
    () => circle.areaAtRadius.derivativeAt(
      createKpUnitValue(areaUnit, 2) as never
    ),
    /Circle derivative point must use unit kp.unit.pressure.meter; received kp.unit.pressure.square-meter\./
  );
});

function describeSpace(space: {
  readonly id: string;
  readonly space: Readonly<{ id: string; label: string; dimension: number }>;
  readonly vectors: Readonly<{
    zero: Readonly<{ unitId: string }>;
    equality: Readonly<{ id: string }>;
  }>;
}) {
  return {
    id: space.id,
    spaceId: space.space.id,
    label: space.space.label,
    dimension: space.space.dimension,
    unitId: space.vectors.zero.unitId,
    equalityId: space.vectors.equality.id
  };
}

function describeMap<Domain, Codomain>(
  map: {
    readonly id: string;
    readonly sourceFunctionIds: readonly string[];
    readonly evaluate: (value: Domain) => Codomain;
    readonly derivativeAt: (value: Domain) => Readonly<{
      id: string;
      sourceMapIds: readonly string[];
      apply: (change: Domain) => Codomain;
      linearity: unknown;
    }>;
  },
  point: Domain,
  change: Domain
) {
  const derivative = map.derivativeAt(point);
  return {
    id: map.id,
    sourceFunctionIds: map.sourceFunctionIds,
    value: map.evaluate(point),
    derivativeId: derivative.id,
    derivativeSourceMapIds: derivative.sourceMapIds,
    derivativeValue: derivative.apply(change),
    linearity: derivative.linearity
  };
}
