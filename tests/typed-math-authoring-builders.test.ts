import assert from "node:assert/strict";
import test from "node:test";

import { defineKpAuthoredFunction } from "../src/math/authoring/builders.ts";
import { createKpMathAuthoringContext } from "../src/math/authoring/context.ts";
import { add, constant, multiply, variable } from "../src/math/expression.ts";
import { deriveKpJacobian, evaluateKpTypedMatrix } from "../src/math/typed-semantic-math.ts";

test("function builders infer parameters, wrappers, IDs, and provenance", () => {
  const context = createKpMathAuthoringContext({ namespace: "lesson.builders" });
  const affine = defineKpAuthoredFunction(context, {
    path: ["functions", "affine"],
    name: "f",
    parameters: ["x", "y"] as const,
    output: ({ x, y }, { vector }) => vector([
      add(multiply(constant(2), x.expression), y.expression),
      add(x.expression, multiply(constant(-3), y.expression))
    ])
  });
  const jacobian = deriveKpJacobian({
    id: context.id("derivatives", "affine", "jacobian"),
    source: affine
  });

  assert.equal(affine.id, "lesson.builders.functions.affine");
  assert.deepEqual(affine.parameters.map(({ id }) => id), [
    "lesson.builders.functions.affine.parameters.x",
    "lesson.builders.functions.affine.parameters.y"
  ]);
  assert.deepEqual(affine.output.entries.map(({ id }) => id), [
    "lesson.builders.functions.affine.output.entries.0",
    "lesson.builders.functions.affine.output.entries.1"
  ]);
  assert.deepEqual(affine.provenance, {
    kind: "authored",
    sourceId: affine.id
  });
  assert.deepEqual(evaluateKpTypedMatrix(jacobian.matrix, {}), [
    [2, 1],
    [1, -3]
  ]);
});

test("function builders preserve free-variable diagnostics", () => {
  const context = createKpMathAuthoringContext({ namespace: "lesson.diagnostics" });
  assert.throws(
    () => defineKpAuthoredFunction(context, {
      path: ["functions", "invalid"],
      name: "f",
      parameters: ["x"] as const,
      output: (_parameters, { scalar }) => scalar(
        add(variable("x"), variable("undeclared"))
      )
    }),
    /has free variable undeclared/
  );
});
