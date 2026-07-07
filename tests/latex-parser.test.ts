import { strict as assert } from "node:assert";
import test from "node:test";

import {
  LatexParseError,
  parseLatexExpression
} from "../src/math/latex-parser.ts";

test("parseLatexExpression preserves arithmetic precedence", () => {
  assert.deepEqual(parseLatexExpression("x^2 - y^2 / 4"), {
    kind: "binary",
    operator: "-",
    left: {
      kind: "binary",
      operator: "^",
      left: { kind: "identifier", name: "x" },
      right: { kind: "number", value: 2 }
    },
    right: {
      kind: "binary",
      operator: "/",
      left: {
        kind: "binary",
        operator: "^",
        left: { kind: "identifier", name: "y" },
        right: { kind: "number", value: 2 }
      },
      right: { kind: "number", value: 4 }
    }
  });
});

test("parseLatexExpression parses LaTeX fractions and grouped powers", () => {
  assert.deepEqual(parseLatexExpression("\\frac{x^2-y^2}{4}"), {
    kind: "binary",
    operator: "/",
    left: {
      kind: "binary",
      operator: "-",
      left: {
        kind: "binary",
        operator: "^",
        left: { kind: "identifier", name: "x" },
        right: { kind: "number", value: 2 }
      },
      right: {
        kind: "binary",
        operator: "^",
        left: { kind: "identifier", name: "y" },
        right: { kind: "number", value: 2 }
      }
    },
    right: { kind: "number", value: 4 }
  });
});

test("parseLatexExpression parses functions and unary minus", () => {
  assert.deepEqual(parseLatexExpression("-\\sin(t) + \\sqrt{x}"), {
    kind: "binary",
    operator: "+",
    left: {
      kind: "unary",
      operator: "-",
      value: {
        kind: "call",
        name: "sin",
        argument: { kind: "identifier", name: "t" }
      }
    },
    right: {
      kind: "call",
      name: "sqrt",
      argument: { kind: "identifier", name: "x" }
    }
  });
});

test("parseLatexExpression reports structured parse errors", () => {
  assert.throws(
    () => parseLatexExpression("\\frac{x}{"),
    (error) =>
      error instanceof LatexParseError &&
      error.message === "Expected expression." &&
      error.offset === 8 &&
      error.expected === "expression"
  );
});
