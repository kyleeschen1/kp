import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalOperationSpec,
  validateKpCanonicalOperationSpec,
  type KpCanonicalOperationSpec
} from "../src/semantic/canonical-operation-spec.ts";
import { findKpCanonicalOperationCoreDescriptor } from "../src/semantic/canonical-operation.ts";

test("declarative wrap spec covers meaning, lineage, motif, examples, rewind, and accessibility", () => {
  const spec = wrapSpec();

  assert.equal(spec.schemaVersion, "kp.canonical-operation-spec.v1");
  assert.equal(spec.canonicalOperationId, "kp.core.wrap");
  assert.deepEqual(spec.pack, { packId: "kp.core", version: "1.0.0" });
  assert.deepEqual(spec.lineage.map((lineage) => lineage.relation), ["role-change", "artifact"]);
  assert.deepEqual(spec.motif.map((step) => step.primitiveId), ["persist", "wrap"]);
  assert.deepEqual(spec.examples.map((example) => example.kind), ["positive", "counterexample"]);
  assert.deepEqual(spec.accessibility.map((variant) => variant.mode), [
    "full-motion",
    "reduced-motion",
    "static",
    "narrated"
  ]);
  assert.deepEqual(validateKpCanonicalOperationSpec(spec), []);
});

test("operation specs reject missing roles, examples, phases, and renderer instructions", () => {
  const valid = wrapSpec();
  const invalid = {
    ...valid,
    sourcePattern: { ...valid.sourcePattern, rootRoleId: "missing" },
    invariants: [],
    examples: valid.examples.filter((example) => example.kind === "positive"),
    rewind: { ...valid.rewind, preservesPhaseIds: ["missing-phase"] },
    accessibility: valid.accessibility.filter((variant) => variant.mode !== "narrated"),
    coordinates: [{ x: 12, y: 14 }]
  } as KpCanonicalOperationSpec;
  const issues = validateKpCanonicalOperationSpec(invalid);

  assert.ok(issues.some((issue) => issue.message === "Unknown operation role missing."));
  assert.ok(issues.some((issue) => issue.message === "Operation spec must declare an invariant."));
  assert.ok(issues.some((issue) => issue.message === "Operation spec must include a counterexample."));
  assert.ok(issues.some((issue) => issue.message === "Unknown motif phase missing-phase."));
  assert.ok(issues.some((issue) => issue.message === "Operation spec is missing narrated."));
  assert.ok(issues.some((issue) => issue.message === "Renderer instruction coordinates is not allowed."));
});

function wrapSpec(): KpCanonicalOperationSpec {
  const core = findKpCanonicalOperationCoreDescriptor("kp.core.wrap");
  return createKpCanonicalOperationSpec({
    id: "kp.core.wrap.v1",
    pack: { packId: "kp.core", version: "1.0.0" },
    canonicalOperationId: core.id,
    title: "Wrap content",
    summary: core.summary,
    roles: core.roles,
    sourcePattern: {
      id: "wrap.source",
      rootRoleId: "content-before",
      requiredRoleIds: ["content-before"],
      summary: "Content before enclosure."
    },
    targetPattern: {
      id: "wrap.target",
      rootRoleId: "content-after",
      requiredRoleIds: ["content-after", "wrapper"],
      summary: "Persistent content and its wrapper."
    },
    invariants: [{
      id: "wrap.content-persists",
      kind: "preservation",
      roleIds: ["content-before", "content-after"],
      summary: "The wrapped content preserves semantic identity."
    }],
    lineage: [
      {
        id: "wrap.content-lineage",
        relation: "role-change",
        sourceRoleIds: ["content-before"],
        targetRoleIds: ["content-after"],
        summary: "Content becomes enclosed without replacement."
      },
      {
        id: "wrap.artifact-lineage",
        relation: "artifact",
        sourceRoleIds: [],
        targetRoleIds: ["wrapper"],
        summary: "Wrapper artifacts are introduced."
      }
    ],
    motif: [
      {
        id: "wrap.persist",
        primitiveId: "persist",
        phaseId: "establish-content",
        sourceRoleIds: ["content-before"],
        targetRoleIds: ["content-after"],
        summary: "Keep content continuously visible."
      },
      {
        id: "wrap.enclose",
        primitiveId: "wrap",
        phaseId: "introduce-wrapper",
        sourceRoleIds: [],
        targetRoleIds: ["wrapper"],
        summary: "Introduce enclosure around content."
      }
    ],
    examples: [
      {
        id: "wrap.positive",
        kind: "positive",
        roleBindings: {
          "content-before": "x",
          "content-after": "x",
          wrapper: "f( )"
        },
        expected: "accepted",
        summary: "Wrap x with f."
      },
      {
        id: "wrap.counterexample",
        kind: "counterexample",
        roleBindings: {
          "content-before": "x",
          "content-after": "y",
          wrapper: "f( )"
        },
        expected: "rejected",
        summary: "Replacing x with y does not preserve wrapped content."
      }
    ],
    rewind: {
      operationId: "kp.core.unwrap",
      preservesPhaseIds: ["establish-content", "introduce-wrapper"]
    },
    accessibility: ["full-motion", "reduced-motion", "static", "narrated"].map(
      (mode) => ({
        mode: mode as "full-motion" | "reduced-motion" | "static" | "narrated",
        preservesPhaseIds: ["establish-content", "introduce-wrapper"],
        summary: `${mode} preserves wrapping order.`
      })
    )
  });
}
