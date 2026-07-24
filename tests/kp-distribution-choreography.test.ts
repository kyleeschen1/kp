import assert from "node:assert/strict";
import test from "node:test";

import "../src/animation/fission-fusion-register.ts";

import {
  compileKpDistributionChoreography,
  sampleKpDistributionChoreography
} from "../src/animation/distribution-choreography.ts";

test("distribution previews factor focus and addend reflow before copy transit", () => {
  const plan = distributionPlan();
  const preview = sampleKpDistributionChoreography({ plan, progress: 0.18 });
  assert.ok(preview.focusStrength > 0.9);
  assert.ok(preview.addendReflowProgress > 0);
  assert.ok(preview.sourceFactor.pathProgress > 0);
  assert.equal(preview.factorCopies[1]!.opacity, 0);
  assert.equal(preview.groupingOpacity, 1);
});

test("the lesson factor leads continuously before its follower peels away", () => {
  const frame = sampleKpDistributionChoreography({
    plan: distributionPlan(),
    progress: 0.5
  });
  assert.equal(frame.sourceFactor.opacity, 1);
  assert.equal(frame.sourceFactor.scale, 1);
  assert.ok(frame.sourceFactor.pathProgress > 0);
  assert.equal(frame.fission.ownership.ownerSide, "targets");
  assert.equal(frame.factorCopies[0]!.opacity, 0);
  assert.ok(frame.factorCopies[0]!.pathProgress > frame.factorCopies[1]!.pathProgress);
  assert.ok(frame.factorCopies[1]!.opacity > 0);
  assert.ok(frame.factorCopies[1]!.pathProgress > 0);
  assert.deepEqual(frame.factorCopies.map((copy) => copy.semanticIndex), [0, 1]);
  assert.equal(frame.groupingOpacity, 1);
});

test("grouping leaves after branching and native products settle exactly", () => {
  const plan = distributionPlan();
  const removal = sampleKpDistributionChoreography({ plan, progress: 0.68 });
  assert.equal(removal.sourceFactor.opacity, 1);
  assert.equal(removal.factorCopies[0]!.opacity, 0);
  assert.equal(removal.factorCopies[1]!.opacity, 1);
  assert.ok(removal.groupingOpacity > 0 && removal.groupingOpacity < 1);
  const settled = sampleKpDistributionChoreography({ plan, progress: 1 });
  assert.equal(settled.sourceFactor.opacity, 0);
  assert.ok(settled.sourceFactor.scale > 0);
  assert.equal(settled.groupingOpacity, 0);
  assert.ok(settled.factorCopies.every(
    (copy) => copy.opacity === 1 && copy.scale === 1 && copy.pathProgress === 1
  ));
  assert.equal(settled.focusStrength, 0);
});

test("distribution separates semantic ownership from continuous presentation ownership", () => {
  const plan = distributionPlan();
  const before = sampleKpDistributionChoreography({
    plan,
    progress: plan.fissionPlan.transferEvent.progress - 0.001
  });
  const after = sampleKpDistributionChoreography({
    plan,
    progress: plan.fissionPlan.transferEvent.progress
  });
  assert.equal(before.sourceFactor.opacity, 1);
  assert.ok(before.factorCopies.every((copy) => copy.opacity === 0));
  assert.equal(after.sourceFactor.opacity, 1);
  assert.equal(after.factorCopies[0]!.opacity, 0);
  assert.equal(after.factorCopies[1]!.opacity, 0);
  assert.deepEqual(after.fission.ownership.ownerEntityIds, plan.factorCopyIds);
});

test("distribution refuses incomplete operation roles", () => {
  assert.throws(() => compileKpDistributionChoreography({
    id: "bad-distribution",
    sourceFactorId: "source.factor",
    factorCopyIds: ["target.factor.0", "target.factor.1"],
    addendPairs: [{ sourceId: "source.term.0", targetId: "target.term.0", semanticIndex: 0 }],
    connectorPairs: [],
    groupingArtifactIds: ["source.left-paren", "source.right-paren"]
  }), /one addend pair per factor copy/);
});

function distributionPlan() {
  return compileKpDistributionChoreography({
    id: "distribution.a-over-b-plus-c",
    sourceFactorId: "source.factor",
    factorCopyIds: ["target.factor.0", "target.factor.1"],
    addendPairs: [
      { sourceId: "source.term.0", targetId: "target.term.0", semanticIndex: 0 },
      { sourceId: "source.term.1", targetId: "target.term.1", semanticIndex: 1 }
    ],
    connectorPairs: [
      { sourceId: "source.connector.0", targetId: "target.connector.0", semanticIndex: 0 }
    ],
    groupingArtifactIds: ["source.left-paren", "source.right-paren"]
  });
}
