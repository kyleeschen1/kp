import assert from "node:assert/strict";
import test from "node:test";

import { createKpDifferentiableMap } from "../src/math/algebra/differentiable-map.ts";
import { createKpFiniteBasis } from "../src/math/algebra/finite-basis.ts";
import {
  projectKpDerivativeAtToJacobian
} from "../src/math/algebra/jacobian-projection.ts";
import { createKpLinearMap } from "../src/math/algebra/linear-map.ts";
import {
  applyKpMatrixRepresentation
} from "../src/math/algebra/matrix-representation.ts";
import { createKpCartesianSpace } from "../src/math/algebra/standard-spaces.ts";

type Vec2 = readonly [number, number];

function standardBasis<const Id extends string>(
  id: string,
  space: ReturnType<typeof createKpCartesianSpace<Id, 2>>
) {
  return createKpFiniteBasis({
    id,
    space,
    vectors: [[1, 0] as Vec2, [0, 1] as Vec2] as const,
    coordinates: (value) => value,
    fromCoordinates: (coordinates) => coordinates,
    coordinateIsomorphism: {
      kind: "tested" as const,
      suiteId: `${id}.round-trip-test`,
      equalityId: space.vectors.equality.id
    }
  });
}

function affineDifferentiableMap() {
  const domain = createKpCartesianSpace({
    id: "kp.space.jacobian.domain",
    dimension: 2
  });
  const codomain = createKpCartesianSpace({
    id: "kp.space.jacobian.codomain",
    dimension: 2
  });
  const source = createKpDifferentiableMap({
    id: "kp.function.jacobian.affine",
    domain,
    codomain,
    evaluate: (value): Vec2 => [
      2 * value[0]! + value[1]!,
      4 * value[0]! - 3 * value[1]!
    ],
    derivativeAt: () => createKpLinearMap({
      id: "kp.derivative.jacobian.affine",
      domain,
      codomain,
      apply: (tangent): Vec2 => [
        2 * tangent[0]! + tangent[1]!,
        4 * tangent[0]! - 3 * tangent[1]!
      ],
      linearity: {
        kind: "tested",
        suiteId: "kp.test.derivative.jacobian.affine",
        equalityId: codomain.vectors.equality.id
      }
    })
  });
  return { source, domain, codomain };
}

test("Jacobian projection requires and retains both finite bases", () => {
  const { source, domain, codomain } = affineDifferentiableMap();
  const result = projectKpDerivativeAtToJacobian({
    id: "kp.jacobian-projection.affine",
    source,
    at: [3, 4],
    domainBasis: standardBasis("kp.basis.jacobian.domain", domain),
    codomainBasis: standardBasis("kp.basis.jacobian.codomain", codomain)
  });

  assert.equal(result.status, "projected");
  if (result.status !== "projected") return;
  assert.deepEqual(result.representation.rows, [[2, 1], [4, -3]]);
  assert.deepEqual(
    applyKpMatrixRepresentation(result.representation, [5, 2]),
    result.derivative.apply([5, 2])
  );
  assert.equal(result.representation.domainBasis.id, "kp.basis.jacobian.domain");
  assert.equal(
    result.representation.codomainBasis.id,
    "kp.basis.jacobian.codomain"
  );
  assert.deepEqual(result.compact, {
    kind: "compact-derivative",
    id: "kp.jacobian-projection.affine.compact",
    operator: "D",
    sourceFunctionId: source.id,
    derivativeMapId: "kp.derivative.jacobian.affine"
  });
});

test("missing bases retain Df(x) and return an explicit repair gap", () => {
  const { source } = affineDifferentiableMap();
  const result = projectKpDerivativeAtToJacobian({
    id: "kp.jacobian-projection.missing-bases",
    source,
    at: [3, 4]
  });

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.code, "kp.calculus.basis-required");
  assert.deepEqual(result.missing, ["domain-basis", "codomain-basis"]);
  assert.deepEqual(result.derivative.apply([5, 2]), [12, 14]);
  assert.equal(result.compact.operator, "D");
  assert.match(result.repair, /Supply explicit finite bases/);
  assert.equal(Object.isFrozen(result.missing), true);
});
