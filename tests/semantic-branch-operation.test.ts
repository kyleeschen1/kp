import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticBranchOperation,
  orderedKpSemanticBranches
} from "../src/semantic/branch-operation.ts";

test("semantic branches retain stable identity and deterministic dependency order", () => {
  const operation = createKpSemanticBranchOperation({
    id: "operation.dependent",
    authorityId: "kp.algebra.dependent",
    branches: [
      { id: "lhs", entityIds: ["lhs.term"], dependsOnBranchIds: [] },
      { id: "rhs", entityIds: ["rhs.term"], dependsOnBranchIds: [] },
      {
        id: "settle",
        entityIds: ["result.term"],
        dependsOnBranchIds: ["lhs", "rhs"]
      }
    ]
  });

  assert.equal(operation.kind, "semantic-branch-operation");
  assert.equal(operation.authorityId, "kp.algebra.dependent");
  assert.deepEqual(
    orderedKpSemanticBranches(operation).map((branch) => branch.id),
    ["lhs", "rhs", "settle"]
  );
  assert.deepEqual(operation.branches[2]?.dependsOnBranchIds, ["lhs", "rhs"]);
});

test("semantic branch operations reject invalid identity and entity ownership", () => {
  assert.throws(() => createKpSemanticBranchOperation({
    id: "operation.duplicate-id",
    authorityId: "authority",
    branches: [
      { id: "same", entityIds: ["one"], dependsOnBranchIds: [] },
      { id: "same", entityIds: ["two"], dependsOnBranchIds: [] }
    ]
  }), /duplicates branch same/);
  assert.throws(() => createKpSemanticBranchOperation({
    id: "operation.empty-entity-set",
    authorityId: "authority",
    branches: [{ id: "only", entityIds: [], dependsOnBranchIds: [] }]
  }), /requires at least one entity/);
  assert.throws(() => createKpSemanticBranchOperation({
    id: "operation.duplicate-entity",
    authorityId: "authority",
    branches: [
      { id: "one", entityIds: ["shared"], dependsOnBranchIds: [] },
      { id: "two", entityIds: ["shared"], dependsOnBranchIds: [] }
    ]
  }), /assigns entity shared more than once/);
});

test("semantic branch operations reject invalid dependencies and cycles", () => {
  assert.throws(() => createKpSemanticBranchOperation({
    id: "operation.unknown",
    authorityId: "authority",
    branches: [{ id: "only", entityIds: ["one"], dependsOnBranchIds: ["missing"] }]
  }), /unknown branch missing/);
  assert.throws(() => createKpSemanticBranchOperation({
    id: "operation.self",
    authorityId: "authority",
    branches: [{ id: "only", entityIds: ["one"], dependsOnBranchIds: ["only"] }]
  }), /cannot depend on itself/);
  assert.throws(() => createKpSemanticBranchOperation({
    id: "operation.duplicate-dependency",
    authorityId: "authority",
    branches: [
      { id: "one", entityIds: ["one"], dependsOnBranchIds: [] },
      { id: "two", entityIds: ["two"], dependsOnBranchIds: ["one", "one"] }
    ]
  }), /duplicates dependency one/);
  assert.throws(() => createKpSemanticBranchOperation({
    id: "operation.cycle",
    authorityId: "authority",
    branches: [
      { id: "one", entityIds: ["one"], dependsOnBranchIds: ["two"] },
      { id: "two", entityIds: ["two"], dependsOnBranchIds: ["one"] }
    ]
  }), /dependency cycle/);
});
