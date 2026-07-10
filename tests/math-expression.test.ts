import { strict as assert } from "node:assert";
import test from "node:test";

import {
  add,
  compileExpression,
  compileGradient,
  constant,
  differentiate,
  divide,
  evaluateConstantExpression,
  expressionToLatex,
  negate,
  power,
  variable
} from "../src/math/expression.ts";
import {
  evaluateSaddleSurface,
  evaluateSaddleSurfaceGradient,
  saddleSurfaceExpression,
  saddleSurfaceLatex
} from "../src/math/surface-examples.ts";
import {
  createExpressionObject
} from "../src/semantic/expression-object.ts";
import {
  listSemanticComputationProtocols,
  semanticDifferentiate,
  semanticEvaluate,
  semanticGraphForm,
  semanticNumericSample,
  semanticToLatex
} from "../src/semantic/computation-protocols.ts";

test("semantic expressions render to LaTeX and evaluate numerically", () => {
  const expression = divide(
    add(power(variable("x"), 2), negate(power(variable("y"), 2))),
    constant(4)
  );
  const evaluate = compileExpression(expression);

  assert.equal(expressionToLatex(expression), "\\frac{x^{2} - y^{2}}{4}");
  assert.equal(evaluate({ x: 2, y: 1 }), 0.75);
});

test("symbolic differentiation produces executable partial derivatives", () => {
  const expression = divide(
    add(power(variable("x"), 2), negate(power(variable("y"), 2))),
    constant(4)
  );
  const partialX = compileExpression(differentiate(expression, "x"));
  const partialY = compileExpression(differentiate(expression, "y"));
  const gradient = compileGradient(expression, ["x", "y"]);
  const gradientX = gradient[0];
  const gradientY = gradient[1];
  const scope = { x: 3, y: 2 };

  if (gradientX === undefined || gradientY === undefined) {
    throw new Error("Expected gradient evaluators for x and y.");
  }

  assert.equal(partialX(scope), 1.5);
  assert.equal(partialY(scope), -1);
  assert.equal(gradientX(scope), 1.5);
  assert.equal(gradientY(scope), -1);
});

test("constant expressions evaluate only when every dependency is numeric", () => {
  assert.equal(
    evaluateConstantExpression(add(constant(10), negate(constant(2)))),
    8
  );
  assert.equal(
    evaluateConstantExpression(add(variable("x"), constant(1))),
    undefined
  );
  assert.equal(
    evaluateConstantExpression(divide(constant(1), constant(0))),
    undefined
  );
});

test("saddle surface example shares one expression across latex, eval, and AD", () => {
  assert.equal(saddleSurfaceLatex, "\\frac{x^{2} - y^{2}}{4}");
  assert.equal(expressionToLatex(saddleSurfaceExpression), saddleSurfaceLatex);
  assert.equal(evaluateSaddleSurface({ x: 2, y: -1 }), 0.75);
  assert.deepEqual(evaluateSaddleSurfaceGradient({ x: 2, y: -1 }), {
    dx: 1,
    dy: 0.5
  });
});

test("semantic computation protocols expose expression capabilities", () => {
  const expression = createExpressionObject({
    id: "expr-shifted-parabola",
    label: "Shifted parabola",
    expression: add(power(variable("x"), 2), constant(1))
  });

  assert.deepEqual(expression.variables, ["x"]);
  assert.deepEqual(listSemanticComputationProtocols(expression), [
    "toLatex",
    "evaluate",
    "differentiate",
    "graphForm",
    "numericSample"
  ]);
  assert.equal(semanticToLatex(expression), "x^{2} + 1");
  assert.deepEqual(semanticEvaluate(expression, { scope: { x: 2 } }), {
    kind: "scalar",
    value: 5
  });

  const derivative = semanticDifferentiate(expression, "x");

  assert.ok(derivative);
  assert.equal(semanticToLatex(derivative), "2 x");

  assert.deepEqual(
    semanticNumericSample(expression, { xDomain: [-1, 1], sampleCount: 3 }),
    {
      kind: "curve-2d-sample",
      points: [
        { x: -1, y: 2 },
        { x: 0, y: 1 },
        { x: 1, y: 2 }
      ]
    }
  );

  const graphForm = semanticGraphForm(expression, {
    xDomain: [-1, 1],
    sampleCount: 3
  });

  assert.deepEqual(
    graphForm?.map((object) => object.type),
    ["graph-2d", "axis-2d", "axis-2d", "curve-2d"]
  );
});

test("semantic numeric sampling supports expression-backed surfaces", () => {
  const expression = createExpressionObject({
    id: "expr-saddle",
    label: "Saddle",
    expression: saddleSurfaceExpression
  });

  assert.deepEqual(expression.variables, ["x", "y"]);
  assert.deepEqual(
    semanticNumericSample(expression, {
      xDomain: [-1, 1],
      yDomain: [-1, 1],
      xSampleCount: 3,
      ySampleCount: 3
    }),
    {
      kind: "surface-3d-sample",
      grid: [
        [
          { x: -1, y: -1, z: 0 },
          { x: 0, y: -1, z: -0.25 },
          { x: 1, y: -1, z: 0 }
        ],
        [
          { x: -1, y: 0, z: 0.25 },
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0.25 }
        ],
        [
          { x: -1, y: 1, z: 0 },
          { x: 0, y: 1, z: -0.25 },
          { x: 1, y: 1, z: 0 }
        ]
      ]
    }
  );

  assert.deepEqual(
    semanticGraphForm(expression)?.map((object) => object.type),
    ["graph-3d", "axis-3d", "axis-3d", "axis-3d", "surface-3d"]
  );
});
