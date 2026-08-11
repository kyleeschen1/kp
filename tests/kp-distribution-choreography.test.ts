import assert from "node:assert/strict";
import test from "node:test";

import "../src/animation/fission-fusion-register.ts";

import {
  compileKpDistributionChoreography,
  constrainKpDistributionConnectorMotion,
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

test("product members share one settlement clock after cohesion lock", () => {
  const plan = distributionPlan();
  const branching = sampleKpDistributionChoreography({
    plan,
    progress: 0.5
  });
  assert.notEqual(
    branching.sourceFactor.pathProgress,
    branching.addendReflowProgress
  );
  const lock = sampleKpDistributionChoreography({
    plan,
    progress: 0.72
  });
  const settling = sampleKpDistributionChoreography({
    plan,
    progress: 0.83
  });
  const ready = sampleKpDistributionChoreography({
    plan,
    progress: 0.94
  });

  assert.equal(lock.productSettlementProgress, 0);
  assert.ok(settling.productSettlementProgress > 0);
  assert.ok(settling.productSettlementProgress < 1);
  assert.equal(ready.productSettlementProgress, 1);
  assert.equal(ready.sourceFactor.pathProgress, 1);
  assert.equal(ready.addendReflowProgress, 1);
  assert.deepEqual(
    sampleKpDistributionChoreography({ plan, progress: 0.83 }),
    settling
  );
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

test("distribution compiles target products by semantic index", () => {
  const plan = compileKpDistributionChoreography({
    id: "distribution.shuffled-addends",
    sourceFactorId: "source.factor",
    factorCopyIds: ["target.factor.0", "target.factor.1"],
    addendPairs: [
      {
        sourceId: "source.term.1",
        targetId: "target.term.1",
        semanticIndex: 1
      },
      {
        sourceId: "source.term.0",
        targetId: "target.term.0",
        semanticIndex: 0
      }
    ],
    connectorPairs: [{
      sourceId: "source.connector.0",
      targetId: "target.connector.0",
      semanticIndex: 0
    }],
    groupingArtifactIds: ["source.left-paren", "source.right-paren"]
  });

  assert.deepEqual(plan.productGroups.map((group) => [
    group.id,
    group.members.map((member) => member.memberId)
  ]), [
    [
      "distribution.shuffled-addends.product.1",
      ["target.factor.1", "target.term.1"]
    ],
    [
      "distribution.shuffled-addends.product.0",
      ["target.factor.0", "target.term.0"]
    ]
  ]);
  assert.deepEqual(plan.connectorPairs.map(({ motionConstraint }) =>
    motionConstraint
  ), ["follow-products-on-math-axis"]);
  assert.deepEqual(plan.operatorGroups.map(({ motionConstraint }) =>
    motionConstraint
  ), ["follow-products-on-math-axis"]);
});

test("distribution connectors stay horizontal and reject mismatched math axes", () => {
  assert.deepEqual(constrainKpDistributionConnectorMotion({
    constraint: "follow-products-on-math-axis",
    measuredDelta: { x: 42, y: 0.4 }
  }), { x: 42, y: 0 });
  assert.throws(() => constrainKpDistributionConnectorMotion({
    constraint: "follow-products-on-math-axis",
    measuredDelta: { x: 42, y: 1.25 }
  }), /disagree on their math axis/);
});

test("distribution groups arbitrary three-term and nested products", () => {
  const plan = compileKpDistributionChoreography({
    id: "distribution.three-nested-addends",
    sourceFactorId: "source.factor",
    factorCopyIds: [
      "target.factor.0",
      "target.factor.1",
      "target.factor.2"
    ],
    addendPairs: [
      {
        sourceId: "source.term.2",
        targetId: "target.term.2.nested",
        semanticIndex: 2
      },
      {
        sourceId: "source.term.0",
        targetId: "target.term.0",
        semanticIndex: 0
      },
      {
        sourceId: "source.term.1",
        targetId: "target.term.1.wide",
        semanticIndex: 1
      }
    ],
    connectorPairs: [
      {
        sourceId: "source.connector.0",
        targetId: "target.connector.0",
        semanticIndex: 0
      },
      {
        sourceId: "source.connector.1",
        targetId: "target.connector.1",
        semanticIndex: 1
      }
    ],
    groupingArtifactIds: ["source.left-paren", "source.right-paren"]
  });
  assert.equal(plan.productGroups.length, 3);
  assert.deepEqual(plan.operatorGroups.map((operator) => ({
    semanticIndex: operator.semanticIndex,
    left: operator.leftProductGroupId,
    right: operator.rightProductGroupId
  })), [
    {
      semanticIndex: 0,
      left: "distribution.three-nested-addends.product.0",
      right: "distribution.three-nested-addends.product.1"
    },
    {
      semanticIndex: 1,
      left: "distribution.three-nested-addends.product.1",
      right: "distribution.three-nested-addends.product.2"
    }
  ]);
  assert.deepEqual(
    plan.productGroups.map((group) => group.members[1]!.semanticEntityId),
    ["target.term.2.nested", "target.term.0", "target.term.1.wide"]
  );
  const ready = sampleKpDistributionChoreography({ plan, progress: 0.94 });
  assert.ok(ready.factorCopies.every((copy) => copy.pathProgress === 1));
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
