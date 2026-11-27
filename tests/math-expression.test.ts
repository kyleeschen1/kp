import { strict as assert } from "node:assert";
import test from "node:test";
import katex from "katex";

import {
  add,
  compileExpression,
  compileGradient,
  constant,
  cos,
  differentiate,
  divide,
  evaluateConstantExpression,
  expressionToLatex,
  multiply,
  negate,
  power,
  sin,
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
import {
  deriveGraphLatexFromScene
} from "../src/semantic/graph-latex.ts";
import type {
  Curve2DObject,
  Graph2DObject
} from "../src/semantic/graph.ts";

test("semantic expressions render to LaTeX and evaluate numerically", () => {
  const expression = divide(
    add(power(variable("x"), 2), negate(power(variable("y"), 2))),
    constant(4)
  );
  const evaluate = compileExpression(expression);

  assert.equal(expressionToLatex(expression), "\\frac{x^{2} - y^{2}}{4}");
  assert.equal(evaluate({ x: 2, y: 1 }), 0.75);
});

test("round-trip number printing is opt-in and default nested output stays unchanged", () => {
  const expression = divide(
    add(sin(multiply(constant(1e-8), variable('x'))), cos(add(variable('y'), constant(-1e-8)))),
    power(add(variable('z'), constant(1.23456789)), -1e-8)
  );
  const legacy = '\\frac{\\sin\\left(0 x\\right) + \\cos\\left(y - 0\\right)}{\\left(z + 1.234568\\right)^{-0}}';
  assert.equal(expressionToLatex(expression), legacy);
  assert.deepEqual([expression, expression].map(expressionToLatex), [legacy, legacy]);
  assert.equal(expressionToLatex(expression, {}), legacy);
  const precise = '\\frac{\\sin\\left(1 \\times 10^{-8} x\\right) + \\cos\\left(y - 1 \\times 10^{-8}\\right)}{\\left(z + 1.23456789\\right)^{-1 \\times 10^{-8}}}';
  assert.equal(expressionToLatex(expression, { numbers: 'round-trip' }), precise);
  assert.doesNotThrow(() => katex.renderToString(precise, { throwOnError: true }));
  // Choosing a presentation never mutates the expression or future defaults.
  assert.equal(expressionToLatex(expression), legacy);
  for (const [value, expected] of [[1e-8, '0'], [-1e-8, '-0'], [1.23456789, '1.234568'], [1e30, '1e+30']] as const) {
    assert.equal(expressionToLatex(constant(value)), expected);
  }
});

test("round-trip constants retain tiny, large, signed, and fractional numeric values", () => {
  const values = [0, 1, -1, 1e-8, -1e-8, 1e30, -1e30, 1.2345678901234567, Math.PI, Number.MIN_VALUE, -Number.MIN_VALUE, Number.MAX_VALUE];
  for (const value of values) {
    const latex = expressionToLatex(constant(value), { numbers: 'round-trip' });
    const scientific = /^(-?\d+(?:\.\d+)?) \\times 10\^\{(-?\d+)\}$/.exec(latex);
    const recovered = scientific ? Number(`${scientific[1]}e${scientific[2]}`) : Number(latex);
    assert.equal(recovered, value, latex);
    assert.doesNotThrow(() => katex.renderToString(latex, { throwOnError: true }));
  }
  assert.equal(expressionToLatex(constant(-0), { numbers: 'round-trip' }), '0');
});

test("numeric notation has correct grouping in powers, products, and signed nested expressions", () => {
  const positivePower = { kind: 'power', base: constant(1e-8), exponent: 2 } as const;
  const negativePower = { kind: 'power', base: constant(-1e30), exponent: -1e-8 } as const;
  const examples = [
    [positivePower, '\\left(1 \\times 10^{-8}\\right)^{2}'],
    [negativePower, '\\left(-1 \\times 10^{30}\\right)^{-1 \\times 10^{-8}}'],
    [multiply(variable('x'), constant(-1e-8)), '\\left(-1 \\times 10^{-8}\\right) x'],
    [negate(divide(constant(1e-8), cos(constant(-1e30)))), '-\\frac{1 \\times 10^{-8}}{\\cos\\left(-1 \\times 10^{30}\\right)}'],
    [add(variable('x'), negate(sin(constant(1e-8)))), 'x - \\sin\\left(1 \\times 10^{-8}\\right)']
  ] as const;
  for (const [expression, expected] of examples) {
    const latex = expressionToLatex(expression, { numbers: 'round-trip' });
    assert.equal(latex, expected);
    assert.doesNotThrow(() => katex.renderToString(latex, { throwOnError: true }));
  }
});

test("round-trip mode refuses nonfinite constants and exponents at any depth", () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    for (const expression of [constant(value), sin(divide(variable('x'), constant(value))), power(variable('x'), value)]) {
      assert.throws(() => expressionToLatex(expression, { numbers: 'round-trip' }), /finite numbers/);
    }
  }
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
  const graph = graphForm?.find(
    (object): object is Graph2DObject => object.type === "graph-2d"
  );
  const curve = graphForm?.find(
    (object): object is Curve2DObject => object.type === "curve-2d"
  );

  assert.deepEqual(
    graphForm?.map((object) => object.type),
    ["graph-2d", "axis-2d", "axis-2d", "curve-2d"]
  );
  assert.equal(curve?.latexProvenance?.kind, "exact");
  assert.equal(curve?.latexProvenance?.latex, "y = x^{2} + 1");
  assert.equal(curve?.latexProvenance?.sourceKind, "expression");
  assert.equal(curve?.latexProvenance?.sourceObjectId, "expr-shifted-parabola");

  if (graphForm === undefined || graph === undefined) {
    throw new Error("Expected expression-backed Graph2D scene.");
  }

  const latexDerivation = deriveGraphLatexFromScene(graphForm, graph.id);

  assert.equal(latexDerivation.kind, "exact");
  assert.equal(latexDerivation.latex, "y = x^{2} + 1");
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
