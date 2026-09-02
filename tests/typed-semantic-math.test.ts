import { strict as assert } from "node:assert";
import test from "node:test";

import {
  add,
  constant,
  multiply,
  power
} from "../src/math/expression.ts";
import {
  composeKpFunctionSignatures,
  createKpScalarExpression,
  createKpScalarParameter,
  createKpTypedMatrix,
  createKpTypedVector,
  defineKpTypedFunction,
  deriveKpHessian,
  deriveKpJacobian,
  evaluateKpTypedMatrix,
  multiplyKpTypedMatrices,
  projectKpDerivativeMatrixToLatex,
  projectKpTypedMathToLatex,
  type KpFunctionType,
  type KpScalarType,
  type KpVectorType
} from "../src/math/typed-semantic-math.ts";

const x = createKpScalarParameter({ id: "parameter.x", name: "x" });
const y = createKpScalarParameter({ id: "parameter.y", name: "y" });

const affineFunction = defineKpTypedFunction({
  id: "function.affine",
  name: "f",
  parameters: [x, y] as const,
  output: createKpTypedVector({
    id: "function.affine.output",
    entries: [
      createKpScalarExpression({
        id: "function.affine.output.0",
        expression: add(multiply(constant(2), x.expression), y.expression)
      }),
      createKpScalarExpression({
        id: "function.affine.output.1",
        expression: add(x.expression, multiply(constant(-3), y.expression))
      })
    ] as const
  })
});

test("typed functions infer signatures and Jacobian dimensions", () => {
  const expectedSignature: KpFunctionType<
    readonly [KpScalarType, KpScalarType],
    KpVectorType<2>
  > = affineFunction.type;
  const jacobian = deriveKpJacobian({
    id: "jacobian.affine",
    source: affineFunction
  });

  assert.equal(expectedSignature.kind, "function");
  assert.deepEqual(affineFunction.type, {
    kind: "function",
    inputs: [{ kind: "scalar" }, { kind: "scalar" }],
    output: { kind: "vector", size: 2 }
  });
  assert.equal(jacobian.matrix.rowCount, 2);
  assert.equal(jacobian.matrix.columnCount, 2);
  assert.deepEqual(evaluateKpTypedMatrix(jacobian.matrix, {}), [
    [2, 1],
    [1, -3]
  ]);
  assert.deepEqual(jacobian.rowLabels, ["f_{1}", "f_{2}"]);
  assert.deepEqual(jacobian.columnLabels, ["x", "y"]);
  assert.equal(
    projectKpDerivativeMatrixToLatex(jacobian, "compact"),
    "J_{f}(x, y)"
  );
  assert.equal(
    projectKpDerivativeMatrixToLatex(jacobian, "expanded"),
    "J_{f}(x, y) = \\begin{bmatrix}2 & 1 \\\\ 1 & -3\\end{bmatrix}"
  );
  assert.deepEqual(jacobian.correspondenceMap.records, [{
    id: "jacobian.affine.expansion",
    relation: "fan-out",
    sourceSelectorIds: ["jacobian.affine.compact"],
    targetSelectorIds: [
      "jacobian.affine.entry.0.0",
      "jacobian.affine.entry.0.1",
      "jacobian.affine.entry.1.0",
      "jacobian.affine.entry.1.1"
    ],
    summary: "Expanding the Jacobian derives one partial derivative per matrix entry."
  }]);
});

test("a quadratic scalar function produces a symmetric typed Hessian", () => {
  const quadratic = defineKpTypedFunction({
    id: "function.quadratic",
    name: "q",
    parameters: [x, y] as const,
    output: createKpScalarExpression({
      id: "function.quadratic.output",
      expression: add(
        power(x.expression, 2),
        multiply(x.expression, y.expression),
        power(y.expression, 2)
      )
    })
  });
  const hessian = deriveKpHessian({
    id: "hessian.quadratic",
    source: quadratic
  });

  assert.equal(hessian.derivativeKind, "hessian");
  assert.equal(hessian.matrix.rowCount, 2);
  assert.equal(hessian.matrix.columnCount, 2);
  assert.deepEqual(evaluateKpTypedMatrix(hessian.matrix, {}), [
    [2, 1],
    [1, 2]
  ]);
  assert.deepEqual(hessian.rowLabels, ["x", "y"]);
  assert.deepEqual(hessian.columnLabels, ["x", "y"]);
  assert.equal(
    projectKpTypedMathToLatex(hessian),
    "H_{q}(x, y) = \\begin{bmatrix}2 & 1 \\\\ 1 & 2\\end{bmatrix}"
  );
});

test("matrix multiplication preserves literal dimensions and rejects mismatches", () => {
  const entry = (id: string, value: number) => createKpScalarExpression({
    id,
    expression: constant(value)
  });
  const left = createKpTypedMatrix({
    id: "matrix.left",
    rows: [
      [entry("a.0.0", 1), entry("a.0.1", 2), entry("a.0.2", 3)],
      [entry("a.1.0", 4), entry("a.1.1", 5), entry("a.1.2", 6)]
    ] as const
  });
  const right = createKpTypedMatrix({
    id: "matrix.right",
    rows: [
      [entry("b.0.0", 7), entry("b.0.1", 8)],
      [entry("b.1.0", 9), entry("b.1.1", 10)],
      [entry("b.2.0", 11), entry("b.2.1", 12)]
    ] as const
  });
  const product = multiplyKpTypedMatrices({
    id: "matrix.product",
    left,
    right
  });

  assert.deepEqual(product.type, { kind: "matrix", rows: 2, columns: 2 });
  assert.deepEqual(evaluateKpTypedMatrix(product, {}), [
    [58, 64],
    [139, 154]
  ]);

  const incompatible = createKpTypedMatrix({
    id: "matrix.incompatible",
    rows: [
      [entry("c.0.0", 1), entry("c.0.1", 2)],
      [entry("c.1.0", 3), entry("c.1.1", 4)],
      [entry("c.2.0", 5), entry("c.2.1", 6)],
      [entry("c.3.0", 7), entry("c.3.1", 8)]
    ] as const
  });

  const rejectIncompatibleProduct = () => {
    multiplyKpTypedMatrices({
      id: "matrix.invalid-product",
      left,
      // @ts-expect-error Matrix<2, 3> cannot multiply Matrix<4, 2>.
      right: incompatible
    });
  };
  void rejectIncompatibleProduct;
});

test("function signature composition accepts only matching intermediate types", () => {
  const scalarFromVector: KpFunctionType<
    readonly [KpVectorType<2>],
    KpScalarType
  > = {
    kind: "function",
    inputs: [{ kind: "vector", size: 2 }],
    output: { kind: "scalar" }
  };
  const composed = composeKpFunctionSignatures(
    affineFunction.type,
    scalarFromVector
  );

  assert.deepEqual(composed, {
    kind: "function",
    inputs: [{ kind: "scalar" }, { kind: "scalar" }],
    output: { kind: "scalar" }
  });

  const wrongOuter: KpFunctionType<
    readonly [KpVectorType<3>],
    KpScalarType
  > = {
    kind: "function",
    inputs: [{ kind: "vector", size: 3 }],
    output: { kind: "scalar" }
  };

  const rejectIncompatibleComposition = () => {
    composeKpFunctionSignatures(
      affineFunction.type,
      // @ts-expect-error The outer function requires Vector<3>, not Vector<2>.
      wrongOuter
    );
  };
  void rejectIncompatibleComposition;
});

test("typed functions reject free variables outside their parameter tuple", () => {
  const z = createKpScalarParameter({ id: "parameter.z", name: "z" });

  assert.throws(
    () => defineKpTypedFunction({
      id: "function.invalid-free-variable",
      name: "bad",
      parameters: [x, y] as const,
      output: createKpScalarExpression({
        id: "function.invalid-free-variable.output",
        expression: add(x.expression, z.expression)
      })
    }),
    /free variable z/
  );
});
