import assert from "node:assert/strict";
import test from "node:test";

import { projectKpCanonicalExecutionLineage } from "../src/animation/canonical-operation-lineage-adapter.ts";
import type { KpCanonicalOperationExecutionResult } from "../src/semantic/transformation-definition-binding.ts";

function execution(
  relation: "persist" | "merge" | "split" | "introduction" | "removal",
  sources: readonly string[],
  targets: readonly string[]
): KpCanonicalOperationExecutionResult {
  return {
    kind: "canonical-operation-execution",
    transformationId: "transform.fixture",
    operationSpecId: `operation.${relation}`,
    roleBindings: {},
    lineageGraph: {
      kind: "semantic-lineage-graph",
      id: "lineage.fixture",
      sourceEntityIds: sources,
      targetEntityIds: targets,
      edges: [{
        id: `edge.${relation}`,
        relation,
        sourceEntityIds: sources,
        targetEntityIds: targets,
        summary: relation
      }]
    },
    correspondenceMap: { id: "correspondence.fixture", records: [] }
  };
}

test("canonical execution projects one-to-one lineage without visual evidence", () => {
  const result = projectKpCanonicalExecutionLineage(
    execution("persist", ["term.before"], ["term.after"])
  );

  assert.equal(result.groups[0]?.kind, "one-to-one");
  assert.deepEqual(result.groups[0]?.sourceEntityIds, ["term.before"]);
  assert.deepEqual(result.groups[0]?.targetEntityIds, ["term.after"]);
  assert.equal(result.groups[0]?.authority.operationSpecId, "operation.persist");
  assert.equal(JSON.stringify(result).includes("glyph"), false);
});

test("canonical execution preserves merge and split multiplicity", () => {
  const merge = projectKpCanonicalExecutionLineage(
    execution("merge", ["numerator.left", "numerator.right"], ["numerator.result"])
  );
  const split = projectKpCanonicalExecutionLineage(
    execution("split", ["root.branch"], ["root.positive", "root.negative"])
  );

  assert.equal(merge.groups[0]?.kind, "many-to-one");
  assert.equal(split.groups[0]?.kind, "one-to-many");
});

test("canonical execution preserves explicit introduction and removal", () => {
  assert.equal(
    projectKpCanonicalExecutionLineage(execution("introduction", [], ["new"])).groups[0]?.kind,
    "introduction"
  );
  assert.equal(
    projectKpCanonicalExecutionLineage(execution("removal", ["old"], [])).groups[0]?.kind,
    "removal"
  );
});

test("adapter rejects invalid or ambiguous canonical lineage", () => {
  const invalid = execution("persist", ["source"], ["target"]);
  (invalid.lineageGraph.edges as Array<unknown>).push({
    id: "edge.competing",
    relation: "persist",
    sourceEntityIds: ["source"],
    targetEntityIds: ["target"],
    summary: "competing"
  });

  assert.throws(
    () => projectKpCanonicalExecutionLineage(invalid),
    /competing lineage origins/
  );
});
