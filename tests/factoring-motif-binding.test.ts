import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKpFactorCommonTermMotifBinding,
  compileKpFactorCommonTermMotifBinding,
  type KpFactorCommonTermMotifRelation
} from "../src/animation/factoring-motif-binding.ts";

const factorRelation = Object.freeze({
  recordId: "relation.factor-x",
  relation: "fan-in",
  lifecycle: "merge",
  sourceSelectorIds: ["source.x.0", "source.x.1"],
  targetSelectorIds: ["target.x"]
}) satisfies KpFactorCommonTermMotifRelation;
const contextRelation = Object.freeze({
  recordId: "relation.coefficient-three",
  relation: "identity",
  lifecycle: "persist",
  sourceSelectorIds: ["source.three"],
  targetSelectorIds: ["target.three"]
}) satisfies KpFactorCommonTermMotifRelation;

function compile(overrides: Partial<Parameters<
  typeof compileKpFactorCommonTermMotifBinding
>[0]> = {}) {
  return compileKpFactorCommonTermMotifBinding({
    transitionId: "transition.factor-x",
    transformType: "factorCommonTerm",
    motifKind: "merge-fan-in",
    direction: "forward",
    semanticStatus: "ready",
    successorSynthesisCount: 0,
    relations: [contextRelation, factorRelation],
    ...overrides
  });
}

test("factor-common-term compiles one opaque simultaneous motif cohort", () => {
  assert.deepEqual(compile(), {
    kind: "factor-common-term-motif-binding",
    id: "transition.factor-x.factoring-choreography",
    operation: "factorCommonTerm",
    motif: "merge-fan-in",
    direction: "forward",
    relationRecordId: "relation.factor-x",
    lifecycle: "merge",
    factorCopyIds: ["source.x.0", "source.x.1"],
    commonFactorId: "target.x",
    contextCorrespondences: [{
      recordId: "relation.coefficient-three",
      sourceSelectorId: "source.three",
      targetSelectorId: "target.three"
    }],
    fusionPaintPolicy: "opaque-many-to-one",
    synchronization: "simultaneous",
    coefficientEvaluation: "deferred"
  });
});

test("rewind derives exact contributors from the reversed split lineage", () => {
  const rewind = compile({
    direction: "rewind",
    relations: [
      {
        ...contextRelation,
        sourceSelectorIds: contextRelation.targetSelectorIds,
        targetSelectorIds: contextRelation.sourceSelectorIds
      },
      {
        ...factorRelation,
        lifecycle: "split",
        sourceSelectorIds: factorRelation.targetSelectorIds,
        targetSelectorIds: factorRelation.sourceSelectorIds
      }
    ]
  });

  assert.equal(rewind?.lifecycle, "split");
  assert.deepEqual(rewind?.factorCopyIds, ["source.x.0", "source.x.1"]);
  assert.equal(rewind?.commonFactorId, "target.x");
});

test("factoring fails closed on motif, cohort, or arithmetic ambiguity", () => {
  assert.throws(() => compile({ motifKind: "copy-fan-out" }), /merge-fan-in/);
  assert.throws(() => compile({
    relations: [factorRelation, {
      ...factorRelation,
      recordId: "relation.evaluate-coefficients"
    }]
  }), /exactly one/);
  assert.throws(() => compile({
    relations: [factorRelation, {
      ...contextRelation,
      lifecycle: "merge",
      sourceSelectorIds: ["source.three", "source.two"]
    }]
  }), /exactly one/);
  assert.throws(
    () => compile({ successorSynthesisCount: 1 }),
    /defer coefficient evaluation/
  );
  assert.throws(() => compile({
    relations: [factorRelation, {
      ...contextRelation,
      lifecycle: "enter",
      sourceSelectorIds: []
    }]
  }), /must be a later beat/);
});

test("unrelated operations do not acquire the specialized factoring binding", () => {
  assert.equal(compile({ transformType: "collectLikeTerms" }), undefined);
});

test("the runtime trust boundary rejects detached or forged bindings", () => {
  const binding = compile()!;
  const input = {
    transitionId: "transition.factor-x",
    transformType: "factorCommonTerm",
    motifKind: "merge-fan-in",
    direction: "forward" as const,
    semanticStatus: "ready" as const,
    successorSynthesisCount: 0,
    relations: [contextRelation, factorRelation]
  };

  assert.equal(assertKpFactorCommonTermMotifBinding({
    ...input,
    binding
  }), binding);
  assert.throws(() => assertKpFactorCommonTermMotifBinding({
    ...input,
    binding: {
      ...binding,
      commonFactorId: "forged.x"
    }
  }), /detached motif binding/);
  assert.throws(() => assertKpFactorCommonTermMotifBinding({
    ...input,
    transitionId: "transition.collect",
    transformType: "collectLikeTerms",
    relations: [],
    binding
  }), /Non-factoring/);
});
