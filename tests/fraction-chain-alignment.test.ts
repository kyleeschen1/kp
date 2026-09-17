import test from "node:test";
import assert from "node:assert/strict";
import { readFractionChainSource, FractionChainRepair } from "../src/authoring/fraction-chain-source.ts";
import { bindFractionChainAlignment } from "../src/authoring/fraction-chain-alignment.ts";
import { isKpVerifiedCommonDenominatorAlignment } from "../src/semantic/fraction-common-denominator.ts";

function chain(from: string, to: string) {
  const parsed = readFractionChainSource({ schema: "kp.algebra.fraction-chain.v1", id: "alignment", title: "Align fractions",
    states: [{ id: "before", latex: from }, { id: "after", latex: to }],
    moves: [{ id: "align", from: "before", to: "after", prose: "Use matching denominators." }] });
  if (parsed.status !== "parsed") throw new Error(parsed.expected);
  return parsed.source;
}
test("chain alignment uses the existing sealed owner for one- and two-sided scaling", () => {
  for (const [from, to, factors] of [["1/3+1/6", "2/6+1/6", [2n, 1n]], ["1/6+1/8", "4/24+3/24", [4n, 3n]]] as const) {
    const binding = bindFractionChainAlignment(chain(from, to), 0);
    assert.equal(isKpVerifiedCommonDenominatorAlignment(binding), true);
    assert.deepEqual(binding.equivalenceMultipliers.map(factor => factor.numerator), factors);
    assert.notEqual(binding.source.terms[0].numerator.entityId, binding.source.terms[1].numerator.entityId);
    assert.equal(isKpVerifiedCommonDenominatorAlignment({ ...binding }), false);
  }
});
test("alignment rejects false witnesses, sign changes, reduction, no-ops and invalid adjacency", () => {
  for (const [from, to] of [["1/3+1/6", "3/6+1/6"], ["1/3+1/6", "2/6+2/12"], ["1/3+1/6", "2/6-1/6"],
    ["1/3+1/6", "1/2"], ["2/6+1/6", "1/3+1/6"], ["1/6+1/6", "1/6+1/6"]]) {
    assert.throws(() => bindFractionChainAlignment(chain(from!, to!), 0), FractionChainRepair);
  }
  assert.throws(() => bindFractionChainAlignment(chain("1/3+1/6", "2/6+1/6"), 1), FractionChainRepair);
});
test("exact alignment pressures independently scaled denominators without rounding", () => {
  for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) {
    const binding = bindFractionChainAlignment(chain(`1/${a}+1/${b}`, `${b}/${a*b}+${a}/${a*b}`), 0);
    assert.equal(binding.targetForms[0].denominator, BigInt(a*b));
    assert.deepEqual(binding.sourceForms.map(form => form.value), binding.targetForms.map(form => form.value));
  }
});
