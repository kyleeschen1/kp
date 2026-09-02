import { composeKpLinearMaps, createKpLinearMap } from "../../src/math/algebra/linear-map.ts";
import {
  createKpUnitDescriptor,
  createKpUnitTaggedScalarSpace,
  createKpUnitValue
} from "../../src/math/algebra/unit-tagged-space.ts";

const quantityUnit = createKpUnitDescriptor({ id: "kp.unit.fixture.quantity", symbol: "Q" });
const priceUnit = createKpUnitDescriptor({ id: "kp.unit.fixture.price", symbol: "P" });
const revenueUnit = createKpUnitDescriptor({ id: "kp.unit.fixture.revenue", symbol: "R" });
const quantity = createKpUnitTaggedScalarSpace({
  id: "kp.space.fixture.unit-quantity",
  unit: quantityUnit
});
const price = createKpUnitTaggedScalarSpace({
  id: "kp.space.fixture.unit-price",
  unit: priceUnit
});
const revenue = createKpUnitTaggedScalarSpace({
  id: "kp.space.fixture.unit-revenue",
  unit: revenueUnit
});
const quantityToPrice = createKpLinearMap({
  id: "kp.map.fixture.unit-quantity-to-price",
  domain: quantity,
  codomain: price,
  apply: (value) => createKpUnitValue(priceUnit, -2 * value.magnitude),
  linearity: {
    kind: "tested",
    suiteId: "kp.test.fixture.unit-quantity-to-price",
    equalityId: price.vectors.equality.id
  }
});
const priceToRevenue = createKpLinearMap({
  id: "kp.map.fixture.unit-price-to-revenue",
  domain: price,
  codomain: revenue,
  apply: (value) => createKpUnitValue(revenueUnit, 5 * value.magnitude),
  linearity: {
    kind: "tested",
    suiteId: "kp.test.fixture.unit-price-to-revenue",
    equalityId: revenue.vectors.equality.id
  }
});

composeKpLinearMaps({
  id: "kp.map.fixture.valid-unit-composition",
  inner: quantityToPrice,
  outer: priceToRevenue
});
composeKpLinearMaps({
  id: "kp.map.fixture.invalid-unit-composition",
  inner: quantityToPrice,
  // @ts-expect-error Price and quantity remain distinct despite dimension one.
  outer: quantityToPrice
});
