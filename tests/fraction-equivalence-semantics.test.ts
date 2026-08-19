import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpVerifiedFractionEquivalence,
  kpCanonicalFractionEquivalence,
  verifyKpFractionEquivalence,
  type KpFractionEquivalenceDraft
} from "../src/semantic/fraction-equivalence.ts";

test("canonical equivalence preserves material identity under one nonzero factor", () => {
  const verified = kpCanonicalFractionEquivalence;
  assert.equal(isKpVerifiedFractionEquivalence(verified), true);
  assert.deepEqual(verified.correspondence.map(({ id, relation }) => ({
    id,
    relation
  })), [{
    id: "correspondence.fraction-equivalence.fraction",
    relation: "equivalence"
  }, {
    id: "correspondence.fraction-equivalence.division",
    relation: "identity"
  }, {
    id: "correspondence.fraction-equivalence.numerator",
    relation: "identity"
  }, {
    id: "correspondence.fraction-equivalence.denominator",
    relation: "identity"
  }, {
    id: "correspondence.fraction-equivalence.factor",
    relation: "copy"
  }, {
    id: "correspondence.fraction-equivalence.products",
    relation: "derivation"
  }]);
  const factor = verified.correspondence.find(({ relation }) =>
    relation === "copy"
  )!;
  assert.equal(factor.sourceEntityIds.length, 1);
  assert.equal(factor.targetEntityIds.length, 2);
  assert.deepEqual(verified.reverseLimits.requiredEvidenceIds, [
    verified.nonzeroEvidence.sourceDenominatorNonzeroEvidenceId,
    verified.nonzeroEvidence.scaleFactorNonzeroEvidenceId
  ]);
  assert.equal(Object.isFrozen(verified), true);
});

test("numeric symbolic and negative nonzero factors verify without CAS", () => {
  const corpus = [
    draft({ numerator: number(3, "numerator-three"),
      denominator: number(4, "denominator-four"),
      factor: number(2, "factor-two") }),
    draft({ numerator: symbol("x", "numerator-x"),
      denominator: symbol("y", "denominator-y"),
      factor: symbol("k", "factor-k") }),
    draft({ numerator: number(5, "numerator-five"),
      denominator: number(8, "denominator-eight"),
      factor: number(-3, "factor-negative-three") })
  ];
  corpus.forEach((entry) => assert.equal(
    isKpVerifiedFractionEquivalence(verifyKpFractionEquivalence(entry)),
    true
  ));
});

test("zero undefined aliases and invented policy fail closed", () => {
  assert.throws(() => verifyKpFractionEquivalence(draft({
    denominator: number(0, "denominator-zero")
  })), (error) => code(error) === "fraction-equivalence.zero-denominator");
  assert.throws(() => verifyKpFractionEquivalence(draft({
    factor: number(0, "factor-zero")
  })), (error) => code(error) === "fraction-equivalence.zero-factor");
  const alias = draft();
  assert.throws(() => verifyKpFractionEquivalence({
    ...alias,
    target: {
      ...alias.target,
      numeratorFactorOccurrenceEntityId:
        alias.target.denominatorFactorOccurrenceEntityId
    }
  }), (error) => code(error) === "fraction-equivalence.entity-alias");
  assert.throws(() => verifyKpFractionEquivalence({
    ...draft(),
    nonzeroEvidence: {
      sourceDenominatorNonzeroEvidenceId: "evidence.same",
      scaleFactorNonzeroEvidenceId: "evidence.same"
    }
  }), (error) => code(error) === "fraction-equivalence.evidence-alias");
  assert.throws(() => verifyKpFractionEquivalence({
    ...draft(),
    durationMs: 800
  } as KpFractionEquivalenceDraft), (error) =>
    code(error) === "fraction-equivalence.unexpected-field"
  );
});

test("plain structural lookalikes cannot mint verified authority", () => {
  assert.equal(isKpVerifiedFractionEquivalence({
    ...kpCanonicalFractionEquivalence
  }), false);
});

function draft(overrides: Readonly<{
  numerator?: KpFractionEquivalenceDraft["source"]["numerator"];
  denominator?: KpFractionEquivalenceDraft["source"]["denominator"];
  factor?: KpFractionEquivalenceDraft["factor"];
}> = {}): KpFractionEquivalenceDraft {
  return {
    schemaVersion: "kp.fraction-equivalence.v1",
    id: "transformation.fraction-equivalence.test",
    operationAuthority: "operation.equation.fraction-equivalence.v1",
    lawAuthority: {
      id: "law.fraction.scale-by-nonzero-unity",
      authorityRefId: "definition.fraction.test",
      level: "strict"
    },
    source: {
      stateId: "state.fraction.test.source",
      fractionEntityId: "entity.fraction.test.source",
      divisionEntityId: "entity.fraction.test.source-division",
      numerator: overrides.numerator ?? symbol("a", "numerator-a"),
      denominator: overrides.denominator ?? symbol("b", "denominator-b")
    },
    factor: overrides.factor ?? number(2, "factor-two"),
    target: {
      stateId: "state.fraction.test.target",
      fractionEntityId: "entity.fraction.test.target",
      divisionEntityId: "entity.fraction.test.target-division",
      numeratorProductEntityId: "entity.fraction.test.numerator-product",
      denominatorProductEntityId: "entity.fraction.test.denominator-product",
      numeratorSourceOccurrenceEntityId:
        "entity.fraction.test.numerator-source",
      numeratorFactorOccurrenceEntityId:
        "entity.fraction.test.numerator-factor",
      denominatorSourceOccurrenceEntityId:
        "entity.fraction.test.denominator-source",
      denominatorFactorOccurrenceEntityId:
        "entity.fraction.test.denominator-factor"
    },
    nonzeroEvidence: {
      sourceDenominatorNonzeroEvidenceId:
        "evidence.fraction.test.denominator-nonzero",
      scaleFactorNonzeroEvidenceId: "evidence.fraction.test.factor-nonzero"
    }
  };
}

function symbol(symbolValue: string, suffix: string) {
  return {
    kind: "symbol" as const,
    entityId: `entity.fraction.test.${suffix}`,
    semanticId: `semantic.fraction.test.${suffix}`,
    symbol: symbolValue
  };
}

function number(value: number, suffix: string) {
  return {
    kind: "number" as const,
    entityId: `entity.fraction.test.${suffix}`,
    semanticId: `semantic.fraction.test.${suffix}`,
    value
  };
}

function code(error: unknown): string | undefined {
  return error !== null && typeof error === "object" && "code" in error
    ? String(error.code)
    : undefined;
}
