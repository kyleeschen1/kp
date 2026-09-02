import assert from "node:assert/strict";
import test from "node:test";

import { createKpFiniteBasis } from "../src/math/algebra/finite-basis.ts";
import { createKpLinearMap } from "../src/math/algebra/linear-map.ts";
import { representKpLinearMap } from "../src/math/algebra/matrix-representation.ts";
import { createKpCartesianSpace } from "../src/math/algebra/standard-spaces.ts";
import {
  createKpTypedMatrixFromRepresentation
} from "../src/math/algebra/typed-matrix-adapter.ts";
import { constant } from "../src/math/expression.ts";
import {
  createKpScalarExpression,
  createKpTypedMatrix,
  evaluateKpTypedMatrix,
  multiplyKpTypedMatrices,
  rebuildKpTypedMatrix
} from "../src/math/typed-semantic-math.ts";

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
      kind: "tested",
      suiteId: `${id}.round-trip-test`,
      equalityId: space.vectors.equality.id
    }
  });
}

function scalar(id: string, value: number) {
  return createKpScalarExpression({ id, expression: constant(value) });
}

test("basis-aware representations adapt without changing typed-matrix shape", () => {
  const domain = createKpCartesianSpace({
    id: "kp.space.adapter.domain",
    dimension: 2
  });
  const codomain = createKpCartesianSpace({
    id: "kp.space.adapter.codomain",
    dimension: 2
  });
  const map = createKpLinearMap({
    id: "kp.map.adapter.fixture",
    domain,
    codomain,
    apply: (value): Vec2 => [
      2 * value[0]! + value[1]!,
      3 * value[1]!
    ],
    linearity: {
      kind: "tested",
      suiteId: "kp.test.map.adapter.fixture",
      equalityId: codomain.vectors.equality.id
    }
  });
  const representation = representKpLinearMap({
    id: "kp.matrix-representation.adapter.fixture",
    map,
    domainBasis: standardBasis("kp.basis.adapter.domain", domain),
    codomainBasis: standardBasis("kp.basis.adapter.codomain", codomain)
  });
  const matrix = createKpTypedMatrixFromRepresentation({
    id: "kp.matrix.adapter.fixture",
    representation
  });

  assert.deepEqual(evaluateKpTypedMatrix(matrix, {}), [[2, 1], [0, 3]]);
  assert.deepEqual(matrix.representation, {
    kind: "matrix-representation-ref",
    id: representation.id,
    sourceMapId: map.id,
    domainSpaceId: domain.space.id,
    codomainSpaceId: codomain.space.id,
    domainBasisId: representation.domainBasis.id,
    codomainBasisId: representation.codomainBasis.id
  });
  assert.equal(Object.isFrozen(matrix.representation), true);

  const rebuilt = rebuildKpTypedMatrix({
    source: matrix,
    rows: matrix.rows
  });
  assert.equal(rebuilt.representation, matrix.representation);
});

test("ordinary matrix construction and multiplication do not invent bases", () => {
  const left = createKpTypedMatrix({
    id: "kp.matrix.adapter.legacy-left",
    rows: [[scalar("kp.scalar.adapter.left", 2)]] as const
  });
  const right = createKpTypedMatrix({
    id: "kp.matrix.adapter.legacy-right",
    rows: [[scalar("kp.scalar.adapter.right", 3)]] as const
  });
  const product = multiplyKpTypedMatrices({
    id: "kp.matrix.adapter.legacy-product",
    left,
    right
  });

  assert.equal(left.representation, undefined);
  assert.equal(product.representation, undefined);
  assert.deepEqual(evaluateKpTypedMatrix(product, {}), [[6]]);
});
