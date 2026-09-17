import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFractionChainSource, FractionChainRepair } from "../src/authoring/fraction-chain-source.ts";
import { bindFractionChainAlignment } from "../src/authoring/fraction-chain-alignment.ts";
import { bindFractionChainCombination } from "../src/authoring/fraction-chain-combination.ts";
import { isKpVerifiedLikeDenominatorCombination } from "../src/semantic/fraction-like-denominator-combination.ts";

function chain(from: string, to: string) {
  const result = readFractionChainSource({ schema: "kp.algebra.fraction-chain.v1", id: "combination", title: "Count parts",
    states: [{ id: "before", latex: from }, { id: "after", latex: to }],
    moves: [{ id: "combine", from: "before", to: "after", prose: "Retain the denominator." }] });
  if (result.status !== "parsed") throw new Error(result.expected);
  return result.source;
}
test("raw combination retains operand order, signs, zero and an unreduced denominator", () => {
  for (const [from, to, numerator] of [["2/6+1/6", "3/6", 3n], ["5/6-2/6", "3/6", 3n],
    ["2/6-5/6", "(-3)/6", -3n], ["2/6-2/6", "0/6", 0n], ["(-2)/6+1/6", "(-1)/6", -1n]] as const) {
    const binding = bindFractionChainCombination(chain(from, to), 0);
    assert.equal(isKpVerifiedLikeDenominatorCombination(binding), true);
    assert.equal(binding.targetForm.numerator, numerator);
    assert.equal(binding.targetForm.denominator, 6n);
    assert.equal(isKpVerifiedLikeDenominatorCombination({ ...binding }), false);
  }
});
test("alignment target occurrences are exactly the following combination's source occurrences", () => {
  const parsed = readFractionChainSource(JSON.parse(readFileSync("examples/algebra/fraction-chain.json", "utf8")));
  if (parsed.status !== "parsed") throw new Error(parsed.expected);
  const alignment = bindFractionChainAlignment(parsed.source, 0), combination = bindFractionChainCombination(parsed.source, 1);
  assert.deepEqual(alignment.target, combination.source);
  assert.notEqual(combination.source.terms[0].denominator.entityId, combination.source.terms[1].denominator.entityId);
  assert.ok(combination.correspondence.some(record => record.relation === "coalescence"));
});
test("combination rejects hidden reduction, unlike denominators and subtraction reversal", () => {
  for (const [from, to] of [["2/6+1/6", "1/2"], ["1/3+1/6", "3/6"], ["2/6-5/6", "3/6"], ["2/6-2/6", "0/1"]])
    assert.throws(() => bindFractionChainCombination(chain(from!, to!), 0), FractionChainRepair);
});
