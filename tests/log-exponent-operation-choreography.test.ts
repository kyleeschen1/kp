import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalFunctionWrapChoreography,
  createKpCausalStructuralIntroductionChoreography,
  createKpSemanticRoleTransferChoreography
} from "../src/animation/equation-operation-choreography.ts";
import {
  kpCanonicalLogExponentSymbolMotionPlans
} from "../src/animation/log-exponent-symbol-motion.ts";
import {
  kpCanonicalLogExponentTransformationTree
} from "../src/semantic/log-exponent-transformation-tree.ts";

test("apply-log mints two synchronized branches from canonical wrap authority", () => {
  const plan = kpCanonicalLogExponentSymbolMotionPlans[0]!;
  const choreography = createKpCanonicalFunctionWrapChoreography({
    invocationGroup: plan.functionWrapInvocationGroup!,
    direction: "forward"
  });

  assert.equal(choreography.kind, "canonical-function-wrap");
  assert.equal(
    choreography.id,
    "operation-choreography.transformation.log-exponent.apply-log-both-sides.canonical-wrap.forward"
  );
  assert.equal(choreography.canonicalOperationId, "kp.core.wrap");
  assert.equal(choreography.motifId, "motif.function-wrap.v1");
  assert.equal(choreography.operationKind, "operation.wrap-function.v1");
  assert.equal(
    choreography.recipeId,
    "recipe.equation.function-application.v1"
  );
  assert.deepEqual(
    plan.functionWrapInvocationGroup?.branches.map(({ compiledInvocation }) =>
      compiledInvocation.compiledMotifPlan.roleBindings.map(({ roleId }) =>
        roleId
      )
    ),
    [
      ["argument", "function", "leading-enclosure", "trailing-enclosure"],
      ["argument", "function", "leading-enclosure", "trailing-enclosure"]
    ]
  );
  assert.deepEqual(choreography.branches.map(({ wrapperEntityIds }) =>
    wrapperEntityIds
  ), [
    [
      "logged.left.log",
      "logged.left.log.operator",
      "logged.left.log.open",
      "logged.left.log.close"
    ],
    ["logged.right.log", "logged.right.log.operator"]
  ]);
  assert.deepEqual(
    choreography.reception.branches.map(({ enclosureEntityRoles }) =>
      enclosureEntityRoles
    ),
    [
      [
        { entityId: "logged.left.log.open", side: "leading" },
        { entityId: "logged.left.log.close", side: "trailing" }
      ],
      []
    ]
  );
  assert.deepEqual(
    {
      argumentReflowWindow: choreography.argumentReflowWindow,
      wrapperEntryWindow: choreography.wrapperEntryWindow,
      receptionId: choreography.reception.id,
      synchronization: choreography.reception.synchronization
    },
    {
      argumentReflowWindow: { start: 0.04, end: 0.7 },
      wrapperEntryWindow: { start: 0.62, end: 0.92 },
      receptionId:
        "function-wrap-reception.transformation.log-exponent.apply-log-both-sides.forward",
      synchronization: "all-enclosures-together"
    }
  );
});

test("division authors a typed causal fraction structure entry", () => {
  const choreography = createKpCausalStructuralIntroductionChoreography({
    id: "operation-choreography.transformation.log-exponent.divide-by-log-base.structural-entry.forward",
    transformationId: "transformation.log-exponent.divide-by-log-base",
    direction: "forward",
    semanticEntityIds: ["solved.right"],
    entryWindow: { start: 0.62, end: 0.9 }
  });

  assert.equal(choreography.kind, "causal-structural-introduction");
  assert.deepEqual(choreography.semanticEntityIds, ["solved.right"]);
  assert.deepEqual(choreography.entryWindow, { start: 0.62, end: 0.9 });
});

test("power-law extraction promotes exponent movement to a typed role transfer", () => {
  const operation = kpCanonicalLogExponentTransformationTree.operations[1]!;
  const choreography = createKpSemanticRoleTransferChoreography({
    transformation: operation.transformation,
    direction: "forward",
    roleTransferRecordId: "correspondence.extract-exponent.unknown-x",
    sourceRetirementRecordIds: [
      "correspondence.extract-exponent.retire-log-enclosure",
      "correspondence.extract-exponent.retire-power-container"
    ],
    targetEntryRecordIds: [
      "correspondence.extract-exponent.introduce-product-container"
    ]
  });

  assert.equal(choreography.kind, "semantic-role-transfer");
  assert.equal(
    choreography.id,
    "operation-choreography.transformation.log-exponent.extract-exponent.semantic-role-transfer.forward"
  );
  assert.deepEqual(choreography.roleTransfer, {
    relationRecordId: "correspondence.extract-exponent.unknown-x",
    sourceEntityIds: ["logged.exponent"],
    targetEntityIds: ["extracted.coefficient"]
  });
  assert.ok(choreography.contextContinuants.some(({ relationRecordId }) =>
    relationRecordId === "correspondence.extract-exponent.base"
  ));
  assert.deepEqual(
    choreography.targetStructureEntries[0]?.targetEntityIds,
    ["extracted.left"]
  );
});
