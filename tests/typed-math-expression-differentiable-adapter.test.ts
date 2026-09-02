import assert from "node:assert/strict";
import test from "node:test";

import { createKpCartesianSpace } from "../src/math/algebra/standard-spaces.ts";
import {
  adaptKpTypedVectorFunctionToDifferentiableMap
} from "../src/math/algebra/expression-differentiable-map.ts";
import { add, constant, multiply } from "../src/math/expression.ts";
import {
  createKpScalarExpression,
  createKpScalarParameter,
  createKpTypedVector,
  defineKpTypedFunction,
  deriveKpJacobian,
  evaluateKpTypedMatrix
} from "../src/math/typed-semantic-math.ts";

const x = createKpScalarParameter({ id: "kp.adapter.parameter.x", name: "x" });
const y = createKpScalarParameter({ id: "kp.adapter.parameter.y", name: "y" });
const source = defineKpTypedFunction({
  id: "kp.adapter.function.affine",
  name: "f",
  parameters: [x, y] as const,
  output: createKpTypedVector({
    id: "kp.adapter.function.affine.output",
    entries: [
      createKpScalarExpression({
        id: "kp.adapter.function.affine.output.0",
        expression: add(multiply(constant(2), x.expression), y.expression)
      }),
      createKpScalarExpression({
        id: "kp.adapter.function.affine.output.1",
        expression: add(
          multiply(constant(4), x.expression),
          multiply(constant(-3), y.expression)
        )
      })
    ] as const
  })
});

test("expression functions use the existing Jacobian as derivative authority", () => {
  const domain = createKpCartesianSpace({
    id: "kp.space.expression-adapter.domain",
    dimension: 2
  });
  const codomain = createKpCartesianSpace({
    id: "kp.space.expression-adapter.codomain",
    dimension: 2
  });
  const adapted = adaptKpTypedVectorFunctionToDifferentiableMap({
    id: "kp.adapter.differentiable.affine",
    source,
    domain,
    codomain
  });
  const derivative = adapted.derivativeAt([3, 4]);
  const existingJacobian = deriveKpJacobian({
    id: "kp.adapter.existing-jacobian",
    source
  });

  assert.deepEqual(adapted.evaluate([3, 4]), [10, 0]);
  assert.deepEqual(derivative.apply([5, 2]), [12, 14]);
  assert.deepEqual([
    derivative.apply([1, 0]),
    derivative.apply([0, 1])
  ], [[2, 4], [1, -3]]);
  assert.deepEqual(evaluateKpTypedMatrix(existingJacobian.matrix, {}), [
    [2, 1],
    [4, -3]
  ]);
  assert.deepEqual(derivative.sourceMapIds, [
    source.id,
    "kp.adapter.differentiable.affine.jacobian"
  ]);
  assert.equal(
    derivative.linearity.kind === "proved" && derivative.linearity.authorityId,
    "kp.math.expression-jacobian-linear-map.v1"
  );
});

test("the expression adapter rejects undeclared coordinate shape", () => {
  const wrongDomain = createKpCartesianSpace({
    id: "kp.space.expression-adapter.wrong-domain",
    dimension: 3
  });
  const codomain = createKpCartesianSpace({
    id: "kp.space.expression-adapter.expected-codomain",
    dimension: 2
  });

  assert.throws(
    () => adaptKpTypedVectorFunctionToDifferentiableMap({
      id: "kp.adapter.differentiable.invalid",
      source,
      domain: wrongDomain as unknown as ReturnType<
        typeof createKpCartesianSpace<"kp.space.expression-adapter.wrong-domain", 2>
      >,
      codomain
    }),
    /domain requires 2 dimensions; received 3/
  );
});
