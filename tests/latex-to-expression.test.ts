import { strict as assert } from "node:assert";
import test from "node:test";

import {
  compileExpression,
  differentiate,
  expressionToLatex
} from "../src/math/expression.ts";
import { parseLatexMathExpression } from "../src/math/latex-to-expression.ts";

test("parseLatexMathExpression lowers fractions into executable expressions", () => {
  const expression = parseLatexMathExpression("\\frac{x^2-y^2}{4}");
  const evaluate = compileExpression(expression);
  const partialX = compileExpression(differentiate(expression, "x"));
  const partialY = compileExpression(differentiate(expression, "y"));

  assert.equal(expressionToLatex(expression), "\\frac{x^{2} - y^{2}}{4}");
  assert.equal(evaluate({ x: 3, y: 1 }), 2);
  assert.equal(partialX({ x: 3, y: 1 }), 1.5);
  assert.equal(partialY({ x: 3, y: 1 }), -0.5);
});

test("parseLatexMathExpression lowers functions and square roots", () => {
  const expression = parseLatexMathExpression("\\sin(t)+\\sqrt{x}");
  const evaluate = compileExpression(expression);

  assert.equal(expressionToLatex(expression), "\\sin\\left(t\\right) + x^{0.5}");
  assert.equal(evaluate({ t: Math.PI / 2, x: 9 }), 4);
});
