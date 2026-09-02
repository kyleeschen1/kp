import { strict as assert } from "node:assert";
import test from "node:test";

import { add, constant, multiply } from "../src/math/expression.ts";
import {
  createKpTypedMathSceneHandle,
  createKpTypedMathSceneTimeline,
  KpTypedMathSceneRecoveryError,
  recoverKpTypedMathObjectAtStep,
  resolveKpSemanticSelectionAtStep
} from "../src/math/typed-math-scene.ts";
import {
  createKpScalarExpression,
  createKpScalarParameter,
  createKpTypedVector,
  defineKpTypedFunction,
  deriveKpJacobian
} from "../src/math/typed-semantic-math.ts";
import {
  createKpMatrixOptics,
  transformKpSemanticSelection
} from "../src/math/typed-semantic-optics.ts";

const x = createKpScalarParameter({ id: "scene.parameter.x", name: "x" });
const y = createKpScalarParameter({ id: "scene.parameter.y", name: "y" });
const source = defineKpTypedFunction({
  id: "scene.function.affine",
  name: "f",
  parameters: [x, y] as const,
  output: createKpTypedVector({
    id: "scene.function.affine.output",
    entries: [
      createKpScalarExpression({
        id: "scene.function.affine.output.0",
        expression: add(multiply(constant(2), x.expression), y.expression)
      }),
      createKpScalarExpression({
        id: "scene.function.affine.output.1",
        expression: add(x.expression, multiply(constant(-3), y.expression))
      })
    ] as const
  })
});

test("stable handles recover immutable semantic objects directly at any step", () => {
  const matrix = deriveKpJacobian({ id: "scene.jacobian.affine", source }).matrix;
  const firstColumn = createKpMatrixOptics(matrix).cols.slice(0, 1);
  const rewrite = transformKpSemanticSelection({
    root: matrix,
    optic: firstColumn,
    operation: {
      id: "scene.rewrite.canonical-column",
      relation: "identity",
      authorityIds: ["kp.math.canonical-form.v1"],
      summary: "Canonicalize the first derivative column."
    },
    transform: (entry) => createKpScalarExpression({
      id: `${entry.id}.canonical`,
      expression: entry.expression,
      provenance: {
        kind: "derived",
        sourceIds: [entry.id],
        methodId: "kp.math.canonical-form.v1"
      }
    })
  });
  const timeline = createKpTypedMathSceneTimeline({
    id: "scene.timeline.affine",
    steps: [
      { id: "expanded", objects: [matrix] },
      { id: "canonicalized", objects: [rewrite.value] }
    ]
  });
  const handle = createKpTypedMathSceneHandle(matrix);

  assert.equal(
    recoverKpTypedMathObjectAtStep(timeline, "expanded", handle),
    matrix
  );
  assert.equal(
    recoverKpTypedMathObjectAtStep(timeline, "canonicalized", handle),
    rewrite.value
  );
  assert.deepEqual(resolveKpSemanticSelectionAtStep({
    timeline,
    stepId: "canonicalized",
    handle,
    optic: firstColumn
  }).refs.map(({ entityId }) => entityId), [
    "scene.jacobian.affine.entry.0.0.canonical",
    "scene.jacobian.affine.entry.1.0.canonical"
  ]);
});

test("scene recovery rejects missing and shape-incompatible snapshots explicitly", () => {
  const matrix = deriveKpJacobian({ id: "scene.jacobian.errors", source }).matrix;
  const handle = createKpTypedMathSceneHandle(matrix);
  const missing = createKpTypedMathSceneTimeline({
    id: "scene.timeline.missing",
    steps: [{ id: "only", objects: [] }]
  });

  assert.throws(
    () => recoverKpTypedMathObjectAtStep(missing, "unknown", handle),
    (error) => error instanceof KpTypedMathSceneRecoveryError &&
      error.code === "step-not-found"
  );
  assert.throws(
    () => recoverKpTypedMathObjectAtStep(missing, "only", handle),
    (error) => error instanceof KpTypedMathSceneRecoveryError &&
      error.code === "object-not-found"
  );
  assert.throws(
    () => createKpTypedMathSceneTimeline({
      id: "scene.timeline.duplicates",
      steps: [{ id: "duplicate", objects: [matrix, matrix] }]
    }),
    /repeat scene.jacobian.errors.matrix/
  );

  const incompatible = createKpTypedVector({
    id: matrix.id,
    entries: [createKpScalarExpression({
      id: "scene.incompatible.0",
      expression: constant(1)
    })] as const
  });
  const changed = createKpTypedMathSceneTimeline({
    id: "scene.timeline.changed",
    steps: [{ id: "changed", objects: [incompatible] }]
  });
  assert.throws(
    () => recoverKpTypedMathObjectAtStep(changed, "changed", handle),
    (error) => error instanceof KpTypedMathSceneRecoveryError &&
      error.code === "shape-mismatch"
  );
});
