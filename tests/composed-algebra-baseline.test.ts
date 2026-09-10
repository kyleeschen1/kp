import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/common-factor-primary.json" with { type: "json" };
import { prepareKpCommonFactorDraft } from "../src/authoring/common-factor-draft.ts";
import { KpCommonFactorRepair } from "../src/authoring/common-factor-source.ts";
import { parseLatexScalarExpression } from "../src/math/latex-parser.ts";

test("M1a retains atomic left factoring rather than silently accepting M1b", () => {
  const prepared = prepareKpCommonFactorDraft(primary);
  assert.equal(prepared.presentation.owner, "canonical-factoring-native-v1");
  assert.equal(prepared.presentation.composition, "one-factor-transition-two-checkpoints");
  for (const [before, after] of [
    ["2(x+3)+3(x+3)", "(2+3)(x+3)"],
    ["(x+3)*2+(x+3)*3", "(x+3)(2+3)"],
    ["ba+ca", "(b+c)a"]
  ]) {
    assert.throws(() => prepareKpCommonFactorDraft({ ...primary,
      symbols: ["a", "b", "c", "x"],
      states: primary.states.map((s, i) => ({ ...s, latex: i === 0 ? before : after }))
    }), (e: unknown) => e instanceof KpCommonFactorRepair && e.code === "unsupported-shape");
  }
});

test("M1a cannot acquire a third state by serial source mutation", () => {
  assert.throws(() => prepareKpCommonFactorDraft({ ...primary,
    states: [...primary.states, { id: "state.third", latex: "5(x+3)", narration: "Evaluate" }]
  }), (e: unknown) => e instanceof KpCommonFactorRepair && e.code === "source" && e.path === "$.states");
});

test("existing scalar parser preserves compound structure without authorizing a rewrite", () => {
  const expression = parseLatexScalarExpression("2(x+3)+3(x+3)", ["x"]);
  assert.equal(expression.kind, "binary");
  assert.deepEqual(parseLatexScalarExpression("(2+3)(x+3)", ["x"]),
    parseLatexScalarExpression("(2+3)*(x+3)", ["x"]));
});
