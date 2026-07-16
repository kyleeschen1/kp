import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpTransferableSalienceGraph,
  validateKpTransferableSalienceGraph,
  type KpTransferableSalienceGraph
} from "../src/animation/salience-graph.ts";
import {
  createKpSemanticLineageGraph
} from "../src/semantic/semantic-lineage-graph.ts";

const lineage = createKpSemanticLineageGraph({
  id: "lineage.copy",
  sourceEntityIds: ["factor"],
  targetEntityIds: ["factor", "left-factor", "right-factor"],
  edges: [
    {
      id: "lineage.factor.persist",
      relation: "persist",
      sourceEntityIds: ["factor"],
      targetEntityIds: ["factor"],
      summary: "The source remains visible."
    },
    {
      id: "lineage.factor.left-copy",
      relation: "copy",
      sourceEntityIds: ["factor"],
      targetEntityIds: ["left-factor"],
      summary: "The left copy descends from the factor."
    },
    {
      id: "lineage.factor.right-copy",
      relation: "copy",
      sourceEntityIds: ["factor"],
      targetEntityIds: ["right-factor"],
      summary: "The right copy descends from the factor."
    }
  ]
});

const graph: KpTransferableSalienceGraph = {
  id: "salience.distribution",
  kind: "transferable-salience-graph",
  nodes: [
    { id: "salience.source", entityIds: ["factor"], role: "source", readinessThreshold: 0 },
    { id: "salience.left", entityIds: ["left-factor"], role: "travelling", readinessThreshold: 0.45 },
    { id: "salience.right", entityIds: ["right-factor"], role: "travelling", readinessThreshold: 0.45 },
    { id: "salience.result", entityIds: ["expanded-product"], role: "reunification", readinessThreshold: 0.8 }
  ],
  edges: [
    {
      id: "salience.edge.left",
      sourceNodeId: "salience.source",
      targetNodeId: "salience.left",
      lineageEdgeId: "lineage.factor.left-copy",
      targetReadyAt: 0.45,
      sourceReleaseAt: 0.6,
      branchGroupId: "salience.branch.factor",
      branchWeight: 0.5
    },
    {
      id: "salience.edge.right",
      sourceNodeId: "salience.source",
      targetNodeId: "salience.right",
      lineageEdgeId: "lineage.factor.right-copy",
      targetReadyAt: 0.45,
      sourceReleaseAt: 0.6,
      branchGroupId: "salience.branch.factor",
      branchWeight: 0.5
    }
  ],
  branchGroups: [{
    id: "salience.branch.factor",
    edgeIds: ["salience.edge.left", "salience.edge.right"],
    reunificationNodeId: "salience.result",
    reunifyAt: 0.75
  }]
};

test("salience transfer follows semantic copy lineage with bounded branch weights", () => {
  assert.deepEqual(validateKpTransferableSalienceGraph(graph, lineage), []);
  const middle = sampleKpTransferableSalienceGraph(graph, 0.5);
  assert.ok(middle.nodeWeights["salience.source"]! > 0);
  assert.ok(middle.nodeWeights["salience.left"]! > 0);
  assert.ok(middle.nodeWeights["salience.right"]! > 0);
  assert.ok(middle.explanatoryEntityIds.includes("factor"));
});

test("handoff continuity keeps an explanatory entity salient at every sample", () => {
  for (let index = 0; index <= 100; index += 1) {
    const sample = sampleKpTransferableSalienceGraph(graph, index / 100);
    assert.ok(sample.explanatoryEntityIds.length > 0);
  }
  assert.deepEqual(
    sampleKpTransferableSalienceGraph(graph, 0.37),
    sampleKpTransferableSalienceGraph(graph, 0.37)
  );
  const end = sampleKpTransferableSalienceGraph(graph, 1);
  assert.equal(end.nodeWeights["salience.result"], 1);
  assert.equal(end.nodeWeights["salience.left"], 0);
  assert.equal(end.nodeWeights["salience.right"], 0);
  assert.deepEqual(end.explanatoryEntityIds, ["expanded-product"]);
});

test("source cannot release before its target crosses readiness", () => {
  const invalid = {
    ...graph,
    edges: graph.edges.map((edge) => ({
      ...edge,
      targetReadyAt: 0.7,
      sourceReleaseAt: 0.4
    }))
  };
  assert.deepEqual(
    validateKpTransferableSalienceGraph(invalid, lineage)
      .filter((issue) => issue.message.includes("before the target is ready"))
      .map((issue) => issue.path),
    ["edges[0]", "edges[1]"]
  );
});

test("visual branching without semantic lineage is rejected", () => {
  const invalid = {
    ...graph,
    edges: graph.edges.map((edge) => ({
      ...edge,
      lineageEdgeId: "lineage.factor.persist"
    }))
  };
  assert.deepEqual(
    validateKpTransferableSalienceGraph(invalid, lineage)
      .filter((issue) => issue.message.includes("authored split or copy"))
      .map((issue) => issue.path),
    ["branchGroups[0].edgeIds", "branchGroups[0].edgeIds"]
  );
});

test("branch weights must conserve one unit of salience", () => {
  const invalid = {
    ...graph,
    edges: graph.edges.map((edge) => ({ ...edge, branchWeight: 0.8 }))
  };
  assert.ok(
    validateKpTransferableSalienceGraph(invalid, lineage)
      .some((issue) => issue.message.includes("weights must sum to 1"))
  );
});
