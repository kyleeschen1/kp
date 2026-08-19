import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpVerifiedLikeDenominatorCombination,
  kpCanonicalLikeDenominatorCombination,
  kpCanonicalLikeDenominatorCombinationDraft,
  verifyKpLikeDenominatorCombination,
  type KpLikeDenominatorCombinationDraft
} from "../src/semantic/fraction-like-denominator-combination.ts";

test("combination preserves the denominator and combines raw numerators", () => {
  const verified = kpCanonicalLikeDenominatorCombination;

  assert.equal(isKpVerifiedLikeDenominatorCombination(verified), true);
  assert.deepEqual(
    verified.sourceForms.map(({ numerator, denominator }) => [
      numerator,
      denominator
    ]),
    [[2n, 6n], [1n, 6n]]
  );
  assert.deepEqual(
    [verified.targetForm.numerator, verified.targetForm.denominator],
    [3n, 6n]
  );
  assert.deepEqual(
    [verified.exactValue.numerator, verified.exactValue.denominator],
    [1n, 2n]
  );
  assert.equal(Object.isFrozen(verified), true);
  assert.equal(isKpVerifiedLikeDenominatorCombination({ ...verified }), false);
});

test("combination rejects unequal source denominators", () => {
  assert.throws(() => verifyKpLikeDenominatorCombination(draft({
    source: sourceWithSecondDenominator(5n)
  })), (error) => code(error) === "like-denominator.denominator-mismatch");
});

test("combination rejects hidden reduction and incorrect raw arithmetic", () => {
  assert.throws(() => verifyKpLikeDenominatorCombination(draft({
    target: targetWithValues(1n, 2n)
  })), (error) => code(error) === "like-denominator.result-mismatch");
  assert.throws(() => verifyKpLikeDenominatorCombination(draft({
    target: targetWithValues(4n, 6n)
  })), (error) => code(error) === "like-denominator.result-mismatch");
});

test("combination supports exact subtraction without becoming a solver", () => {
  const verified = verifyKpLikeDenominatorCombination(draft({
    operator: "-",
    target: targetWithValues(1n, 6n)
  }));
  assert.deepEqual(
    [verified.targetForm.numerator, verified.targetForm.denominator],
    [1n, 6n]
  );

  assert.throws(() => verifyKpLikeDenominatorCombination({
    ...draft(),
    reductionPolicy: "lowest-terms"
  } as KpLikeDenominatorCombinationDraft), (error) =>
    code(error) === "like-denominator.unexpected-field"
  );
});

test("combination preserves every source contributor through explicit lineage", () => {
  const verified = kpCanonicalLikeDenominatorCombination;
  const byId = (id: string) => verified.correspondence.find(
    (item) => item.id === id
  )!;

  assert.deepEqual(byId("correspondence.like-denominator.numerator"), {
    id: "correspondence.like-denominator.numerator",
    relation: "derivation",
    sourceEntityIds: [
      "entity.fraction.like-denominator.source.first.numerator",
      "entity.fraction.like-denominator.source.plus",
      "entity.fraction.like-denominator.source.second.numerator"
    ],
    targetEntityIds: [
      "entity.fraction.like-denominator.target.result.numerator"
    ],
    summary: "Both numerators and the source operator derive the raw numerator."
  });
  assert.equal(
    byId("correspondence.like-denominator.denominator").relation,
    "coalescence"
  );
  assert.equal(
    byId("correspondence.like-denominator.division").relation,
    "coalescence"
  );

  const representedSourceIds = new Set(
    verified.correspondence.flatMap(({ sourceEntityIds }) => sourceEntityIds)
  );
  const source = verified.source;
  const expectedSourceIds = [
    source.expressionEntityId,
    source.operatorEntityId,
    ...source.terms.flatMap((term) => [
      term.termEntityId,
      term.fractionEntityId,
      term.divisionEntityId,
      term.numerator.entityId,
      term.denominator.entityId
    ])
  ];
  expectedSourceIds.forEach((id) => assert.equal(
    representedSourceIds.has(id),
    true,
    `${id} must have explicit target lineage`
  ));
});

function draft(
  overrides: Partial<KpLikeDenominatorCombinationDraft> = {}
): KpLikeDenominatorCombinationDraft {
  return {
    ...kpCanonicalLikeDenominatorCombinationDraft,
    ...overrides
  } as KpLikeDenominatorCombinationDraft;
}

function sourceWithSecondDenominator(denominator: bigint) {
  const source = kpCanonicalLikeDenominatorCombinationDraft.source;
  return {
    ...source,
    terms: [
      source.terms[0],
      {
        ...source.terms[1],
        denominator: { ...source.terms[1].denominator, value: denominator }
      }
    ]
  } as KpLikeDenominatorCombinationDraft["source"];
}

function targetWithValues(numerator: bigint, denominator: bigint) {
  const target = kpCanonicalLikeDenominatorCombinationDraft.target;
  return {
    ...target,
    term: {
      ...target.term,
      numerator: { ...target.term.numerator, value: numerator },
      denominator: { ...target.term.denominator, value: denominator }
    }
  } as KpLikeDenominatorCombinationDraft["target"];
}

function code(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;
}
