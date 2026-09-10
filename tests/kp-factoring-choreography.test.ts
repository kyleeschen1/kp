import assert from "node:assert/strict";
import test from "node:test";


import {
  compileKpFactoringChoreography,
  kpFactoringCompositionPolicy,
  sampleKpFactoringCopyFocus,
  sampleKpFactoringChoreography
} from "../src/animation/factoring-choreography.ts";
import {
  evaluateKpFissionFusionLaws,
  reverseKpFissionFusionPlan,
  sampleKpFissionFusion
} from "../src/animation/fission-fusion.ts";

test("factoring owns contact policy and releases emphasis only after material settlement", () => {
  const plan = factoringPlan();
  assert.equal(plan.composition, kpFactoringCompositionPolicy);
  assert.ok(Object.isFrozen(plan.composition));
  for (let i = 0; i <= 100; i++) {
    const frame = sampleKpFactoringChoreography({ plan, progress: i / 100 });
    if (frame.phases["release-factor-focus"] > 0) assert.equal(frame.commonFactor.scale, 1);
    assert.deepEqual(sampleKpFactoringCopyFocus(frame, 0).variables,
      sampleKpFactoringCopyFocus(frame, 0, "common-factor").variables);
  }
});

test("the receiving row settles before grouping reception and factor fusion", () => {
  const plan = factoringPlan();
  for (let i = 0; i <= 1000; i++) {
    const frame = sampleKpFactoringChoreography({ plan, progress: i / 1000 });
    assert.ok(frame.groupingReceptionProgress <= frame.addendCompactionProgress);
    assert.ok(frame.groupingReceptionProgress <= frame.groupingOpacity);
  }
  const early = sampleKpFactoringChoreography({ plan, progress: .72 });
  assert.equal(early.groupingOpacity, 1);
  assert.equal(early.groupingReceptionProgress, 1);
  assert.equal(sampleKpFactoringChoreography({ plan, progress: .40 }).addendCompactionProgress, 1);
  assert.equal(sampleKpFactoringChoreography({ plan, progress: .28 }).addendCompactionProgress, 0);
  assert.equal(sampleKpFactoringChoreography({ plan, progress: 1 }).groupingReceptionProgress, 1);
});

test("factoring previews repeated-factor focus before collection", () => {
  const preview = sampleKpFactoringChoreography({
    plan: factoringPlan(),
    progress: 0.18
  });
  assert.ok(preview.focusStrength > 0.9);
  assert.equal(preview.addendCompactionProgress, 0, "The row must not sweep through factors before departure clearance.");
  assert.equal(preview.groupingOpacity, 0);
  assert.equal(
    preview.factorCopies[0]!.pathProgress,
    preview.factorCopies[1]!.pathProgress
  );
});

test("factor copies collect simultaneously while retaining ownership", () => {
  const frame = sampleKpFactoringChoreography({
    plan: factoringPlan(),
    progress: 0.5
  });
  assert.equal(
    frame.factorCopies[0]!.pathProgress,
    frame.factorCopies[1]!.pathProgress
  );
  assert.equal(frame.factorCopies[0]!.opacity, 1);
  assert.equal(frame.factorCopies[1]!.opacity, 1);
  assert.equal(frame.commonFactor.opacity, 0);
  assert.equal(frame.fusion.ownership.ownerSide, "sources");
  assert.deepEqual(frame.factorCopies.map((copy) => copy.semanticIndex), [0, 1]);
});

test("factoring progress and opacity remain simultaneous through rewind", () => {
  const plan = factoringPlan();
  const rewind = reverseKpFissionFusionPlan({
    id: `${plan.fusionPlan.id}.rewind`,
    plan: plan.fusionPlan,
    semanticOrder: plan.factorCopyIds
  });
  assert.equal(plan.synchronization, "simultaneous");
  assert.equal(plan.fusionPlan.microStaggerSpan, 0);
  assert.equal(rewind.microStaggerSpan, 0);

  for (let index = 0; index <= 1_000; index += 1) {
    const progress = index / 1_000;
    const forward = sampleKpFactoringChoreography({ plan, progress });
    assert.equal(
      forward.factorCopies[0]!.pathProgress,
      forward.factorCopies[1]!.pathProgress
    );
    assert.equal(
      forward.factorCopies[0]!.opacity,
      forward.factorCopies[1]!.opacity
    );
    const reverseFrame = sampleKpFissionFusion({
      plan: rewind,
      progress
    });
    assert.equal(
      reverseFrame.targets[0]!.pathProgress,
      reverseFrame.targets[1]!.pathProgress
    );
    assert.equal(
      reverseFrame.targets[0]!.opacity,
      reverseFrame.targets[1]!.opacity
    );
  }
});

test("factoring waits for every origin before one shared semantic fusion", () => {
  const plan = factoringPlan();
  const before = sampleKpFactoringChoreography({
    plan,
    progress: plan.fusionPlan.transferEvent.progress - 0.001
  });
  const after = sampleKpFactoringChoreography({
    plan,
    progress: plan.fusionPlan.transferEvent.progress
  });
  assert.equal(before.fusion.allRequiredSourcesReady, true);
  assert.ok(before.factorCopies.every((copy) => copy.opacity === 1));
  assert.equal(before.commonFactor.opacity, 0);
  assert.ok(after.factorCopies.every((copy) => copy.opacity === 0));
  assert.equal(after.commonFactor.opacity, 1);
  assert.deepEqual(after.fusion.ownership.ownerEntityIds, [plan.commonFactorId]);
});

test("factoring declares distribution fission as an explicit semantic reverse", () => {
  const fusion = factoringPlan().fusionPlan;
  const distribution = reverseKpFissionFusionPlan({
    id: `${fusion.id}.distribution-reverse`,
    plan: fusion
  });
  assert.equal(distribution.mode, "fission");
  assert.equal(distribution.reverseOfPlanId, fusion.id);
  assert.deepEqual(distribution.sourceEntityIds, fusion.targetEntityIds);
  assert.deepEqual(distribution.targetEntityIds, fusion.sourceEntityIds);
  assert.deepEqual(
    evaluateKpFissionFusionLaws({ plan: fusion, reversePlan: distribution }),
    []
  );
});

test("grouping enters as products compact and settlement is exact", () => {
  const plan = factoringPlan();
  const grouping = sampleKpFactoringChoreography({ plan, progress: 0.68 });
  assert.ok(grouping.groupingOpacity > 0 && grouping.groupingOpacity < 1);
  assert.ok(grouping.addendCompactionProgress > 0.5);
  const settled = sampleKpFactoringChoreography({ plan, progress: 1 });
  assert.equal(settled.groupingOpacity, 1);
  assert.equal(settled.commonFactor.opacity, 1);
  assert.equal(settled.commonFactor.scale, 1);
  assert.ok(settled.factorCopies.every((copy) => copy.opacity === 0));
  assert.equal(settled.focusStrength, 0);
  assert.equal(settled.addendCompactionProgress, 1);
});

test("factoring rejects incomplete inverse-operation roles", () => {
  assert.throws(() => compileKpFactoringChoreography({
    id: "bad-factoring",
    factorCopyIds: ["source.factor.0", "source.factor.1"],
    commonFactorId: "target.factor",
    addendPairs: [{ sourceId: "source.term.0", targetId: "target.term.0", semanticIndex: 0 }],
    connectorPairs: [],
    groupingArtifactIds: ["target.left-paren", "target.right-paren"]
  }), /one addend pair per factor copy/);
});

function factoringPlan() {
  return compileKpFactoringChoreography({
    id: "factoring.ab-plus-ac",
    factorCopyIds: ["source.factor.0", "source.factor.1"],
    commonFactorId: "target.factor",
    addendPairs: [
      { sourceId: "source.term.0", targetId: "target.term.0", semanticIndex: 0 },
      { sourceId: "source.term.1", targetId: "target.term.1", semanticIndex: 1 }
    ],
    connectorPairs: [
      { sourceId: "source.connector.0", targetId: "target.connector.0", semanticIndex: 0 }
    ],
    groupingArtifactIds: ["target.left-paren", "target.right-paren"]
  });
}
