import assert from "node:assert/strict";
import test from "node:test";

import {
  kpHessianConstructDescriptor,
  kpJacobianConstructDescriptor
} from "../src/math/authoring/construct-descriptor.ts";
import { projectKpConstructToLatex } from "../src/math/authoring/construct-latex.ts";
import { createKpMathAuthoringContext } from "../src/math/authoring/context.ts";
import { add, constant, multiply } from "../src/math/expression.ts";
import {
  createKpScalarExpression,
  createKpScalarParameter,
  createKpTypedVector,
  defineKpTypedFunction,
  deriveKpJacobian
} from "../src/math/typed-semantic-math.ts";

function affineJacobian() {
  const x = createKpScalarParameter({ id: "kp.latex.x", name: "x" });
  const y = createKpScalarParameter({ id: "kp.latex.y", name: "y" });
  const source = defineKpTypedFunction({
    id: "kp.latex.affine",
    name: "f",
    parameters: [x, y] as const,
    output: createKpTypedVector({
      id: "kp.latex.affine.output",
      entries: [
        createKpScalarExpression({
          id: "kp.latex.affine.output.0",
          expression: add(multiply(constant(2), x.expression), y.expression)
        }),
        createKpScalarExpression({
          id: "kp.latex.affine.output.1",
          expression: add(x.expression, multiply(constant(-3), y.expression))
        })
      ] as const
    })
  });
  return {
    source,
    jacobian: deriveKpJacobian({ id: "kp.latex.jacobian", source })
  };
}

test("construct templates project compact, operator, and expanded Jacobians", () => {
  const { source, jacobian } = affineJacobian();
  const context = createKpMathAuthoringContext({ namespace: "lesson.latex" });
  const common = {
    descriptor: kpJacobianConstructDescriptor,
    source: {
      id: source.id,
      name: source.name,
      parameterNames: source.parameters.map(({ name }) => name)
    },
    authority: {
      derivativeMapId: "kp.derivative.latex.affine",
      domainBasis: { id: "kp.basis.latex.domain", label: "B" },
      codomainBasis: { id: "kp.basis.latex.codomain", label: "C" }
    },
    notation: context.defaults.notation,
    matrix: jacobian.matrix
  } as const;
  const compact = projectKpConstructToLatex({
    ...common,
    id: "kp.latex.projection.compact",
    form: "compact"
  });
  const operator = projectKpConstructToLatex({
    ...common,
    id: "kp.latex.projection.operator",
    form: "operator"
  });
  const expanded = projectKpConstructToLatex({
    ...common,
    id: "kp.latex.projection.expanded",
    form: "expanded"
  });

  assert.equal(compact.status === "projected" && compact.latex, "J_{f}(x, y)");
  assert.equal(operator.status === "projected" && operator.latex, "D\\,f(x, y)");
  assert.equal(
    expanded.status === "projected" && expanded.latex,
    "J_{f}(x, y)^{\\mathrm{C}\\leftarrow\\mathrm{B}} = " +
      "\\begin{bmatrix}2 & 1 \\\\ 1 & -3\\end{bmatrix}"
  );
});

test("templates escape semantic labels and honor custom notation", () => {
  const { jacobian } = affineJacobian();
  const result = projectKpConstructToLatex({
    id: "kp.latex.projection.custom",
    descriptor: kpJacobianConstructDescriptor,
    form: "expanded",
    source: {
      id: "kp.function.profit-net",
      name: "profit_net",
      parameterNames: ["price_raw"]
    },
    authority: {
      derivativeMapId: "kp.derivative.profit-net",
      domainBasis: { id: "kp.basis.input", label: "Input_{raw}" },
      codomainBasis: { id: "kp.basis.output", label: "Output%" }
    },
    notation: { derivative: "\\mathrm{d}", jacobian: "\\mathcal{J}", hessian: "H" },
    matrix: jacobian.matrix
  });

  assert.equal(result.status, "projected");
  if (result.status !== "projected") return;
  assert.match(result.latex, /^\\mathcal\{J\}_\{\\mathrm\{profit\\_net\}\}/);
  assert.match(result.latex, /\\mathrm\{Output\\%\}/);
  assert.match(result.latex, /\\mathrm\{Input\\_\\\{raw\\\}\}/);
});

test("expanded Hessian templates return typed gaps for absent authority", () => {
  const context = createKpMathAuthoringContext({ namespace: "lesson.gap" });
  const result = projectKpConstructToLatex({
    id: "kp.latex.projection.hessian-gap",
    descriptor: kpHessianConstructDescriptor,
    form: "expanded",
    source: { id: "kp.function.q", name: "q", parameterNames: ["x", "y"] },
    authority: { secondDerivativeMapId: "kp.second-derivative.q" },
    notation: context.defaults.notation
  });

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.code, "kp.latex.construct-capability-required");
  assert.deepEqual(result.missing, [
    "domain-basis",
    "codomain-basis",
    "symmetry-evidence",
    "matrix"
  ]);
  assert.match(result.repair, /no notation is inferred/);
});
