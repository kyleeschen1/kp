import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKpCodeSettlementExceptionScope,
  mintKpCodeSettlementException,
  resolveKpCodeSettlementExceptionPolicy,
  type KpVerifiedCodeSettlementException
} from "../src/animation/code-motion-settlement-exceptions.ts";

const common = {
  transitionId: "transition.extract-helper",
  materialIds: ["token.rule", "token.threshold"],
  rationale: "The authored lesson names an intentional representational discontinuity."
} as const;

test("each closed exception kind relaxes one named law with a required outcome", () => {
  const cases = [
    [
      mintKpCodeSettlementException({
        ...common,
        id: "exception.cut",
        kind: "authored-cut",
        fromCheckpointId: "checkpoint.before",
        toCheckpointId: "checkpoint.after"
      }),
      { relaxedLaw: "continuous-transit", requiredOutcome: "target-native-owner" }
    ],
    [
      mintKpCodeSettlementException({
        ...common,
        id: "exception.delete",
        kind: "semantic-deletion",
        deletionOperationId: "operation.delete-duplicate"
      }),
      { relaxedLaw: "native-target-settlement", requiredOutcome: "semantic-absence" }
    ],
    [
      mintKpCodeSettlementException({
        ...common,
        id: "exception.dissolve",
        kind: "pedagogical-dissolve",
        recognitionCheckpointId: "checkpoint.duplicate-recognized"
      }),
      {
        relaxedLaw: "handoff-before-withdrawal",
        requiredOutcome: "recognized-context-withdrawal"
      }
    ],
    [
      mintKpCodeSettlementException({
        ...common,
        id: "exception.reduced",
        kind: "reduced-motion-endpoint-jump",
        mediaCondition: "prefers-reduced-motion: reduce"
      }),
      {
        relaxedLaw: "observable-intermediate-phases",
        requiredOutcome: "target-native-owner"
      }
    ]
  ] as const;

  for (const [exception, policy] of cases) {
    assert.deepEqual(resolveKpCodeSettlementExceptionPolicy(exception), policy);
    assert.ok(Object.isFrozen(exception));
    assert.ok(Object.isFrozen(exception.materialIds));
  }
});

test("exceptions are exact transition and material capabilities, not fallbacks", () => {
  const exception = mintKpCodeSettlementException({
    ...common,
    id: "exception.reduced",
    kind: "reduced-motion-endpoint-jump",
    mediaCondition: "prefers-reduced-motion: reduce"
  });
  assert.doesNotThrow(() => assertKpCodeSettlementExceptionScope({
    exception,
    transitionId: common.transitionId,
    materialIds: [...common.materialIds].reverse(),
    reducedMotion: true
  }));
  assert.throws(() => assertKpCodeSettlementExceptionScope({
    exception,
    transitionId: "transition.other",
    materialIds: common.materialIds,
    reducedMotion: true
  }), /cannot cross transitions/);
  assert.throws(() => assertKpCodeSettlementExceptionScope({
    exception,
    transitionId: common.transitionId,
    materialIds: ["token.rule"],
    reducedMotion: true
  }), /cannot cross material identity/);
  assert.throws(() => assertKpCodeSettlementExceptionScope({
    exception,
    transitionId: common.transitionId,
    materialIds: common.materialIds,
    reducedMotion: false
  }), /requires reduced motion/);
});

test("exception minting rejects incomplete or structurally forged authority", () => {
  assert.throws(() => mintKpCodeSettlementException({
    ...common,
    id: "exception.empty",
    kind: "semantic-deletion",
    materialIds: [],
    deletionOperationId: "operation.delete"
  }), /cannot be empty/);
  assert.throws(() => mintKpCodeSettlementException({
    ...common,
    id: "exception.duplicate",
    kind: "semantic-deletion",
    materialIds: ["token.rule", "token.rule"],
    deletionOperationId: "operation.delete"
  }), /must be unique/);

  const forged = {
    ...common,
    id: "exception.forged",
    kind: "pedagogical-dissolve",
    recognitionCheckpointId: "checkpoint.recognized"
  } as unknown as KpVerifiedCodeSettlementException;
  assert.throws(
    () => resolveKpCodeSettlementExceptionPolicy(forged),
    /must be minted/
  );
});
