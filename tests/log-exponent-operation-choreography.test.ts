import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpLogExponentAnimationAsset
} from "../src/animation/log-exponent-adapter.ts";
import {
  createKpCausalStructuralIntroductionChoreography
} from "../src/animation/equation-operation-choreography.ts";
import {
  compileKpEquationOperationChoreography
} from "../src/reader/renderers/equation-operation-choreography-compiler.ts";

test("apply-log mints one synchronized balanced wrapper choreography", () => {
  const animation = createKpLogExponentAnimationAsset();
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "applyNaturalLogBothSides"
  );
  assert.ok(transformation);
  const choreography = compileKpEquationOperationChoreography({
    animation,
    transformation,
    motifKind: "append-after-shift",
    direction: "forward",
    balancedIntroductionEntryWindow: { start: 0.78, end: 0.98 }
  });

  assert.equal(choreography?.kind, "synchronized-balanced-introduction");
  if (choreography?.kind !== "synchronized-balanced-introduction") return;
  assert.equal(choreography.branchSchedule.strategy.kind, "together");
  assert.deepEqual(choreography.entryWindow, { start: 0.78, end: 0.98 });
  assert.deepEqual([...choreography.semanticEntityIds].sort(), [
    "logged.left.log",
    "logged.right.log"
  ]);
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
