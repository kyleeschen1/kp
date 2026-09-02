import assert from "node:assert/strict";
import test from "node:test";

import { createKpDifferentiableMap } from "../src/math/algebra/differentiable-map.ts";
import { composeKpLinearMaps, createKpLinearMap } from "../src/math/algebra/linear-map.ts";
import {
  createKpUnitDescriptor,
  createKpUnitTaggedScalarSpace,
  createKpUnitValue,
  projectKpDerivativeUnitToLatex
} from "../src/math/algebra/unit-tagged-space.ts";

test("unit-tagged price response retains dP/dQ meaning and value", () => {
  const quantityUnit = createKpUnitDescriptor({ id: "kp.unit.item", symbol: "item" });
  const priceUnit = createKpUnitDescriptor({ id: "kp.unit.usd", symbol: "USD" });
  const quantity = createKpUnitTaggedScalarSpace({
    id: "kp.space.economics.quantity",
    label: "Quantity",
    unit: quantityUnit
  });
  const price = createKpUnitTaggedScalarSpace({
    id: "kp.space.economics.price",
    label: "Price",
    unit: priceUnit
  });
  const priceResponse = createKpDifferentiableMap({
    id: "kp.function.economics.inverse-demand",
    domain: quantity,
    codomain: price,
    evaluate: (value) => createKpUnitValue(
      priceUnit,
      100 - 2 * value.magnitude
    ),
    derivativeAt: () => createKpLinearMap({
      id: "kp.derivative.economics.price-per-quantity",
      domain: quantity,
      codomain: price,
      apply: (change) => createKpUnitValue(priceUnit, -2 * change.magnitude),
      linearity: {
        kind: "tested",
        suiteId: "kp.test.economics.price-response-linearity",
        equalityId: price.vectors.equality.id
      }
    })
  });

  assert.deepEqual(
    priceResponse.evaluate(createKpUnitValue(quantityUnit, 10)),
    { magnitude: 80, unitId: "kp.unit.usd" }
  );
  assert.deepEqual(
    priceResponse.derivativeAt(createKpUnitValue(quantityUnit, 10))
      .apply(createKpUnitValue(quantityUnit, 3)),
    { magnitude: -6, unitId: "kp.unit.usd" }
  );
  assert.equal(projectKpDerivativeUnitToLatex({
    domain: quantityUnit,
    codomain: priceUnit
  }), "\\frac{\\mathrm{USD}}{\\mathrm{item}}");
});

test("equal dimensions do not permit invalid economics composition", () => {
  const quantityUnit = createKpUnitDescriptor({ id: "kp.unit.quantity", symbol: "Q" });
  const priceUnit = createKpUnitDescriptor({ id: "kp.unit.price", symbol: "P" });
  const quantity = createKpUnitTaggedScalarSpace({
    id: "kp.space.economics.runtime-quantity",
    unit: quantityUnit
  });
  const price = createKpUnitTaggedScalarSpace({
    id: "kp.space.economics.runtime-price",
    unit: priceUnit
  });
  const response = createKpLinearMap({
    id: "kp.map.economics.runtime-response",
    domain: quantity,
    codomain: price,
    apply: (value) => createKpUnitValue(priceUnit, value.magnitude),
    linearity: {
      kind: "tested",
      suiteId: "kp.test.economics.runtime-response",
      equalityId: price.vectors.equality.id
    }
  });

  assert.throws(
    () => composeKpLinearMaps({
      id: "kp.map.economics.invalid-composition",
      inner: response,
      outer: response as never
    }),
    /cannot compose kp.space.economics.runtime-price with kp.space.economics.runtime-quantity/
  );
});
