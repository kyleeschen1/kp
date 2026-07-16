import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticLineageGraph,
  validateKpSemanticLineageGraph,
  type KpSemanticLineageGraph
} from "../src/semantic/semantic-lineage-graph.ts";

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

function edge(
  id: string,
  relation: "persist" | "copy" | "split" | "merge" | "introduction" | "removal",
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[]
) {
  return { id, relation, sourceEntityIds, targetEntityIds, summary: `${relation} lineage.` };
}
