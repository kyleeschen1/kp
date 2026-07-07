import { strict as assert } from "node:assert";
import test from "node:test";

import {
  add,
  compileExpression,
  compileGradient,
  constant,
  differentiate,
  divide,
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

test("saddle surface example shares one expression across latex, eval, and AD", () => {
  assert.equal(saddleSurfaceLatex, "\\frac{x^{2} - y^{2}}{4}");
  assert.equal(expressionToLatex(saddleSurfaceExpression), saddleSurfaceLatex);
  assert.equal(evaluateSaddleSurface({ x: 2, y: -1 }), 0.75);
  assert.deepEqual(evaluateSaddleSurfaceGradient({ x: 2, y: -1 }), {
    dx: 1,
    dy: 0.5
  });
});
