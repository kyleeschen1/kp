import assert from "node:assert/strict";
import test from "node:test";

import { createKpFiniteBasis } from "../src/math/algebra/finite-basis.ts";
import {
  projectKpSecondDerivativeToHessian
} from "../src/math/algebra/hessian-projection.ts";
import { createKpSecondDerivativeMap } from "../src/math/algebra/second-derivative-map.ts";
import {
  createKpCartesianSpace,
  createKpStandardScalarSpace
} from "../src/math/algebra/standard-spaces.ts";
import { add, multiply, power } from "../src/math/expression.ts";
import {
  createKpScalarExpression,
  createKpScalarParameter,
  defineKpTypedFunction,
  deriveKpHessian,
  evaluateKpTypedMatrix
} from "../src/math/typed-semantic-math.ts";

type Vec2 = readonly [number, number];

function fixture() {
  const domain = createKpCartesianSpace({
    id: "kp.space.hessian.domain",
    dimension: 2
  });
  const codomain = createKpStandardScalarSpace({
    id: "kp.space.hessian.codomain"
  });
  const domainBasis = createKpFiniteBasis({
    id: "kp.basis.hessian.domain",
    space: domain,
    vectors: [[1, 0] as Vec2, [0, 1] as Vec2] as const,
    coordinates: (value) => value,
    fromCoordinates: (coordinates) => coordinates,
    coordinateIsomorphism: {
      kind: "tested" as const,
      suiteId: "kp.test.basis.hessian.domain",
      equalityId: domain.vectors.equality.id
    }
  });
  const codomainBasis = createKpFiniteBasis({
    id: "kp.basis.hessian.codomain",
    space: codomain,
    vectors: [1] as const,
    coordinates: (value) => [value] as const,
    fromCoordinates: (coordinates) => coordinates[0]!,
    coordinateIsomorphism: {
      kind: "tested" as const,
      suiteId: "kp.test.basis.hessian.codomain",
      equalityId: codomain.vectors.equality.id
    }
  });
  const evidence = {
    kind: "tested" as const,
    suiteId: "kp.test.hessian.quadratic.symmetry",
    equalityId: codomain.vectors.equality.id
  };
  const secondDerivative = createKpSecondDerivativeMap({
    id: "kp.second-derivative.hessian.quadratic",
    domain,
    codomain,
    apply: (left, right) =>
      2 * left[0]! * right[0]! + left[0]! * right[1]! +
      left[1]! * right[0]! + 2 * left[1]! * right[1]!,
    leftLinearity: evidence,
    rightLinearity: evidence,
    sourceFunctionIds: ["kp.function.hessian.quadratic"]
  });
  return { domainBasis, codomainBasis, evidence, secondDerivative };
}

test("Hessian projection retains bases and named symmetry evidence", () => {
  const value = fixture();
  const result = projectKpSecondDerivativeToHessian({
    id: "kp.hessian-projection.quadratic",
    sourceFunctionId: "kp.function.hessian.quadratic",
    secondDerivative: value.secondDerivative,
    domainBasis: value.domainBasis,
    codomainBasis: value.codomainBasis,
    symmetryEvidence: value.evidence
  });

  assert.equal(result.status, "projected");
  if (result.status !== "projected") return;
  assert.deepEqual(result.rows, [[2, 1], [1, 2]]);
  assert.equal(result.domainBasis.id, value.domainBasis.id);
  assert.equal(result.codomainBasis.id, value.codomainBasis.id);
  assert.deepEqual(result.symmetryEvidence, value.evidence);
  assert.equal(Object.isFrozen(result.rows[0]), true);
});

test("Hessian projection rejects symmetry evidence from another equality", () => {
  const value = fixture();
  assert.throws(
    () => projectKpSecondDerivativeToHessian({
      id: "kp.hessian-projection.invalid-evidence",
      sourceFunctionId: "kp.function.hessian.quadratic",
      secondDerivative: value.secondDerivative,
      domainBasis: value.domainBasis,
      codomainBasis: value.codomainBasis,
      symmetryEvidence: {
        kind: "tested",
        suiteId: "kp.test.hessian.invalid-symmetry",
        equalityId: "kp.equality.unrelated"
      }
    }),
    /symmetry must use equality/
  );
});

test("Hessian projection never invents domain or codomain bases", () => {
  const value = fixture();
  const result = projectKpSecondDerivativeToHessian({
    id: "kp.hessian-projection.missing-bases",
    sourceFunctionId: "kp.function.hessian.quadratic",
    secondDerivative: value.secondDerivative,
    symmetryEvidence: value.evidence
  });

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.code, "kp.calculus.basis-required");
  assert.deepEqual(result.missing, ["domain-basis", "codomain-basis"]);
  assert.equal(result.compact.operator, "D2");
  assert.equal(result.secondDerivative.apply([1, 0], [1, 0]), 2);
});

test("legacy Hessians project evidence to the compatible boolean shape", () => {
  const x = createKpScalarParameter({ id: "kp.hessian.compat.x", name: "x" });
  const y = createKpScalarParameter({ id: "kp.hessian.compat.y", name: "y" });
  const source = defineKpTypedFunction({
    id: "kp.hessian.compat.quadratic",
    name: "q",
    parameters: [x, y] as const,
    output: createKpScalarExpression({
      id: "kp.hessian.compat.quadratic.output",
      expression: add(
        power(x.expression, 2),
        multiply(x.expression, y.expression),
        power(y.expression, 2)
      )
    })
  });
  const hessian = deriveKpHessian({ id: "kp.hessian.compat", source });

  assert.equal(hessian.symmetric, true);
  assert.equal(hessian.symmetryEvidence?.kind, "assumed");
  assert.equal(Object.keys(hessian).includes("symmetryEvidence"), false);
  assert.deepEqual(evaluateKpTypedMatrix(hessian.matrix, {}), [[2, 1], [1, 2]]);
});
