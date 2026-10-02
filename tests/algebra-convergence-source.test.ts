import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkFractionChainAuthorSource } from "../src/authoring/fraction-chain-author-check.ts";

for (const id of ["fraction-add-reduce", "fraction-two-sided", "fraction-subtract", "fraction-negative"]) {
  test(`${id}: source-only caller resolves its intended operation sequence`, () => {
    const input = readFileSync(new URL(`../content/authoring/convergence/${id}.json`, import.meta.url), "utf8");
    const result = checkFractionChainAuthorSource(input);
    assert.equal(result.status, "compiled");
    if (result.status !== "compiled") throw new Error(JSON.stringify(result));
    assert.equal(result.hostEligibility.status, "eligible");
    assert.deepEqual(result.moves.map(move => move.kind), id === "fraction-add-reduce" ? ["align", "combine", "reduce"] : ["align", "combine"]);
  });
}

test("negative-result trial compiles signed numerator notation", () => {
  const input = JSON.parse(readFileSync(new URL("../content/authoring/convergence/fraction-subtract.json", import.meta.url), "utf8"));
  input.states[0].latex = "\\frac{1}{6}-\\frac{3}{4}";
  input.states[1].latex = "\\frac{2}{12}-\\frac{9}{12}";
  for (const latex of ["\\frac{-7}{12}", "(-7)/12"]) {
    input.states[2].latex = latex;
    const result = checkFractionChainAuthorSource(JSON.stringify(input));
    assert.equal(result.status, "compiled", JSON.stringify(result));
    if (result.status !== "compiled") throw new Error("Signed result failed compilation.");
    assert.equal(result.hostEligibility.status, "eligible");
  }
});

test("signed inputs align and combine while incorrect signed results fail closed", () => {
  const input = JSON.parse(readFileSync(new URL("../content/authoring/convergence/fraction-negative.json", import.meta.url), "utf8"));
  input.states[0].latex = "\\frac{-1}{6}+\\frac{3}{4}";
  input.states[1].latex = "\\frac{-2}{12}+\\frac{9}{12}";
  input.states[2].latex = "\\frac{7}{12}";
  assert.equal(checkFractionChainAuthorSource(JSON.stringify(input)).status, "compiled");
  for (const latex of ["\\frac{-7}{12}", "\\frac{8}{12}", "\\frac{7}{13}"]) {
    input.states[2].latex = latex;
    const result = checkFractionChainAuthorSource(JSON.stringify(input));
    assert.equal(result.status, "repair-required", latex);
    if (result.status === "repair-required") assert.equal(result.path, "$.moves[1]");
  }
});
