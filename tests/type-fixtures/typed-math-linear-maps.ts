import {
  createKpAdditiveCommutativeGroup,
  createKpScalarSystem,
  createKpVectorSpace
} from "../../src/math/algebra/algebraic-structures.ts";
import { createKpEquality } from "../../src/math/algebra/law-evidence.ts";
import {
  composeKpLinearMaps,
  createKpLinearMap
} from "../../src/math/algebra/linear-map.ts";
import { defineKpSemanticSpace } from "../../src/math/algebra/semantic-space.ts";
import { createKpDifferentiableMap } from "../../src/math/algebra/differentiable-map.ts";

const scalarEquality = createKpEquality<number>({
  id: "kp.equality.fixture.scalar",
  mode: "exact",
  equals: Object.is
});
const scalars = createKpScalarSystem({
  id: "kp.scalars.fixture",
  carrierId: "kp.carrier.fixture.scalar",
  equality: scalarEquality,
  zero: 0,
  one: 1,
  add: (left, right) => left + right,
  multiply: (left, right) => left * right,
  negate: (value) => -value
});

function oneDimensional<const Id extends string>(id: Id) {
  const descriptor = defineKpSemanticSpace<number>()({ id, dimension: 1 });
  const equality = createKpEquality<number>({
    id: `${id}.equality`,
    mode: "exact",
    equals: Object.is
  });
  return createKpVectorSpace({
    id: `${id}.vector-space`,
    space: descriptor,
    vectors: createKpAdditiveCommutativeGroup({
      id: `${id}.additive`,
      carrierId: id,
      equality,
      zero: 0,
      add: (left, right) => left + right,
      negate: (value) => -value
    }),
    scalars,
    scale: (scalar, value) => scalar * value
  });
}

const quantity = oneDimensional("kp.space.fixture.quantity");
const price = oneDimensional("kp.space.fixture.price");
const revenue = oneDimensional("kp.space.fixture.revenue");
const quantityToPrice = createKpLinearMap({
  id: "kp.map.fixture.quantity-to-price",
  domain: quantity,
  codomain: price,
  apply: (value) => 2 * value,
  linearity: {
    kind: "tested",
    suiteId: "kp.test.fixture.quantity-to-price",
    equalityId: price.vectors.equality.id
  }
});
const priceToRevenue = createKpLinearMap({
  id: "kp.map.fixture.price-to-revenue",
  domain: price,
  codomain: revenue,
  apply: (value) => 3 * value,
  linearity: {
    kind: "tested",
    suiteId: "kp.test.fixture.price-to-revenue",
    equalityId: revenue.vectors.equality.id
  }
});
const quantityToRevenue = createKpLinearMap({
  id: "kp.map.fixture.quantity-to-revenue",
  domain: quantity,
  codomain: revenue,
  apply: (value) => 6 * value,
  linearity: {
    kind: "tested",
    suiteId: "kp.test.fixture.quantity-to-revenue",
    equalityId: revenue.vectors.equality.id
  }
});

composeKpLinearMaps({
  id: "kp.map.fixture.valid-composition",
  inner: quantityToPrice,
  outer: priceToRevenue
});
composeKpLinearMaps({
  id: "kp.map.fixture.invalid-composition",
  inner: quantityToPrice,
  // @ts-expect-error Quantity and price are distinct intermediate spaces.
  outer: quantityToRevenue
});

createKpDifferentiableMap({
  id: "kp.function.fixture.valid-derivative",
  domain: quantity,
  codomain: price,
  evaluate: (value) => 2 * value,
  derivativeAt: () => quantityToPrice
});
createKpDifferentiableMap({
  id: "kp.function.fixture.invalid-derivative",
  domain: quantity,
  codomain: price,
  evaluate: (value) => 2 * value,
  // @ts-expect-error A derivative must preserve the declared semantic spaces.
  derivativeAt: () => quantityToRevenue
});
