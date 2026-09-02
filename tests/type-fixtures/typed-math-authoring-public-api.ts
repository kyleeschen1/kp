import * as math from "../../src/math/authoring/public-api.ts";
import {
  add,
  composeKpFunctionSignatures,
  constant,
  createKpScalarExpression,
  createKpScalarParameter,
  createKpTypedMatrix,
  createKpTypedVector,
  defineKpTypedFunction,
  isKpTypedVectorFunction,
  multiply,
  multiplyKpTypedMatrices,
  power,
  type KpFunctionType,
  type KpScalarType,
  type KpVectorType
} from "../../src/math/authoring/public-api.ts";
import {
  deriveKpHessian,
  deriveKpJacobian
} from "../../src/math/authoring/calculus.ts";
import {
  elaborateKpTypedLatexFunction
} from "../../src/math/authoring/latex.ts";
import {
  createKpMatrixOptics,
  transformKpSemanticSelection
} from "../../src/math/authoring/optics.ts";
import {
  createKpTypedMathSceneHandle,
  createKpTypedMathSceneTimeline,
  recoverKpTypedMathObjectAtStep,
  resolveKpSemanticSelectionAtStep
} from "../../src/math/authoring/scene.ts";

// KP_AUTHORING_ERGONOMICS_START: affine-jacobian-and-quadratic-hessian
const x = createKpScalarParameter({ id: "public.parameter.x", name: "x" });
const y = createKpScalarParameter({ id: "public.parameter.y", name: "y" });
const scalar = (id: string, value: number) => createKpScalarExpression({
  id,
  expression: constant(value)
});

const affine = defineKpTypedFunction({
  id: "public.function.affine",
  name: "f",
  parameters: [x, y] as const,
  output: createKpTypedVector({
    id: "public.function.affine.output",
    entries: [
      createKpScalarExpression({
        id: "public.function.affine.output.0",
        expression: add(multiply(constant(2), x.expression), y.expression)
      }),
      createKpScalarExpression({
        id: "public.function.affine.output.1",
        expression: add(x.expression, multiply(constant(-3), y.expression))
      })
    ] as const
  })
});

const inferredSignature: KpFunctionType<
  readonly [KpScalarType, KpScalarType],
  KpVectorType<2>
> = affine.type;
const jacobian = deriveKpJacobian({
  id: "public.jacobian.affine",
  source: affine
});

const quadratic = defineKpTypedFunction({
  id: "public.function.quadratic",
  name: "q",
  parameters: [x, y] as const,
  output: createKpScalarExpression({
    id: "public.function.quadratic.output",
    expression: add(
      power(x.expression, 2),
      multiply(x.expression, y.expression),
      power(y.expression, 2)
    )
  })
});
const hessian = deriveKpHessian({
  id: "public.hessian.quadratic",
  source: quadratic
});
// KP_AUTHORING_ERGONOMICS_END: affine-jacobian-and-quadratic-hessian

const firstColumn = createKpMatrixOptics(jacobian.matrix).cols.slice(0, 1);
const rewrite = transformKpSemanticSelection({
  root: jacobian.matrix,
  optic: firstColumn,
  operation: {
    id: "public.rewrite.first-column",
    relation: "identity",
    authorityIds: ["kp.math.canonical-form.v1"],
    summary: "Retain the selected derivatives in canonical form."
  },
  transform: (entry) => createKpScalarExpression({
    id: `${entry.id}.canonical`,
    expression: entry.expression
  })
});

const timeline = createKpTypedMathSceneTimeline({
  id: "public.timeline.affine",
  steps: [
    { id: "expanded", objects: [jacobian.matrix] },
    { id: "canonical", objects: [rewrite.value] }
  ]
});
const matrixHandle = createKpTypedMathSceneHandle(jacobian.matrix);
const recovered = recoverKpTypedMathObjectAtStep(
  timeline,
  "canonical",
  matrixHandle
);
const recoveredSelection = resolveKpSemanticSelectionAtStep({
  timeline,
  stepId: "canonical",
  handle: matrixHandle,
  optic: firstColumn
});

const parsed = elaborateKpTypedLatexFunction({
  id: "public.function.parsed-affine",
  sourceId: "public.source.parsed-affine",
  latex: String.raw`f(x,y)=\begin{bmatrix}2*x+y\\x-3*y\end{bmatrix}`,
  parameters: [x, y] as const
});
if (parsed.status === "elaborated") {
  const dynamicFunction = parsed.value;
  const rejectUncheckedDynamicShape = () => deriveKpJacobian({
    id: "public.jacobian.unchecked",
    // @ts-expect-error Runtime-elaborated output needs the vector type guard.
    source: dynamicFunction
  });
  void rejectUncheckedDynamicShape;
  if (isKpTypedVectorFunction(dynamicFunction)) {
    deriveKpJacobian({
      id: "public.jacobian.parsed-affine",
      source: dynamicFunction
    });
  }
}

const matrix2x3 = createKpTypedMatrix({
  id: "public.matrix.2x3",
  rows: [
    [scalar("public.a.0.0", 1), scalar("public.a.0.1", 2), scalar("public.a.0.2", 3)],
    [scalar("public.a.1.0", 4), scalar("public.a.1.1", 5), scalar("public.a.1.2", 6)]
  ] as const
});
const matrix4x2 = createKpTypedMatrix({
  id: "public.matrix.4x2",
  rows: [
    [scalar("public.b.0.0", 1), scalar("public.b.0.1", 2)],
    [scalar("public.b.1.0", 3), scalar("public.b.1.1", 4)],
    [scalar("public.b.2.0", 5), scalar("public.b.2.1", 6)],
    [scalar("public.b.3.0", 7), scalar("public.b.3.1", 8)]
  ] as const
});
const rejectIncompatibleMatrices = () => multiplyKpTypedMatrices({
  id: "public.matrix.invalid-product",
  left: matrix2x3,
  // @ts-expect-error Matrix<2, 3> cannot multiply Matrix<4, 2>.
  right: matrix4x2
});

const vector3ToScalar: KpFunctionType<
  readonly [KpVectorType<3>],
  KpScalarType
> = {
  kind: "function",
  inputs: [{ kind: "vector", size: 3 }],
  output: { kind: "scalar" }
};
const rejectIncompatibleFunctions = () => composeKpFunctionSignatures(
  affine.type,
  // @ts-expect-error The outer function requires Vector<3>, not Vector<2>.
  vector3ToScalar
);

// @ts-expect-error Calculus remains an optional capability entrypoint.
void math.deriveKpJacobian;
// @ts-expect-error Runtime parser construction helpers are not public authoring API.
void math.createKpTypedMatrixFromRows;

void inferredSignature;
void hessian;
void recovered;
void recoveredSelection;
void rejectIncompatibleMatrices;
void rejectIncompatibleFunctions;
