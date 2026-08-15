import assert from "node:assert/strict";
import test from "node:test";

import golden from
  "./fixtures/semantic-motion-diagnostics.golden.json" with {
    type: "json"
  };
import {
  createKpSemanticMotionCompilerTraceV1,
  createKpSemanticMotionRepairPlanV1,
  kpSemanticMotionCompilerPhaseValues,
  kpSemanticMotionCompilerRequestLegacySchemaVersion,
  kpSemanticMotionCompilerRequestMigrationPatchSchemaVersion,
  kpSemanticMotionCompilerRequestSchemaVersion,
  KpSemanticMotionCompilerTraceError,
  migrateKpSemanticMotionCompilerRequestV1,
  type KpSemanticMotionCompilerIssueV1,
  type KpSemanticMotionCompilerRequestLegacyV0,
  type KpSemanticMotionCompilerRequestMigrationPatchV1
} from "../src/domain-ir/public-api.ts";
import {
  createQuotientSemanticMotionFixture
} from "./fixtures/semantic-motion-compiler-fixtures.ts";

const endpointIssue: KpSemanticMotionCompilerIssueV1 = {
  code: "semantic-motion.endpoint.source-revision",
  path: "$.semanticSource",
  message: "The request pins the wrong semantic revision."
};

test("compiler traces and repair plans match stable golden diagnostics", () => {
  const trace = createKpSemanticMotionCompilerTraceV1({
    requestId: "request.log-quotient",
    steps: [{ phase: "request", status: "passed" }, {
      phase: "endpoint-frontier",
      status: "failed",
      issues: [endpointIssue],
      repairTargets: [{
        kind: "semantic-state",
        targetId: "semantic.log-quotient"
      }]
    }]
  });
  const repairPlan = createKpSemanticMotionRepairPlanV1({
    requestId: "request.log-quotient",
    issues: [endpointIssue, {
      code: "semantic-motion.frontier.incomplete-target",
      path: "$.rewriteFrontier.targetEntityIds",
      message: "The exact target endpoint is not covered."
    }],
    repairTargets: [{
      kind: "semantic-state",
      targetId: "semantic.log-quotient"
    }, {
      kind: "rewrite-frontier",
      targetId: "transform.log-difference-to-quotient"
    }]
  });

  assert.deepEqual({ trace, repairPlan }, golden);
  assert.equal(trace.steps.length, kpSemanticMotionCompilerPhaseValues.length);
  assert.doesNotMatch(JSON.stringify({ trace, repairPlan }),
    /domSelector|rendererPrivate|geometry|durationMs|easing/);
});

test("trace construction rejects out-of-order and post-failure execution", () => {
  assert.throws(() => createKpSemanticMotionCompilerTraceV1({
    requestId: "request.invalid-order",
    steps: [{ phase: "endpoint-frontier", status: "passed" }]
  }), KpSemanticMotionCompilerTraceError);
  assert.throws(() => createKpSemanticMotionCompilerTraceV1({
    requestId: "request.post-failure",
    steps: [{
      phase: "request",
      status: "failed",
      issues: [endpointIssue]
    }, {
      phase: "endpoint-frontier",
      status: "passed"
    }]
  }), KpSemanticMotionCompilerTraceError);
});

test("v0 requests migrate only through an exact explicit patch", () => {
  const current = createQuotientSemanticMotionFixture().request;
  const { teachingIntent, ...common } = current;
  const legacy: KpSemanticMotionCompilerRequestLegacyV0 = {
    ...common,
    schemaVersion: kpSemanticMotionCompilerRequestLegacySchemaVersion,
    teachingIntent: {
      focusEntityIds: teachingIntent.primaryEntityIds,
      summary: teachingIntent.summary
    }
  };
  const patch: KpSemanticMotionCompilerRequestMigrationPatchV1 = {
    schemaVersion:
      kpSemanticMotionCompilerRequestMigrationPatchSchemaVersion,
    id: "migration.log-quotient.v0-to-v1",
    fromSchemaVersion:
      kpSemanticMotionCompilerRequestLegacySchemaVersion,
    toSchemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
    requestId: legacy.id,
    operation: {
      kind: "complete-teaching-intent",
      teachingKind: teachingIntent.kind,
      secondaryEntityIds: teachingIntent.secondaryEntityIds
    }
  };

  const result = migrateKpSemanticMotionCompilerRequestV1({
    document: legacy,
    patch
  });
  assert.equal(result.status, "migrated");
  if (result.status !== "migrated") return;
  assert.deepEqual(result.request, current);
  assert.equal(result.migrationId, patch.id);
});

test("current unknown missing and invalid migration cases fail explicitly", () => {
  const current = createQuotientSemanticMotionFixture().request;
  const currentResult = migrateKpSemanticMotionCompilerRequestV1({
    document: current
  });
  assert.equal(currentResult.status, "current");

  const unknown = migrateKpSemanticMotionCompilerRequestV1({
    document: { ...current, schemaVersion: "kp.request.v99" },
    patch: { replaceEverything: current }
  });
  assertRejected(unknown, "semantic-motion.schema.unknown-version");

  const { teachingIntent, ...common } = current;
  const legacy = {
    ...common,
    schemaVersion: kpSemanticMotionCompilerRequestLegacySchemaVersion,
    teachingIntent: {
      focusEntityIds: teachingIntent.primaryEntityIds,
      summary: teachingIntent.summary
    }
  };
  assertRejected(migrateKpSemanticMotionCompilerRequestV1({
    document: legacy
  }), "semantic-motion.schema.missing-patch");
  assertRejected(migrateKpSemanticMotionCompilerRequestV1({
    document: legacy,
    patch: {
      schemaVersion:
        kpSemanticMotionCompilerRequestMigrationPatchSchemaVersion,
      id: "migration.invalid",
      fromSchemaVersion:
        kpSemanticMotionCompilerRequestLegacySchemaVersion,
      toSchemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
      requestId: legacy.id,
      operation: {
        kind: "complete-teaching-intent",
        teachingKind: teachingIntent.kind,
        secondaryEntityIds: [],
        durationMs: 500
      }
    }
  }), "semantic-motion.schema.invalid-patch");
  assertRejected(migrateKpSemanticMotionCompilerRequestV1({
    document: { ...current, operation: null }
  }), "semantic-motion.schema.invalid-document");
  assertRejected(migrateKpSemanticMotionCompilerRequestV1({
    document: current,
    patch: {}
  }), "semantic-motion.schema.invalid-patch");
});

function assertRejected(
  result: ReturnType<typeof migrateKpSemanticMotionCompilerRequestV1>,
  code: KpSemanticMotionCompilerIssueV1["code"]
): void {
  assert.equal(result.status, "rejected");
  if (result.status === "rejected") assert.equal(result.issue.code, code);
}
