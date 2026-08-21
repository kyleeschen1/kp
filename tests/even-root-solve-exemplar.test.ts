import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEvenRootSolveExemplar,
  isKpVerifiedEvenRootSolveExemplar,
  kpCanonicalEvenRootSolveExemplar,
  restoreKpEvenRootSolveState
} from "../src/semantic/even-root-solve-exemplar.ts";
import {
  KP_INVERSE_POWER_OPERATION_AUTHORITY
} from "../src/semantic/inverse-power-operation.ts";
import {
  KP_ROOT_VALUE_EVALUATION_AUTHORITY,
  verifyKpRootValueEvaluation
} from "../src/semantic/root-value-evaluation.ts";

test("even-root exemplar has three exact reconstructible states", () => {
  const exemplar = kpCanonicalEvenRootSolveExemplar;
  assert.equal(isKpVerifiedEvenRootSolveExemplar(exemplar), true);
  assert.deepEqual(exemplar.stateIds, [
    "state.even-root.source",
    "state.even-root.radical-branches",
    "state.even-root.evaluated-branches"
  ]);
  assert.deepEqual(exemplar.states.map(({ latex }) => latex), [
    "x^2=9",
    "x=\\pm\\sqrt{9}",
    "x=\\pm3"
  ]);
  assert.deepEqual(exemplar.adjacency.map(({ operationAuthority }) =>
    operationAuthority), [
    KP_INVERSE_POWER_OPERATION_AUTHORITY,
    KP_ROOT_VALUE_EVALUATION_AUTHORITY
  ]);
});

test("radical construction and numeric evaluation remain separate operations", () => {
  const [inversion, evaluation] = kpCanonicalEvenRootSolveExemplar.operations;
  assert.equal(inversion.source.stateId, "state.even-root.source");
  assert.equal(inversion.target.stateId, "state.even-root.radical-branches");
  assert.equal(evaluation.sourceStateId, "state.even-root.radical-branches");
  assert.equal(evaluation.targetStateId, "state.even-root.evaluated-branches");
  assert.deepEqual(evaluation.rootValue, {
    index: 2,
    radicand: 9,
    value: 3,
    arithmeticEvidenceId: "evidence.arithmetic.three-squared-is-nine"
  });
});

test("plus and minus branch identity persists across evaluation", () => {
  const [, radical, evaluated] = kpCanonicalEvenRootSolveExemplar.states;
  assert.deepEqual(radical.branchIds, evaluated.branchIds);
  assert.deepEqual(radical.branches.map(({ branchId, solutionSemanticId }) => ({
    branchId,
    solutionSemanticId
  })), evaluated.branches.map(({ branchId, solutionSemanticId }) => ({
    branchId,
    solutionSemanticId
  })));
  assert.notEqual(
    radical.branches[0].representationEntityId,
    evaluated.branches[0].representationEntityId
  );
  assert.equal(new Set(evaluated.branchIds).size, 2);
});

test("direct restoration returns immutable state snapshots without replay", () => {
  const exemplar = createKpEvenRootSolveExemplar();
  assert.deepEqual(exemplar.restoration, {
    kind: "direct-immutable-state-lookup",
    stateIds: exemplar.stateIds,
    replayRequired: false
  });
  for (const [index, stateId] of exemplar.stateIds.entries()) {
    const restored = restoreKpEvenRootSolveState(exemplar, stateId);
    assert.equal(restored, exemplar.states[index]);
    assert.equal(Object.isFrozen(restored), true);
  }
  assert.throws(() => restoreKpEvenRootSolveState({ ...exemplar },
    "state.even-root.source"), /verified exemplar authority/u);
});

test("root evaluation rejects false arithmetic and branch aliasing", () => {
  const evaluation = kpCanonicalEvenRootSolveExemplar.operations[1];
  assert.throws(() => verifyKpRootValueEvaluation({
    ...evaluation,
    rootValue: { ...evaluation.rootValue, value: 4 }
  }), /does not satisfy/u);
  assert.throws(() => verifyKpRootValueEvaluation({
    ...evaluation,
    branchCorrespondence: [
      evaluation.branchCorrespondence[0],
      {
        ...evaluation.branchCorrespondence[1]!,
        targetEntityId: evaluation.branchCorrespondence[0].targetEntityId
      }
    ]
  }), /must be unique/u);
});

test("copied exemplar data cannot mint verification authority", () => {
  assert.equal(isKpVerifiedEvenRootSolveExemplar({
    ...kpCanonicalEvenRootSolveExemplar
  }), false);
});
