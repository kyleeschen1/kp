import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { createKpLinearRearrangementChoreography } from "../src/animation/linear-rearrangement-choreography.ts";
import { createKpEquationLinearRearrangementBindings } from "../src/rendering/equation-linear-rearrangement-bindings.ts";

test("lightweight reader bindings preserve canonical choreography semantics", () => {
  const animation = createLinearSolveAnimationAsset();
  const lightweight = createKpEquationLinearRearrangementBindings(animation);
  const canonical = createKpLinearRearrangementChoreography(animation).steps;

  assert.deepEqual(
    lightweight.map((step) => ({
      transformationId: step.transformationId,
      kind: step.kind,
      branchOperationId: step.branchOperation?.id,
      branchOperationAuthorityId: step.branchOperation?.authorityId,
      branchIds: step.branchOperation?.branches.map((branch) => branch.id),
      branchWindows: step.branchSchedules === undefined
        ? undefined
        : Object.values(step.branchSchedules).map((schedule) => schedule.windows),
      branchStrategy: step.branchSchedule?.strategy.kind,
      successorSynthesisBinding: step.successorSynthesisBinding
    })),
    canonical.map((step) => ({
      transformationId: step.transformationId,
      kind: step.kind,
      branchOperationId: step.branchOperation?.id,
      branchOperationAuthorityId: step.branchOperation?.authorityId,
      branchIds: step.branchOperation?.branches.map((branch) => branch.id),
      branchWindows: step.branchSchedules === undefined
        ? undefined
        : Object.values(step.branchSchedules).map((schedule) => schedule.windows),
      branchStrategy: step.branchSchedule?.strategy.kind,
      successorSynthesisBinding: step.successorSynthesisBinding
    }))
  );

  const balanced = lightweight.find((step) => step.kind === "balanced-introduction")!;
  assert.equal(balanced.branchSchedule?.strategy.kind, "together");
  assert.deepEqual(Object.keys(balanced.branchSchedules ?? {}), [
    "together",
    "sequential",
    "staggered",
    "stepped"
  ]);
});
