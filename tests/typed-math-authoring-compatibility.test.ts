import assert from "node:assert/strict";
import test from "node:test";

import {
  add,
  constant,
  createKpScalarExpression,
  createKpScalarParameter,
  createKpTypedVector,
  defineKpTypedFunction,
  evaluateKpTypedMatrix,
  multiply,
  power
} from "../src/math/authoring/public-api.ts";
import {
  deriveKpHessian,
  deriveKpJacobian,
  projectKpDerivativeMatrixToLatex
} from "../src/math/authoring/calculus.ts";
import {
  createKpMatrixOptics,
  transformKpSemanticSelection
} from "../src/math/authoring/optics.ts";
import {
  createKpTypedMathSceneHandle,
  createKpTypedMathSceneTimeline,
  recoverKpTypedMathObjectAtStep,
  resolveKpSemanticSelectionAtStep
} from "../src/math/authoring/scene.ts";

const x = createKpScalarParameter({ id: "compat.parameter.x", name: "x" });
const y = createKpScalarParameter({ id: "compat.parameter.y", name: "y" });
const affine = defineKpTypedFunction({
  id: "compat.function.affine",
  name: "f",
  parameters: [x, y] as const,
  output: createKpTypedVector({
    id: "compat.function.affine.output",
    entries: [
      createKpScalarExpression({
        id: "compat.function.affine.output.0",
        expression: add(multiply(constant(2), x.expression), y.expression)
      }),
      createKpScalarExpression({
        id: "compat.function.affine.output.1",
        expression: add(x.expression, multiply(constant(-3), y.expression))
      })
    ] as const
  })
});

test("promoted Jacobian and Hessian values retain their narrow public shape", () => {
  const jacobian = deriveKpJacobian({
    id: "compat.jacobian.affine",
    source: affine
  });
  const quadratic = defineKpTypedFunction({
    id: "compat.function.quadratic",
    name: "q",
    parameters: [x, y] as const,
    output: createKpScalarExpression({
      id: "compat.function.quadratic.output",
      expression: add(
        power(x.expression, 2),
        multiply(x.expression, y.expression),
        power(y.expression, 2)
      )
    })
  });
  const hessian = deriveKpHessian({
    id: "compat.hessian.quadratic",
    source: quadratic
  });

  assert.deepEqual(evaluateKpTypedMatrix(jacobian.matrix, {}), [
    [2, 1],
    [1, -3]
  ]);
  assert.equal(jacobian.matrix.id, "compat.jacobian.affine.matrix");
  assert.equal(jacobian.compactEntityId, "compat.jacobian.affine.compact");
  assert.deepEqual(jacobian.rowLabels, ["f_{1}", "f_{2}"]);
  assert.deepEqual(jacobian.columnLabels, ["x", "y"]);
  assert.equal(
    projectKpDerivativeMatrixToLatex(jacobian, "expanded"),
    "J_{f}(x, y) = \\begin{bmatrix}2 & 1 \\\\ 1 & -3\\end{bmatrix}"
  );
  assert.deepEqual(
    jacobian.correspondenceMap.records[0]?.targetSelectorIds,
    [
      "compat.jacobian.affine.entry.0.0",
      "compat.jacobian.affine.entry.0.1",
      "compat.jacobian.affine.entry.1.0",
      "compat.jacobian.affine.entry.1.1"
    ]
  );
  assert.equal(hessian.symmetric, true);
  assert.deepEqual(evaluateKpTypedMatrix(hessian.matrix, {}), [
    [2, 1],
    [1, 2]
  ]);
});

test("promoted optics and scene handles retain semantic identity across steps", () => {
  const matrix = deriveKpJacobian({
    id: "compat.jacobian.scene",
    source: affine
  }).matrix;
  const firstColumn = createKpMatrixOptics(matrix).cols.slice(0, 1);
  const rewrite = transformKpSemanticSelection({
    root: matrix,
    optic: firstColumn,
    operation: {
      id: "compat.rewrite.first-column",
      relation: "identity",
      authorityIds: ["kp.math.canonical-form.v1"],
      summary: "Retain the selected derivative entries."
    },
    transform: (entry) => createKpScalarExpression({
      id: `${entry.id}.canonical`,
      expression: entry.expression
    })
  });
  const timeline = createKpTypedMathSceneTimeline({
    id: "compat.timeline.affine",
    steps: [
      { id: "expanded", objects: [matrix] },
      { id: "canonical", objects: [rewrite.value] }
    ]
  });
  const handle = createKpTypedMathSceneHandle(matrix);

  assert.equal(
    recoverKpTypedMathObjectAtStep(timeline, "expanded", handle),
    matrix
  );
  assert.equal(
    recoverKpTypedMathObjectAtStep(timeline, "canonical", handle),
    rewrite.value
  );
  assert.deepEqual(resolveKpSemanticSelectionAtStep({
    timeline,
    stepId: "canonical",
    handle,
    optic: firstColumn
  }).refs.map(({ entityId }) => entityId), [
    "compat.jacobian.scene.entry.0.0.canonical",
    "compat.jacobian.scene.entry.1.0.canonical"
  ]);
  assert.deepEqual(
    rewrite.correspondenceMap.records.map((record) => record.relation),
    ["identity", "identity"]
  );
});
