import { strict as assert } from "node:assert";
import test from "node:test";

import { expressionToLatex } from "../src/math/expression.ts";
import {
  classifyLatexEquation,
  parseLatexEquation
} from "../src/math/equation-classifier.ts";

test("parseLatexEquation parses one equals sign between expressions", () => {
  assert.deepEqual(parseLatexEquation("y = x^2"), {
    kind: "equation",
    left: { kind: "identifier", name: "y" },
    right: {
      kind: "binary",
      operator: "^",
      left: { kind: "identifier", name: "x" },
      right: { kind: "number", value: 2 }
    }
  });
});

test("classifyLatexEquation classifies explicit 2D curves", () => {
  const equation = classifyLatexEquation("y = x^2");

  assert.equal(equation.kind, "explicit-2d-curve");
  assert.equal(equation.dependentVariable, "y");
  assert.equal(equation.independentVariable, "x");
  assert.equal(expressionToLatex(equation.expression), "x^{2}");
});

test("classifyLatexEquation classifies explicit 3D surfaces", () => {
  const equation = classifyLatexEquation("z = \\frac{x^2-y^2}{4}");

  assert.equal(equation.kind, "explicit-3d-surface");
  assert.equal(equation.dependentVariable, "z");
  assert.deepEqual(equation.independentVariables, ["x", "y"]);
  assert.equal(expressionToLatex(equation.expression), "\\frac{x^{2} - y^{2}}{4}");
});

test("classifyLatexEquation rejects unsupported implicit equations", () => {
  assert.throws(
    () => classifyLatexEquation("x^2 + y^2 = 1"),
    /Only explicit equations with a single dependent variable on the left are supported/
  );
});
