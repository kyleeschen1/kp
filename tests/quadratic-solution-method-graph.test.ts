import assert from "node:assert/strict";
import test from "node:test";

import { createCanonicalKpQuadraticSemanticFixture } from "../src/semantic/quadratic-branching-fixture.ts";
import { createCanonicalKpCompletingSquareAuthority } from "../src/semantic/quadratic-completing-square-authority.ts";
import { createCanonicalKpQuadraticFormulaAuthority } from "../src/semantic/quadratic-formula-authority.ts";
import {
  createCanonicalKpQuadraticSolutionMethodGraph,
  validateKpQuadraticSolutionMethodGraph,
  type KpQuadraticSolutionMethodGraph
} from "../src/semantic/quadratic-solution-method-graph.ts";

test("method graph has two explicit paths with one shared source and target", () => {
  const graph = canonicalGraph();
  assert.deepEqual(graph.paths.map(({ id }) => id), [
    "method.quadratic.completing-square",
    "method.quadratic.formula"
  ]);
  assert.ok(graph.paths.every(({ sourceNodeId }) => sourceNodeId === graph.sourceNodeId));
  assert.ok(graph.paths.every(({ targetNodeId }) => targetNodeId === graph.targetNodeId));
  assert.deepEqual(validateKpQuadraticSolutionMethodGraph(graph), []);
});

test("method-state ownership is explicit and disjoint", () => {
  const graph = canonicalGraph();
  const completing = graph.nodes.filter(
    ({ ownerMethodId }) => ownerMethodId === "method.quadratic.completing-square"
  );
  const formula = graph.nodes.filter(
    ({ ownerMethodId }) => ownerMethodId === "method.quadratic.formula"
  );
  assert.equal(completing.length, 3);
  assert.equal(formula.length, 4);
  assert.equal(graph.nodes.find(({ id }) => id === graph.sourceNodeId)?.ownerMethodId, undefined);
  assert.equal(graph.nodes.find(({ id }) => id === graph.targetNodeId)?.ownerMethodId, undefined);
});

test("each path is a closed deterministic dependency chain", () => {
  const graph = canonicalGraph();
  for (const path of graph.paths) {
    let cursor = path.sourceNodeId;
    for (const edgeId of path.edgeIds) {
      const edge = graph.edges.find(({ id }) => id === edgeId);
      assert.equal(edge?.sourceNodeId, cursor);
      assert.equal(edge?.methodId, path.id);
      assert.equal(edge?.relation, "same-solution-set");
      cursor = edge!.targetNodeId;
    }
    assert.equal(cursor, path.targetNodeId);
  }
});

test("validator diagnoses dependency gaps and cross-method ownership", () => {
  const graph = canonicalGraph();
  const formulaPath = graph.paths[1]!;
  const broken = {
    ...graph,
    paths: [
      graph.paths[0]!,
      { ...formulaPath, edgeIds: formulaPath.edgeIds.slice(1) }
    ],
    edges: graph.edges.map((edge, index) =>
      index === 0
        ? { ...edge, methodId: "method.quadratic.formula" as const }
        : edge
    )
  } as KpQuadraticSolutionMethodGraph;
  const codes = validateKpQuadraticSolutionMethodGraph(broken).map(({ code }) => code);
  assert.ok(codes.includes("method-ownership"));
  assert.ok(codes.includes("dependency-gap"));
});

test("validator rejects graph cycles without relying on display order", () => {
  const graph = canonicalGraph();
  const cycleEdge = {
    id: "edge.cycle",
    methodId: "method.quadratic.completing-square" as const,
    sourceNodeId: graph.targetNodeId,
    targetNodeId: graph.sourceNodeId,
    operationRef: "test.cycle",
    relation: "same-solution-set" as const
  };
  const broken = {
    ...graph,
    edges: [...graph.edges, cycleEdge]
  } as KpQuadraticSolutionMethodGraph;
  assert.ok(
    validateKpQuadraticSolutionMethodGraph(broken).some(({ code }) => code === "cycle")
  );
});

test("method graph is deeply immutable and JSON-stable", () => {
  const graph = canonicalGraph();
  assert.equal(Object.isFrozen(graph), true);
  assert.equal(Object.isFrozen(graph.nodes), true);
  assert.equal(Object.isFrozen(graph.edges), true);
  assert.equal(Object.isFrozen(graph.paths[0]?.edgeIds), true);
  assert.deepEqual(JSON.parse(JSON.stringify(graph)), graph);
});

function canonicalGraph() {
  const fixture = createCanonicalKpQuadraticSemanticFixture();
  return createCanonicalKpQuadraticSolutionMethodGraph({
    completingSquare: createCanonicalKpCompletingSquareAuthority(fixture),
    formula: createCanonicalKpQuadraticFormulaAuthority(fixture)
  });
}
