import assert from "node:assert/strict";
import test from "node:test";
import { parseLatexExpression, parseLatexScalarExpression } from "../src/math/latex-parser.ts";
import { tokenizeLatex } from "../src/math/latex-tokenizer.ts";
import { readKpCommonFactorSource, KpCommonFactorRepair } from "../src/authoring/common-factor-source.ts";
import { normalizeKpCommonFactorEndpoints } from "../src/authoring/common-factor-normalizer.ts";

function source(before: string, after: string) {
  return readKpCommonFactorSource({ schemaVersion: "kp.common-factor-source.v1", id: "lesson.test.factor", domain: "real-scalars",
    symbols: ["a", "b", "c"], states: [{ id: "state.before", latex: before, narration: "Before" },
      { id: "state.after", latex: after, narration: "After" }], editorial: { title: "Factor", setup: "Inspect", summary: "Group" } });
}

test("explicit scalar multiplication reuses parser precedence and preserves source spelling", () => {
  const latex = String.raw`a \cdot b+a \cdot c`;
  const result = normalizeKpCommonFactorEndpoints(source(latex, String.raw`a \cdot (b+c)`));
  assert.deepEqual(result[0].expression, parseLatexExpression("a*b+a*c"));
  assert.equal(result[0].authoredLatex, latex);
  assert.deepEqual(tokenizeLatex(String.raw`a \cdot b`)[1], { kind: "operator", value: "*", offset: 2 });
  assert.throws(() => normalizeKpCommonFactorEndpoints(source("z*b+z*c", "z*(b+c)")), KpCommonFactorRepair);
  assert.throws(() => normalizeKpCommonFactorEndpoints(source("a/b", "a*b")), KpCommonFactorRepair);
});

test("non-factoring parser callers retain functions, identifiers and grouping semantics", () => {
  assert.deepEqual(parseLatexExpression("abc"), { kind: "identifier", name: "abc" });
  assert.equal(parseLatexExpression(String.raw`\sin(x)`).kind, "call");
  assert.throws(() => parseLatexExpression(String.raw`a\cdotfoo b`));
  assert.deepEqual(parseLatexExpression("a*(b+c)"), parseLatexExpression(String.raw`a\cdot{b+c}`));
});

test("declared scalar juxtaposition composes through existing precedence without global reinterpretation", () => {
  for (const [latex, explicit] of [["ab+ac", "a*b+a*c"], ["a(b+c)", "a*(b+c)"], ["2a+2b", "2*a+2*b"], ["(a+b)c", "(a+b)*c"]])
    assert.deepEqual(parseLatexScalarExpression(latex!, ["a", "b", "c"]), parseLatexExpression(explicit!));
  const result = normalizeKpCommonFactorEndpoints(source("ab+ac", "a(b+c)"));
  assert.equal(result[0].authoredLatex, "ab+ac");
  assert.deepEqual(parseLatexExpression("ab"), { kind: "identifier", name: "ab" });
  for (const latex of ["sin(a)", "2 3", "a2", "z(a+b)", "a^2", String.raw`\sin(a)`])
    assert.throws(() => parseLatexScalarExpression(latex, ["a", "b", "c", "s", "i", "n"]));
  assert.throws(() => normalizeKpCommonFactorEndpoints(source("sin(a)", "a")),
    (e: unknown) => e instanceof KpCommonFactorRepair && e.code === "ambiguous-notation");
  assert.throws(() => normalizeKpCommonFactorEndpoints(source("za", "a")),
    (e: unknown) => e instanceof KpCommonFactorRepair && e.code === "undeclared-symbol");
});
