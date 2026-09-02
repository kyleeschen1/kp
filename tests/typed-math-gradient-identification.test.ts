import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpInnerProductDuality,
  identifyKpGradient
} from "../src/math/algebra/gradient-identification.ts";
import { createKpLinearMap } from "../src/math/algebra/linear-map.ts";
import {
  createKpCartesianSpace,
  createKpStandardScalarSpace
} from "../src/math/algebra/standard-spaces.ts";

type Vec2 = readonly [number, number];

function fixture() {
  const domain = createKpCartesianSpace({
    id: "kp.space.gradient.domain",
    dimension: 2
  });
  const scalars = createKpStandardScalarSpace({
    id: "kp.space.gradient.scalars"
  });
  const covector = createKpLinearMap({
    id: "kp.covector.gradient.fixture",
    domain,
    codomain: scalars,
    apply: (value) => 2 * value[0]! + 4 * value[1]!,
    linearity: {
      kind: "tested",
      suiteId: "kp.test.covector.gradient.fixture",
      equalityId: scalars.vectors.equality.id
    }
  });
  const duality = createKpInnerProductDuality({
    id: "kp.duality.gradient.euclidean",
    space: domain,
    scalarSpace: scalars,
    pair: (left, right) =>
      left[0]! * right[0]! + left[1]! * right[1]!,
    vectorFromCovector: (value): Vec2 => [
      value.apply([1, 0]),
      value.apply([0, 1])
    ],
    representationEvidence: {
      kind: "tested",
      suiteId: "kp.test.duality.gradient.euclidean",
      equalityId: scalars.vectors.equality.id
    }
  });
  return { domain, scalars, covector, duality };
}

test("a covector does not become a gradient without inner-product duality", () => {
  const { covector } = fixture();
  const result = identifyKpGradient({
    id: "kp.gradient-identification.missing-duality",
    covector
  });

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.code, "kp.calculus.inner-product-required");
  assert.equal(result.covector, covector);
  assert.equal(result.covector.apply([3, 5]), 26);
  assert.match(result.repair, /Supply an inner-product duality/);
});

test("Euclidean duality identifies and verifies the gradient vector", () => {
  const { covector, duality } = fixture();
  const result = identifyKpGradient({
    id: "kp.gradient-identification.euclidean",
    covector,
    duality
  });

  assert.equal(result.status, "identified");
  if (result.status !== "identified") return;
  assert.deepEqual(result.gradient, [2, 4]);
  assert.equal(
    duality.pair(result.gradient, [3, 5]),
    covector.apply([3, 5])
  );
  assert.equal(result.duality.representationEvidence.kind, "tested");
});

test("gradient identification rejects a same-dimension duality for another space", () => {
  const { covector, scalars, duality } = fixture();
  const wrongDomain = createKpCartesianSpace({
    id: "kp.space.gradient.wrong-domain",
    dimension: 2
  });
  const wrongDuality = createKpInnerProductDuality({
    id: "kp.duality.gradient.wrong-domain",
    space: wrongDomain,
    scalarSpace: scalars,
    pair: (left, right) => left[0]! * right[0]! + left[1]! * right[1]!,
    vectorFromCovector: (value): Vec2 => [
      value.apply([1, 0]),
      value.apply([0, 1])
    ],
    representationEvidence: {
      kind: "tested",
      suiteId: "kp.test.duality.gradient.wrong-domain",
      equalityId: scalars.vectors.equality.id
    }
  });

  assert.throws(
    () => identifyKpGradient({
      id: "kp.gradient-identification.wrong-domain",
      covector,
      duality: wrongDuality as unknown as typeof duality
    }),
    /mismatched domain duality/
  );
});
