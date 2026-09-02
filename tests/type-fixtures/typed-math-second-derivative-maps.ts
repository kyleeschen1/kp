import {
  createKpSecondDerivativeMap,
  type KpSecondDerivativeMap
} from "../../src/math/algebra/second-derivative-map.ts";
import { createKpStandardScalarSpace } from "../../src/math/algebra/standard-spaces.ts";

const quantity = createKpStandardScalarSpace({
  id: "kp.space.second-fixture.quantity"
});
const price = createKpStandardScalarSpace({
  id: "kp.space.second-fixture.price"
});
const revenue = createKpStandardScalarSpace({
  id: "kp.space.second-fixture.revenue"
});
const evidence = {
  kind: "tested" as const,
  suiteId: "kp.test.second-fixture.bilinearity",
  equalityId: price.vectors.equality.id
};
const priceResponse = createKpSecondDerivativeMap({
  id: "kp.second-fixture.price-response",
  domain: quantity,
  codomain: price,
  apply: (left, right) => left * right,
  leftLinearity: evidence,
  rightLinearity: evidence
});
const revenueResponse = createKpSecondDerivativeMap({
  id: "kp.second-fixture.revenue-response",
  domain: quantity,
  codomain: revenue,
  apply: (left, right) => left * right,
  leftLinearity: {
    ...evidence,
    equalityId: revenue.vectors.equality.id
  },
  rightLinearity: {
    ...evidence,
    equalityId: revenue.vectors.equality.id
  }
});

const expected: KpSecondDerivativeMap<
  number,
  number,
  number,
  "kp.space.second-fixture.quantity",
  "kp.space.second-fixture.price"
> = priceResponse;
void expected;

// @ts-expect-error Equal runtime dimensions do not erase semantic codomain identity.
const invalid: typeof priceResponse = revenueResponse;
void invalid;
