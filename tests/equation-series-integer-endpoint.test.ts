import assert from "node:assert/strict";
import test from "node:test";
import { matchesInteger } from "../src/authoring/equation-series-integer-endpoint.ts";
import { parseLatexExpression } from "../src/math/latex-parser.ts";

test("endpoint matching accepts signed literals and preserves exact sign and value", () => {
  for (const value of [-1000000, -7, -1, 0, 1, 7, 1000000]) {
    const expression = parseLatexExpression(String(value));
    assert.equal(matchesInteger(expression, BigInt(value)), true);
    assert.equal(matchesInteger(expression, BigInt(value + 1)), false);
    if (value !== 0) assert.equal(matchesInteger(expression, -BigInt(value)), false);
  }
});

test("endpoint matching does not evaluate expressions or accept unsafe integers", () => {
  for (const latex of ["--7", "3+4", "7.5", "x", "-(3+4)", "9007199254740992"]) {
    assert.equal(matchesInteger(parseLatexExpression(latex), 7n), false, latex);
  }
  assert.equal(matchesInteger(parseLatexExpression("9007199254740992"), 9007199254740992n), false);
});
