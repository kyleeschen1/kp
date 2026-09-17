import test from "node:test";
import assert from "node:assert/strict";
import { readFractionChainSource, FractionChainRepair } from "../src/authoring/fraction-chain-source.ts";
import { bindFractionChainReduction } from "../src/authoring/fraction-chain-reduction.ts";
import { verifyIntegerFractionReduction, isVerifiedIntegerFractionReduction } from "../src/semantic/fraction-integer-reduction.ts";
import { createGeneratedFractionExpressionTutorialFixture } from "../src/semantic/generated-algebra-tutorial-fixture.ts";

function chain(from: string, to: string) {
  const result = readFractionChainSource({ schema: "kp.algebra.fraction-chain.v1", id: "reduction", title: "Reduce fractions",
    states: [{ id: "before", latex: from }, { id: "after", latex: to }],
    moves: [{ id: "reduce", from: "before", to: "after", prose: "Divide both integers by the same common factor." }] });
  if (result.status !== "parsed") throw new Error(result.expected);
  return result.source;
}
test("reduction checks an explicit common divisor, including partial, signed and zero cases", () => {
  for (const [before, after, divisor] of [["3/6", "1/2", 3n], ["6/12", "3/6", 2n], ["(-6)/9", "(-2)/3", 3n], ["0/6", "0/1", 6n]] as const) {
    const checked = bindFractionChainReduction(chain(before, after), 0);
    assert.equal(isVerifiedIntegerFractionReduction(checked), true);
    assert.equal(checked.divisor, divisor);
    assert.equal(checked.correspondence.length, 2);
    assert.equal(isVerifiedIntegerFractionReduction({ ...checked }), false);
    assert.throws(() => verifyIntegerFractionReduction({ ...checked, divisor: divisor + 1n }));
    assert.throws(() => verifyIntegerFractionReduction({ ...checked, target: checked.source }));
    assert.throws(() => verifyIntegerFractionReduction({ ...checked, target: { ...checked.target,
      term: { ...checked.target.term, denominator: { ...checked.target.term.denominator, value: 0n } } } }));
  }
});
test("reduction rejects value changes, mismatched divisors, no-ops and expansion", () => {
  for (const [from, to] of [["3/6", "1/3"], ["6/9", "2/2"], ["3/6", "3/6"], ["1/2", "3/6"], ["3/6", "2/4"]])
    assert.throws(() => bindFractionChainReduction(chain(from!, to!), 0), FractionChainRepair);
});
test("the existing reduction fixture accepts verified positive parameters without certifying its paint", () => {
  const checked = bindFractionChainReduction(chain("3/6", "1/2"), 0);
  const fixture = createGeneratedFractionExpressionTutorialFixture({ familyId: "generated.fraction-expression", id: "fraction-chain.three-sixths",
    title: "Reduce three sixths", numerator: Number(checked.source.term.numerator.value), denominator: Number(checked.source.term.denominator.value),
    simplifiedNumerator: Number(checked.target.term.numerator.value), simplifiedDenominator: Number(checked.target.term.denominator.value) });
  assert.equal(fixture.transformations.length, 3);
  assert.equal(fixture.bundle.objects.length, 4);
  // The existing presentation excludes zero even though its reduction is true.
  assert.throws(() => createGeneratedFractionExpressionTutorialFixture({ familyId: "generated.fraction-expression", id: "zero", title: "Zero",
    numerator: 0, denominator: 6, simplifiedNumerator: 0, simplifiedDenominator: 1 }));
});
