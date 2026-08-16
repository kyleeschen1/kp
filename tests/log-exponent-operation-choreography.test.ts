import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalFunctionWrapChoreography,
  createKpCausalStructuralIntroductionChoreography
} from "../src/animation/equation-operation-choreography.ts";
import {
  kpCanonicalLogExponentSymbolMotionPlans
} from "../src/animation/log-exponent-symbol-motion.ts";

test("apply-log mints two synchronized branches from canonical wrap authority", () => {
  const plan = kpCanonicalLogExponentSymbolMotionPlans[0]!;
  const choreography = createKpCanonicalFunctionWrapChoreography({
    contract: plan.contract,
    motifId:
      "motif.transformation.log-exponent.apply-log-both-sides.canonical-wrap",
    direction: "forward"
  });

  assert.equal(choreography.kind, "canonical-function-wrap");
  assert.equal(choreography.canonicalOperationId, "kp.core.wrap");
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
  assert.ok(
    choreography.argumentReflowWindow.start <
      choreography.wrapperEntryWindow.start
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
