import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkFractionChainAuthorSource } from "../src/authoring/fraction-chain-author-check.ts";

for (const id of ["fraction-add-reduce", "fraction-two-sided", "fraction-subtract"]) {
  test(`${id}: source-only caller resolves its intended operation sequence`, () => {
    const input = readFileSync(new URL(`../content/authoring/convergence/${id}.json`, import.meta.url), "utf8");
    const result = checkFractionChainAuthorSource(input);
    assert.equal(result.status, "compiled");
    if (result.status !== "compiled") throw new Error(JSON.stringify(result));
    assert.equal(result.hostEligibility.status, "eligible");
    assert.deepEqual(result.moves.map(move => move.kind), id === "fraction-add-reduce" ? ["align", "combine", "reduce"] : ["align", "combine"]);
  });
}

test("negative-result trial retains its located repair instead of claiming application", () => {
  const input = JSON.parse(readFileSync(new URL("../content/authoring/convergence/fraction-subtract.json", import.meta.url), "utf8"));
  input.states[0].latex = "\\frac{1}{6}-\\frac{3}{4}";
  input.states[1].latex = "\\frac{2}{12}-\\frac{9}{12}";
  // This is observed unsupported compilation, not a desired mathematical restriction.
  // A future repair must replace this evidence with successful host preservation checks.
  for (const latex of ["\\frac{-7}{12}", "(-7)/12"]) {
    input.states[2].latex = latex;
    const result = checkFractionChainAuthorSource(JSON.stringify(input));
    assert.equal(result.status, "repair-required");
    if (result.status !== "repair-required") throw new Error("Update the negative-result convergence evidence.");
    assert.equal(result.code, "fraction-chain.operation");
    assert.equal(result.path, "$.moves[1]");
    assert.equal(result.expected, "Ordered LaTeX endpoints do not represent the pinned combination.");
  }
});
