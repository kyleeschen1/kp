import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticLineageGraph,
  validateKpSemanticLineageGraph,
  type KpSemanticLineageGraph
} from "../src/semantic/semantic-lineage-graph.ts";
import {
  compileKpCopyFanOutChoreography,
  sampleKpCopyFanOutChoreography
} from "../src/animation/copy-fan-out-choreography.ts";

test("copy lineage preserves its source and names one independent descendant", () => {
  const graph = createKpSemanticLineageGraph({
    id: "lineage.copy-a",
    sourceEntityIds: ["before.a"],
    targetEntityIds: ["after.a", "after.a-copy"],
    edges: [
      edge("persist-a", "persist", ["before.a"], ["after.a"]),
      edge("copy-a", "copy", ["before.a"], ["after.a-copy"])
    ]
  });
  assert.deepEqual(graph.edges.map((item) => item.relation), ["persist", "copy"]);
});

test("split and merge preserve honest one-to-many and many-to-one multiplicity", () => {
  const split = createKpSemanticLineageGraph({
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
  const merge = createKpSemanticLineageGraph({
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
  assert.equal(split.edges[0]?.targetEntityIds.length, 2);
  assert.equal(merge.edges[0]?.sourceEntityIds.length, 2);
});

test("introduction and removal make source-free and target-free lifecycles explicit", () => {
  const graph = createKpSemanticLineageGraph({
    id: "lineage.wrapper-change",
    sourceEntityIds: ["before.old-wrapper"],
    targetEntityIds: ["after.new-wrapper"],
    edges: [
      edge("remove-wrapper", "removal", ["before.old-wrapper"], []),
      edge("introduce-wrapper", "introduction", [], ["after.new-wrapper"])
    ]
  });
  assert.deepEqual(graph.edges.map((item) => item.relation), ["removal", "introduction"]);
});

test("lineage laws reject fabricated fan-out, gaps, ambiguity, and copy without persistence", () => {
  const invalid: KpSemanticLineageGraph = {
    kind: "semantic-lineage-graph",
    id: "lineage.invalid",
    sourceEntityIds: ["before.a", "before.uncovered"],
    targetEntityIds: ["after.a", "after.uncovered"],
    edges: [
      edge("bad-split", "split", ["before.a"], ["after.a"]),
      edge("unpreserved-copy", "copy", ["before.a"], ["after.a"])
    ]
  };
  const codes = validateKpSemanticLineageGraph(invalid).map((issue) => issue.code);
  assert.ok(codes.includes("lineage.invalid-multiplicity"));
  assert.ok(codes.includes("lineage.incomplete-source"));
  assert.ok(codes.includes("lineage.incomplete-target"));
  assert.ok(codes.includes("lineage.ambiguous-target"));
  assert.ok(codes.includes("lineage.copy-without-persistence"));
});

test("non-persistence ancestry must be acyclic", () => {
  const graph: KpSemanticLineageGraph = {
    kind: "semantic-lineage-graph",
    id: "lineage.cycle",
    sourceEntityIds: ["a", "b"],
    targetEntityIds: ["a", "b"],
    edges: [
      edge("a-to-b", "copy", ["a"], ["b"]),
      edge("b-to-a", "copy", ["b"], ["a"]),
      edge("persist-a", "persist", ["a"], ["a"]),
      edge("persist-b", "persist", ["b"], ["b"])
    ]
  };
  assert.ok(validateKpSemanticLineageGraph(graph).some((issue) => issue.code === "lineage.cycle"));
});

test("copy choreography preserves its source and emits one lineage-bearing path per descendant", () => {
  const graph = createKpSemanticLineageGraph({
    id: "lineage.copy-choreography",
    sourceEntityIds: ["before.a"],
    targetEntityIds: ["after.a", "after.a-left", "after.a-right"],
    edges: [
      edge("persist-a", "persist", ["before.a"], ["after.a"]),
      edge("copy-a-left", "copy", ["before.a"], ["after.a-left"]),
      edge("copy-a-right", "copy", ["before.a"], ["after.a-right"])
    ]
  });
  const plan = compileKpCopyFanOutChoreography({
    id: "choreography.copy-a",
    lineageGraph: graph,
    sourceEntityId: "before.a"
  });

  assert.equal(plan.persistentTargetEntityId, "after.a");
  assert.deepEqual(plan.descendants.map((descendant) => [
    descendant.entityId,
    descendant.lineageEdgeId,
    descendant.branchIndex
  ]), [
    ["after.a-left", "copy-a-left", 0],
    ["after.a-right", "copy-a-right", 1]
  ]);
  assert.equal(new Set(plan.descendants.map((descendant) => descendant.pathId)).size, 2);
});

test("fan-out sampling contracts to a nonzero source and continuously transits independent descendants", () => {
  const graph = createKpSemanticLineageGraph({
    id: "lineage.fan-out-choreography",
    sourceEntityIds: ["before.factor"],
    targetEntityIds: ["after.factor-left", "after.factor-right"],
    edges: [edge(
      "split-factor",
      "split",
      ["before.factor"],
      ["after.factor-left", "after.factor-right"]
    )]
  });
  const plan = compileKpCopyFanOutChoreography({
    id: "choreography.fan-out-factor",
    lineageGraph: graph,
    sourceEntityId: "before.factor"
  });
  const frames = Array.from({ length: 101 }, (_value, index) =>
    sampleKpCopyFanOutChoreography({ plan, progress: index / 100 })
  );

  assert.equal(Math.min(...frames.map((frame) => frame.source.scale)), plan.sourceMinimumScale);
  assert.ok(frames.every((frame) => frame.source.opacity === 1 && frame.source.scale > 0));
  plan.descendants.forEach((descendant) => {
    const samples = frames.map((frame) => frame.descendants.find(
      (candidate) => candidate.pathId === descendant.pathId
    )!);
    assert.equal(samples[0]?.pathProgress, 0);
    assert.equal(samples.at(-1)?.pathProgress, 1);
    assert.ok(samples.every((sample, index) =>
      index === 0 || sample.pathProgress >= samples[index - 1]!.pathProgress
    ));
    assert.ok(samples.every((sample) => sample.pathId === descendant.pathId));
  });
});

test("copy and fan-out rewind mirrors the exact forward semantic frame", () => {
  const graph = createKpSemanticLineageGraph({
    id: "lineage.rewind-fan-out",
    sourceEntityIds: ["before.a"],
    targetEntityIds: ["after.left", "after.right"],
    edges: [edge("split-a", "split", ["before.a"], ["after.left", "after.right"])]
  });
  const plan = compileKpCopyFanOutChoreography({
    id: "choreography.rewind-fan-out",
    lineageGraph: graph,
    sourceEntityId: "before.a"
  });
  const forward = sampleKpCopyFanOutChoreography({ plan, progress: 0.27 });
  const rewind = sampleKpCopyFanOutChoreography({ plan, progress: 0.73, direction: "rewind" });

  assert.equal(forward.semanticProgress, rewind.semanticProgress);
  assert.deepEqual(forward.phases, rewind.phases);
  assert.deepEqual(forward.source, rewind.source);
  assert.deepEqual(forward.descendants, rewind.descendants);
});

test("copy choreography rejects invalid lineage, missing descendants, and zero source scale", () => {
  const invalidGraph: KpSemanticLineageGraph = {
    kind: "semantic-lineage-graph",
    id: "lineage.invalid-copy-plan",
    sourceEntityIds: ["before.a"],
    targetEntityIds: ["after.a"],
    edges: [edge("copy-a", "copy", ["before.a"], ["after.a"])]
  };
  assert.throws(
    () => compileKpCopyFanOutChoreography({
      id: "choreography.invalid",
      lineageGraph: invalidGraph,
      sourceEntityId: "before.a"
    }),
    /must preserve source entity/
  );

  const persistOnly = createKpSemanticLineageGraph({
    id: "lineage.persist-only",
    sourceEntityIds: ["before.a"],
    targetEntityIds: ["after.a"],
    edges: [edge("persist-a", "persist", ["before.a"], ["after.a"])]
  });
  assert.throws(
    () => compileKpCopyFanOutChoreography({
      id: "choreography.no-descendants",
      lineageGraph: persistOnly,
      sourceEntityId: "before.a"
    }),
    /no copy or split descendants/
  );
  assert.throws(
    () => compileKpCopyFanOutChoreography({
      id: "choreography.zero-scale",
      lineageGraph: createKpSemanticLineageGraph({
        id: "lineage.split-zero-scale",
        sourceEntityIds: ["before.a"],
        targetEntityIds: ["after.left", "after.right"],
        edges: [edge("split-a", "split", ["before.a"], ["after.left", "after.right"])]
      }),
      sourceEntityId: "before.a",
      sourceMinimumScale: 0
    }),
    /greater than zero/
  );
});

function edge(
  id: string,
  relation: "persist" | "copy" | "split" | "merge" | "introduction" | "removal",
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[]
) {
  return { id, relation, sourceEntityIds, targetEntityIds, summary: `${relation} lineage.` };
}
