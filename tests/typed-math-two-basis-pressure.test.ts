import assert from "node:assert/strict";
import test from "node:test";

import { createKpFiniteBasis } from "../src/math/algebra/finite-basis.ts";
import { createKpLinearMap } from "../src/math/algebra/linear-map.ts";
import {
  applyKpMatrixRepresentation,
  representKpLinearMap
} from "../src/math/algebra/matrix-representation.ts";
import { createKpCartesianSpace } from "../src/math/algebra/standard-spaces.ts";
import {
  createKpTypedMatrixFromRepresentation
} from "../src/math/algebra/typed-matrix-adapter.ts";
import { evaluateKpTypedMatrix } from "../src/math/typed-semantic-math.ts";

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

function diagonalBasis<const Id extends string>(
  id: string,
  space: ReturnType<typeof createKpCartesianSpace<Id, 2>>
) {
  return createKpFiniteBasis({
    id,
    space,
    vectors: [[1, 1] as Vec2, [1, -1] as Vec2] as const,
    coordinates: (value) => [
      (value[0]! + value[1]!) / 2,
      (value[0]! - value[1]!) / 2
    ] as const,
    fromCoordinates: (coordinates) => [
      coordinates[0]! + coordinates[1]!,
      coordinates[0]! - coordinates[1]!
    ] as const,
    coordinateIsomorphism: {
      kind: "tested" as const,
      suiteId: `${id}.round-trip-test`,
      equalityId: space.vectors.equality.id
    }
  });
}

test("one affine derivative has distinct, behaviorally equivalent basis matrices", () => {
  const domain = createKpCartesianSpace({
    id: "kp.space.two-basis.domain",
    dimension: 2
  });
  const codomain = createKpCartesianSpace({
    id: "kp.space.two-basis.codomain",
    dimension: 2
  });
  const derivative = createKpLinearMap({
    id: "kp.derivative.two-basis.affine",
    domain,
    codomain,
    apply: (value): Vec2 => [
      2 * value[0]! + value[1]!,
      4 * value[0]! - 3 * value[1]!
    ],
    linearity: {
      kind: "tested",
      suiteId: "kp.test.derivative.two-basis.affine",
      equalityId: codomain.vectors.equality.id
    }
  });
  const standardDomain = standardBasis("kp.basis.two-basis.domain.standard", domain);
  const standardCodomain = standardBasis(
    "kp.basis.two-basis.codomain.standard",
    codomain
  );
  const diagonalDomain = diagonalBasis("kp.basis.two-basis.domain.diagonal", domain);
  const diagonalCodomain = diagonalBasis(
    "kp.basis.two-basis.codomain.diagonal",
    codomain
  );
  const standard = representKpLinearMap({
    id: "kp.representation.two-basis.standard",
    map: derivative,
    domainBasis: standardDomain,
    codomainBasis: standardCodomain
  });
  const diagonal = representKpLinearMap({
    id: "kp.representation.two-basis.diagonal",
    map: derivative,
    domainBasis: diagonalDomain,
    codomainBasis: diagonalCodomain
  });
  const value: Vec2 = [5, 2];

  assert.deepEqual(standard.rows, [[2, 1], [4, -3]]);
  assert.deepEqual(diagonal.rows, [[2, 4], [1, -3]]);
  assert.notDeepEqual(standard.rows, diagonal.rows);
  assert.deepEqual(applyKpMatrixRepresentation(standard, value), derivative.apply(value));
  assert.deepEqual(applyKpMatrixRepresentation(diagonal, value), derivative.apply(value));
  assert.deepEqual(
    diagonalDomain.fromCoordinates(diagonalDomain.coordinates(value)),
    value
  );
  const output = derivative.apply(value);
  assert.deepEqual(
    diagonalCodomain.fromCoordinates(diagonalCodomain.coordinates(output)),
    output
  );

  const standardTyped = createKpTypedMatrixFromRepresentation({
    id: "kp.typed-matrix.two-basis.standard",
    representation: standard
  });
  const diagonalTyped = createKpTypedMatrixFromRepresentation({
    id: "kp.typed-matrix.two-basis.diagonal",
    representation: diagonal
  });
  assert.deepEqual(evaluateKpTypedMatrix(standardTyped, {}), standard.rows);
  assert.deepEqual(evaluateKpTypedMatrix(diagonalTyped, {}), diagonal.rows);
  assert.notEqual(
    standardTyped.representation?.domainBasisId,
    diagonalTyped.representation?.domainBasisId
  );
});
