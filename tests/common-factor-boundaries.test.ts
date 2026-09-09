import assert from "node:assert/strict";
import test from "node:test";
import numeric from "../src/authoring/examples/common-factor-numeric.json" with { type: "json" };
import { checkKpCommonFactorDraft } from "../src/authoring/common-factor-author-check.ts";

const source = (before: string, after: string) => ({ ...numeric,
  states: [{ ...numeric.states[0], latex: before }, { ...numeric.states[1], latex: after }] });
const check = (before: string, after: string) => checkKpCommonFactorDraft(JSON.stringify(source(before, after)));

test("single-digit factors and repeated occurrences preserve exact ordered proof", () => {
  for (let factor = 0; factor <= 9; factor++) {
    for (const [left, right] of [["x", "y"], ["x", "x"], ["y", "x"]]) {
      const result = check(`${factor}${left}+${factor}${right}`, `${factor}(${left}+${right})`);
      assert.equal(result.status, "compiled");
      if (result.status !== "compiled") continue;
      const copies = result.draft.presentation.plan.choreography!.factorCopyIds;
      assert.equal(new Set(copies).size, 2, "equal spelling never merges source occurrence identities");
      const wrong = check(`${factor}${left}+${factor}${right}`, `${(factor + 1) % 10}(${left}+${right})`);
      assert.equal(wrong.status, "repair-gap");
      assert.equal("draft" in wrong, false);
      if (wrong.status === "repair-gap") assert.equal(wrong.diagnostic.code, "invalid-factorization");
    }
  }
});

test("altered addends and reordered products cannot borrow valid factoring authority", () => {
  for (const [before, after] of [["2x+3y", "2(x+y)"], ["2x+2y", "2(y+x)"], ["2x+2y", "2(x+x)"], ["x*2+y*2", "2(x+y)"]]) {
    const result = check(before!, after!);
    assert.equal(result.status, "repair-gap");
    assert.equal("draft" in result, false);
  }
});

test("unsupported notation, composite factors and hostile source stay located repairs", () => {
  for (const [before, after] of [["12x+12y", "12(x+y)"], ["2x+2z", "2(x+z)"], ["2sin(x)+2y", "2(sin(x)+y)"],
    ["2x^2+2y", "2(x^2+y)"], ["-2x-2y", "-2(x+y)"], ["2\\htmlClass{bad}{x}+2y", "2(x+y)"],
    ["2 3+2y", "2(3+y)"], ["(".repeat(513), "2(x+y)"]]) {
    const result = check(before!, after!);
    assert.equal(result.status, "repair-gap");
    assert.equal("draft" in result, false);
    if (result.status === "repair-gap") {
      assert.ok(result.diagnostic.path.startsWith("$"));
      assert.ok(result.diagnostic.expected.length > 0);
    }
  }
  for (const input of ["{", " ".repeat(20_001), JSON.stringify({ ...numeric, ["__proto__"]: { verified: true } }),
    JSON.stringify({ ...numeric, proof: { verified: true } })]) {
    assert.equal(checkKpCommonFactorDraft(input).status, "repair-gap");
  }
});
