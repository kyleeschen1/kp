import { strict as assert } from "node:assert";
import test from "node:test";

import {
  add,
  constant,
  multiply
} from "../src/math/expression.ts";
import {
  createKpScalarExpression,
  createKpScalarParameter,
  createKpTypedEquation,
  createKpTypedVector,
  defineKpTypedFunction,
  deriveKpJacobian,
  evaluateKpTypedMatrix,
  projectKpTypedMathToLatex
} from "../src/math/typed-semantic-math.ts";
import {
  createKpEquationOptics,
  createKpMatrixOptics,
  resolveKpSemanticSelection,
  transformKpSemanticSelection
} from "../src/math/typed-semantic-optics.ts";

const x = createKpScalarParameter({ id: "optic.parameter.x", name: "x" });
const y = createKpScalarParameter({ id: "optic.parameter.y", name: "y" });

const affine = defineKpTypedFunction({
  id: "optic.function.affine",
  name: "f",
  parameters: [x, y] as const,
  output: createKpTypedVector({
    id: "optic.function.affine.output",
    entries: [
      createKpScalarExpression({
        id: "optic.function.affine.output.0",
        expression: add(multiply(constant(2), x.expression), y.expression)
      }),
      createKpScalarExpression({
        id: "optic.function.affine.output.1",
        expression: add(x.expression, multiply(constant(-3), y.expression))
      })
    ] as const
  })
});

test("equation lhs and rhs are exact semantic lenses", () => {
  const equation = createKpTypedEquation({
    id: "equation.price",
    left: createKpScalarExpression({
      id: "equation.price.left",
      expression: x.expression
    }),
    right: createKpScalarExpression({
      id: "equation.price.right",
      expression: add(y.expression, constant(12))
    })
  });
  const optics = createKpEquationOptics(equation);
  const selection = resolveKpSemanticSelection(equation, optics.rhs);

  assert.equal(selection.cardinality, "one");
  assert.deepEqual(selection.refs.map(({ entityId, path }) => ({
    entityId,
    path
  })), [{
    entityId: "equation.price.right",
    path: "right"
  }]);
  assert.deepEqual(optics.rhs.descriptor, {
    schemaVersion: "kp.semantic-optic-path.v1",
    segments: [{ kind: "field", name: "right" }]
  });

  const rewrite = transformKpSemanticSelection({
    root: equation,
    optic: optics.rhs,
    operation: {
      id: "rewrite.equation.price.rhs.normalize",
      relation: "identity",
      authorityIds: ["kp.math.normalization.identity.v1"],
      summary: "Normalize the right side without changing its semantic value."
    },
    transform: (right) => createKpScalarExpression({
      id: `${right.id}.normalized`,
      expression: right.expression,
      provenance: {
        kind: "derived",
        sourceIds: [right.id],
        methodId: "kp.math.normalization.identity.v1"
      }
    })
  });

  assert.notEqual(rewrite.value, equation);
  assert.equal(rewrite.value.left, equation.left);
  assert.equal(rewrite.value.right.id, "equation.price.right.normalized");
  assert.equal(
    projectKpTypedMathToLatex(rewrite.value),
    "x = y + 12"
  );
  assert.deepEqual(rewrite.correspondenceMap.records, [{
    id: "rewrite.equation.price.rhs.normalize.correspondence.0",
    relation: "identity",
    sourceSelectorIds: ["equation.price.right"],
    targetSelectorIds: ["equation.price.right.normalized"],
    summary: "Normalize the right side without changing its semantic value."
  }]);
});

test("matrix column slices select semantic entries and rewrite immutably", () => {
  const jacobian = deriveKpJacobian({
    id: "optic.jacobian.affine",
    source: affine
  });
  const optics = createKpMatrixOptics(jacobian.matrix);
  const firstColumn = optics.cols.slice(0, 1);
  const selection = resolveKpSemanticSelection(jacobian.matrix, firstColumn);

  assert.equal(selection.cardinality, "many");
  assert.deepEqual(selection.refs.map(({ entityId, path }) => ({
    entityId,
    path
  })), [
    { entityId: "optic.jacobian.affine.entry.0.0", path: "rows[0][0]" },
    { entityId: "optic.jacobian.affine.entry.1.0", path: "rows[1][0]" }
  ]);
  assert.deepEqual(firstColumn.descriptor, {
    schemaVersion: "kp.semantic-optic-path.v1",
    segments: [
      { kind: "field", name: "columns" },
      { kind: "slice", start: 0, end: 1 }
    ]
  });

  const rewrite = transformKpSemanticSelection({
    root: jacobian.matrix,
    optic: firstColumn,
    operation: {
      id: "rewrite.jacobian.first-column.canonicalize",
      relation: "identity",
      authorityIds: ["kp.math.canonical-form.v1"],
      summary: "Canonicalize the selected derivative entry."
    },
    transform: (entry, context) => createKpScalarExpression({
      id: `${entry.id}.canonical`,
      expression: entry.expression,
      provenance: {
        kind: "derived",
        sourceIds: [entry.id],
        methodId: `kp.math.canonical-form.v1:${context.ordinal}`
      }
    })
  });

  assert.equal(rewrite.value.rowCount, 2);
  assert.equal(rewrite.value.columnCount, 2);
  assert.deepEqual(evaluateKpTypedMatrix(rewrite.value, {}), [
    [2, 1],
    [1, -3]
  ]);
  assert.equal(rewrite.value.rows[0]?.[1], jacobian.matrix.rows[0]?.[1]);
  assert.equal(rewrite.value.rows[1]?.[1], jacobian.matrix.rows[1]?.[1]);
  assert.deepEqual(
    rewrite.correspondenceMap.records.map((record) => ({
      source: record.sourceSelectorIds[0],
      target: record.targetSelectorIds[0]
    })),
    [
      {
        source: "optic.jacobian.affine.entry.0.0",
        target: "optic.jacobian.affine.entry.0.0.canonical"
      },
      {
        source: "optic.jacobian.affine.entry.1.0",
        target: "optic.jacobian.affine.entry.1.0.canonical"
      }
    ]
  );
});

test("matrix entry lenses and row traversals have checked cardinality", () => {
  const matrix = deriveKpJacobian({
    id: "optic.jacobian.cardinality",
    source: affine
  }).matrix;
  const optics = createKpMatrixOptics(matrix);

  assert.equal(
    resolveKpSemanticSelection(matrix, optics.entry(1, 1)).refs[0]?.entityId,
    "optic.jacobian.cardinality.entry.1.1"
  );
  assert.deepEqual(
    resolveKpSemanticSelection(matrix, optics.rows.slice(1, 2)).refs.map(
      ({ path }) => path
    ),
    ["rows[1][0]", "rows[1][1]"]
  );
  assert.throws(() => optics.entry(2, 0), /row 2 is outside/);
  assert.throws(() => optics.cols.slice(1, 1), /non-empty slice/);
});
