import assert from "node:assert/strict";
import test from "node:test";

import { createKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import { findKpCanonicalOperationCoreDescriptor } from "../src/semantic/canonical-operation.ts";
import { createKpCanonicalOperationSpec } from "../src/semantic/canonical-operation-spec.ts";
import { executeKpCanonicalOperationBinding } from "../src/semantic/transformation-definition-binding.ts";

test("canonical wrap execution emits authoritative persistence and introduction lineage", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.wrap-x",
    transformType: "wrapFunction",
    title: "Wrap x with f",
    sourceObjectIds: ["equation.before"],
    targetObjectIds: ["equation.after"],
    preserves: ["identity", "value"]
  });
  const execution = executeKpCanonicalOperationBinding({
    transformation,
    operationSpec: wrapSpec(),
    roleBindings: {
      "content-before": "before.x",
      "content-after": "after.argument",
      wrapper: ["after.function", "after.left-paren", "after.right-paren"]
    }
  });

  assert.deepEqual(execution.lineageGraph.edges.map((edge) => edge.relation), [
    "persist",
    "introduction"
  ]);
  assert.deepEqual(execution.correspondenceMap.records.map((record) => record.relation), [
    "role-change",
    "artifact"
  ]);
  assert.deepEqual(execution.lineageGraph.edges[1]?.targetEntityIds, [
    "after.function",
    "after.left-paren",
    "after.right-paren"
  ]);
});

test("canonical operation binding enforces declared role cardinality", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.bad-wrap",
    transformType: "wrapFunction",
    title: "Bad wrap",
    sourceObjectIds: ["equation.before"],
    targetObjectIds: ["equation.after"],
    preserves: ["identity"]
  });
  assert.throws(() => executeKpCanonicalOperationBinding({
    transformation,
    operationSpec: wrapSpec(),
    roleBindings: {
      "content-before": [],
      "content-after": "after.argument",
      wrapper: "after.wrapper"
    }
  }), /content-before requires exactly-one/);
});

function wrapSpec() {
  const core = findKpCanonicalOperationCoreDescriptor("kp.core.wrap");
  return createKpCanonicalOperationSpec({
    id: "kp.core.wrap.binding-v1",
    pack: { packId: "kp.core", version: "1.0.0" },
    canonicalOperationId: core.id,
    title: "Wrap content",
    summary: core.summary,
    roles: core.roles,
    sourcePattern: {
      id: "wrap.source",
      rootRoleId: "content-before",
      requiredRoleIds: ["content-before"],
      summary: "Content before wrapping."
    },
    targetPattern: {
      id: "wrap.target",
      rootRoleId: "content-after",
      requiredRoleIds: ["content-after", "wrapper"],
      summary: "Content after wrapping."
    },
    invariants: [{
      id: "wrap.identity",
      kind: "preservation",
      roleIds: ["content-before", "content-after"],
      summary: "The argument persists."
    }],
    lineage: [
      {
        id: "argument-persists",
        relation: "role-change",
        sourceRoleIds: ["content-before"],
        targetRoleIds: ["content-after"],
        summary: "The argument moves into the wrapper."
      },
      {
        id: "wrapper-enters",
        relation: "artifact",
        sourceRoleIds: [],
        targetRoleIds: ["wrapper"],
        summary: "The wrapper is introduced around the argument."
      }
    ],
    motif: [{
      id: "wrap",
      primitiveId: "wrap",
      phaseId: "wrap",
      sourceRoleIds: ["content-before"],
      targetRoleIds: ["content-after", "wrapper"],
      summary: "Preserve then enclose."
    }],
    examples: [
      {
        id: "wrap.good",
        kind: "positive",
        roleBindings: {
          "content-before": "x",
          "content-after": "x",
          wrapper: "f"
        },
        expected: "accepted",
        summary: "Wrap x."
      },
      {
        id: "wrap.bad",
        kind: "counterexample",
        roleBindings: {
          "content-before": "x",
          "content-after": "y",
          wrapper: "f"
        },
        expected: "rejected",
        summary: "Replacing x violates persistence."
      }
    ],
    rewind: { operationId: "kp.core.unwrap", preservesPhaseIds: ["wrap"] },
    accessibility: (["full-motion", "reduced-motion", "static", "narrated"] as const).map(
      (mode) => ({ mode, preservesPhaseIds: ["wrap"], summary: `${mode} wrap.` })
    )
  });
}
