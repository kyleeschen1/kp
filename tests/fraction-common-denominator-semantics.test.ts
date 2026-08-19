import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY,
  isKpCommonDenominatorProof,
  isKpVerifiedCommonDenominatorAlignment,
  kpCanonicalCommonDenominatorAlignment,
  kpCanonicalCommonDenominatorAlignmentDraft,
  verifyKpCommonDenominatorAlignment,
  type KpCommonDenominatorAlignmentDraft
} from "../src/semantic/fraction-common-denominator.ts";

test("alignment request supplies bounded explicit unit factors", () => {
  const draft = kpCanonicalCommonDenominatorAlignmentDraft;

  assert.equal(
    draft.operationAuthority,
    KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY
  );
  assert.deepEqual(
    draft.source.terms.map(({ numerator, denominator }) => [
      numerator.value,
      denominator.value
    ]),
    [[1n, 3n], [1n, 6n]]
  );
  assert.deepEqual(
    draft.target.terms.map(({ numerator, denominator }) => [
      numerator.value,
      denominator.value
    ]),
    [[2n, 6n], [1n, 6n]]
  );
  assert.deepEqual(
    draft.equivalenceMultipliers.map(({ numerator, denominator }) => [
      numerator,
      denominator
    ]),
    [[2n, 2n], [1n, 1n]]
  );
  assert.equal(Object.isFrozen(draft), true);
});

test("invalid factors targets denominators aliases and policy fail closed", () => {
  assert.throws(() => verifyKpCommonDenominatorAlignment(draft({
    equivalenceMultipliers: [
      {
        ...kpCanonicalCommonDenominatorAlignmentDraft
          .equivalenceMultipliers[0],
        denominator: 3n
      },
      kpCanonicalCommonDenominatorAlignmentDraft.equivalenceMultipliers[1]
    ]
  })), (error) => code(error) === "common-denominator.invalid-factor");
  assert.throws(() => verifyKpCommonDenominatorAlignment(draft({
    target: stateWithDenominator(7n)
  })), (error) => code(error) === "common-denominator.unaligned-target");
  assert.throws(() => verifyKpCommonDenominatorAlignment(draft({
    source: stateWithDenominator(0n, "source")
  })), (error) => code(error) === "common-denominator.invalid-denominator");
  assert.throws(() => verifyKpCommonDenominatorAlignment(draft({
    target: {
      ...kpCanonicalCommonDenominatorAlignmentDraft.target,
      operatorEntityId:
        kpCanonicalCommonDenominatorAlignmentDraft.source.operatorEntityId
    }
  })), (error) => code(error) === "common-denominator.entity-alias");
  assert.throws(() => verifyKpCommonDenominatorAlignment({
    ...draft(),
    durationMs: 700
  } as KpCommonDenominatorAlignmentDraft), (error) =>
    code(error) === "common-denominator.unexpected-field"
  );
  assert.equal(isKpVerifiedCommonDenominatorAlignment({
    ...kpCanonicalCommonDenominatorAlignment
  }), false);
});

test("alignment authority verifies exact term and expression value", () => {
  const verified = kpCanonicalCommonDenominatorAlignment;

  assert.equal(isKpVerifiedCommonDenominatorAlignment(verified), true);
  assert.deepEqual(
    verified.targetForms.map(({ numerator, denominator, value }) => [
      numerator,
      denominator,
      value.numerator,
      value.denominator
    ]),
    [[2n, 6n, 1n, 3n], [1n, 6n, 1n, 6n]]
  );
  assert.deepEqual(
    verified.equivalenceMultipliers.map(({ exactValue }) => [
      exactValue.numerator,
      exactValue.denominator
    ]),
    [[1n, 1n], [1n, 1n]]
  );
  assert.deepEqual(
    [verified.exactTotal.numerator, verified.exactTotal.denominator],
    [1n, 2n]
  );
  assert.equal(Object.isFrozen(verified), true);
  assert.equal(isKpCommonDenominatorProof(verified.proof), true);
  assert.equal(isKpCommonDenominatorProof({ ...verified.proof }), false);
});

function draft(overrides: Partial<KpCommonDenominatorAlignmentDraft> = {}) {
  return {
    ...kpCanonicalCommonDenominatorAlignmentDraft,
    ...overrides
  } as KpCommonDenominatorAlignmentDraft;
}

function stateWithDenominator(
  denominator: bigint,
  stage: "source" | "target" = "target"
) {
  const stateValue = kpCanonicalCommonDenominatorAlignmentDraft[stage];
  return {
    ...stateValue,
    terms: [
      {
        ...stateValue.terms[0],
        denominator: {
          ...stateValue.terms[0].denominator,
          value: denominator
        }
      },
      stateValue.terms[1]
    ]
  } as KpCommonDenominatorAlignmentDraft[typeof stage];
}

function code(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;
}

test("alignment preserves operator and untouched term by explicit identity", () => {
  const correspondence = kpCanonicalCommonDenominatorAlignment.correspondence;
  const byId = (id: string) => correspondence.find((item) => item.id === id)!;

  assert.deepEqual(byId("correspondence.common-denominator.operator"), {
    id: "correspondence.common-denominator.operator",
    relation: "identity",
    sourceEntityIds: [
      "entity.fraction.common-denominator.source.plus"
    ],
    targetEntityIds: [
      "entity.fraction.common-denominator.target.plus"
    ],
    summary: "The addition operator persists across denominator alignment."
  });
  assert.equal(
    byId("correspondence.common-denominator.first.term").relation,
    "equivalence"
  );
  assert.deepEqual(
    byId("correspondence.common-denominator.first.numerator").sourceEntityIds,
    [
      "entity.fraction.common-denominator.source.first.numerator",
      "entity.fraction.common-denominator.first.multiplier"
    ]
  );
  ["term", "fraction", "division", "numerator", "denominator"].forEach(
    (part) => assert.equal(
      byId(`correspondence.common-denominator.second.${part}`).relation,
      "identity"
    )
  );
  assert.deepEqual(
    byId("correspondence.common-denominator.first.factor").targetEntityIds,
    [
      "entity.fraction.common-denominator.target.first.numerator",
      "entity.fraction.common-denominator.target.first.denominator"
    ]
  );
});
