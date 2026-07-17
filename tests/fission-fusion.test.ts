import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpFissionFusionPlan,
  evaluateKpFissionFusionLaws,
  reverseKpFissionFusionPlan,
  sampleKpFissionFusion
} from "../src/animation/fission-fusion.ts";
import {
  createKpSemanticLineageGraph,
  type KpSemanticLineageGraph
} from "../src/semantic/semantic-lineage-graph.ts";

test("fission replaces one origin with all descendants in one semantic ownership event", () => {
  const plan = distributionPlan();
  const before = sampleKpFissionFusion({
    plan,
    progress: plan.transferEvent.progress - 0.001
  });
  const after = sampleKpFissionFusion({
    plan,
    progress: plan.transferEvent.progress
  });

  assert.deepEqual(before.ownership.ownerEntityIds, ["before.factor"]);
  assert.ok(before.sources.every((source) => source.opacity === 1 && source.scale > 0));
  assert.ok(before.targets.every((target) => target.opacity === 0));
  assert.deepEqual(
    after.ownership.ownerEntityIds,
    ["after.factor-left", "after.factor-right"]
  );
  assert.ok(after.sources.every((source) => source.opacity === 0 && !source.ownsMaterial));
  assert.ok(after.targets.every((target) => target.opacity === 1 && target.ownsMaterial));
  assert.equal(after.ownership.transferEventId, plan.transferEvent.id);
});

test("fission shares birth but micro-staggers branch departure in semantic order", () => {
  const plan = distributionPlan();
  const progress = plan.transferEvent.progress + plan.microStaggerSpan / 2;
  const frame = sampleKpFissionFusion({ plan, progress });
  const left = frame.targets.find((target) => target.entityId === "after.factor-left")!;
  const right = frame.targets.find((target) => target.entityId === "after.factor-right")!;

  assert.equal(left.opacity, 1);
  assert.equal(right.opacity, 1);
  assert.ok(left.pathProgress > right.pathProgress);
  assert.ok(left.scale > 0 && right.scale > 0);
  assert.deepEqual(plan.branches.map((branch) => branch.semanticRank), [0, 1]);
  assert.equal(new Set(plan.branches.map((branch) => branch.pathId)).size, 2);
});

test("fusion waits for every ordered origin before one shared replacement", () => {
  const plan = compileKpFissionFusionPlan({
    id: "motion.factor",
    mode: "fusion",
    lineageGraph: factoringLineage(),
    semanticOrder: ["before.factor-left", "before.factor-right"]
  });
  const before = sampleKpFissionFusion({
    plan,
    progress: plan.transferEvent.progress - 0.001
  });
  const after = sampleKpFissionFusion({
    plan,
    progress: plan.transferEvent.progress
  });

  assert.equal(before.allRequiredSourcesReady, true);
  assert.deepEqual(before.ownership.ownerEntityIds, [
    "before.factor-left",
    "before.factor-right"
  ]);
  assert.deepEqual(after.ownership.ownerEntityIds, ["after.factor"]);
  assert.ok(after.sources.every((source) => source.opacity === 0));
  assert.equal(after.targets[0]?.opacity, 1);
});

test("explicit reverse swaps semantic mode and endpoints without mechanical time reversal", () => {
  const fission = distributionPlan();
  const fusion = reverseKpFissionFusionPlan({
    id: "motion.factor.reverse",
    plan: fission
  });

  assert.equal(fusion.mode, "fusion");
  assert.equal(fusion.reverseOfPlanId, fission.id);
  assert.deepEqual(fusion.sourceEntityIds, fission.targetEntityIds);
  assert.deepEqual(fusion.targetEntityIds, fission.sourceEntityIds);
  assert.equal(fusion.reverseInterpretation, "split-origin");
  const explicitReverse = sampleKpFissionFusion({ plan: fusion, progress: 0.3 });
  const mechanicalReverse = sampleKpFissionFusion({ plan: fission, progress: 0.7 });
  assert.notDeepEqual(explicitReverse.phases, mechanicalReverse.phases);
  assert.deepEqual(evaluateKpFissionFusionLaws({ plan: fission, reversePlan: fusion }), []);
});

test("fission and fusion reject copy ownership, incomplete order, and zero material", () => {
  const copyGraph = createKpSemanticLineageGraph({
    id: "lineage.copy",
    sourceEntityIds: ["before.a"],
    targetEntityIds: ["after.a", "after.copy"],
    edges: [
      edge("persist", "persist", ["before.a"], ["after.a"]),
      edge("copy", "copy", ["before.a"], ["after.copy"])
    ]
  });
  assert.throws(
    () => compileKpFissionFusionPlan({
      id: "motion.copy-is-not-fission",
      mode: "fission",
      lineageGraph: copyGraph
    }),
    /requires one explicit split lineage edge/
  );
  assert.throws(
    () => compileKpFissionFusionPlan({
      id: "motion.bad-order",
      mode: "fission",
      lineageGraph: distributionLineage(),
      semanticOrder: ["after.factor-left"]
    }),
    /name every staggered entity exactly once/
  );
  assert.throws(
    () => compileKpFissionFusionPlan({
      id: "motion.zero-material",
      mode: "fission",
      lineageGraph: distributionLineage(),
      junctionScale: 0
    }),
    /greater than zero/
  );
});

function distributionPlan() {
  return compileKpFissionFusionPlan({
    id: "motion.distribute",
    mode: "fission",
    lineageGraph: distributionLineage(),
    semanticOrder: ["after.factor-left", "after.factor-right"]
  });
}

function distributionLineage(): KpSemanticLineageGraph {
  return createKpSemanticLineageGraph({
    id: "lineage.distribute",
    sourceEntityIds: ["before.factor"],
    targetEntityIds: ["after.factor-left", "after.factor-right"],
    edges: [edge(
      "split-factor",
      "split",
      ["before.factor"],
      ["after.factor-left", "after.factor-right"]
    )]
  });
}

function factoringLineage(): KpSemanticLineageGraph {
  return createKpSemanticLineageGraph({
    id: "lineage.factor",
    sourceEntityIds: ["before.factor-left", "before.factor-right"],
    targetEntityIds: ["after.factor"],
    edges: [edge(
      "merge-factors",
      "merge",
      ["before.factor-left", "before.factor-right"],
      ["after.factor"]
    )]
  });
}

function edge(
  id: string,
  relation: "persist" | "copy" | "split" | "merge",
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[]
) {
  return { id, relation, sourceEntityIds, targetEntityIds, summary: `${relation} lineage.` };
}
