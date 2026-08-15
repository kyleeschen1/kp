import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticMotionCompilerRequestV1,
  kpSemanticMotionCompilerOutcomeSchemaVersion,
  kpSemanticMotionCompilerRequestSchemaVersion,
  type KpSemanticMotionCompilerOutcomeV1,
  type KpSemanticMotionCompilerRequestV1,
  type KpVerifiedSemanticMotionCompilation
} from "../src/domain-ir/public-api.ts";
import {
  assertKpVerifiedSemanticMotionCompilation,
  createKpSemanticMotionCompilerExplicitStatic,
  createKpSemanticMotionCompilerHumanReview,
  createKpSemanticMotionCompilerRepairRequired,
  isKpVerifiedSemanticMotionCompilation,
  mintKpSemanticMotionCompilerReady
} from "../src/domain-ir/semantic-motion-compiler-authority.ts";

function requestFixture(): KpSemanticMotionCompilerRequestV1 {
  return createKpSemanticMotionCompilerRequestV1({
    schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
    id: "request.log-quotient",
    assetId: "animation.log-quotient",
    semanticSource: {
      sourceId: "semantic.log-quotient",
      revisionId: "revision.1",
      operationPacks: [{ packId: "kp.semantic-motion", version: "0.1.0" }]
    },
    sourceState: {
      id: "state.log-difference",
      objectIds: ["equation.log-difference"],
      entityIds: ["source.ln-x", "source.ln-y", "source.x", "source.y"]
    },
    targetState: {
      id: "state.log-quotient",
      objectIds: ["equation.log-quotient"],
      entityIds: ["target.ln", "target.x", "target.y", "target.fraction-bar"]
    },
    operation: {
      stepId: "step.fuse-log-quotient",
      transformationId: "transform.log-difference-to-quotient",
      operationId: "kp.semantic-motion.log-quotient",
      roleBindings: {
        "source-operators": ["source.ln-x", "source.ln-y"],
        "source-arguments": ["source.x", "source.y"],
        "target-operator": ["target.ln"],
        "target-arguments": ["target.x", "target.y"]
      },
      correspondenceMap: {
        id: "correspondence.log-quotient",
        records: [{
          id: "arguments-change-role",
          relation: "role-change",
          sourceSelectorIds: ["source.x"],
          targetSelectorIds: ["target.x"],
          summary: "x persists as the quotient numerator."
        }]
      }
    },
    rewriteFrontier: {
      sourceEntityIds: ["source.ln-x", "source.ln-y", "source.x", "source.y"],
      targetEntityIds: ["target.ln", "target.x", "target.y", "target.fraction-bar"],
      contextEntityIds: []
    },
    teachingIntent: {
      kind: "transmit",
      primaryEntityIds: ["source.x", "source.y", "target.x", "target.y"],
      secondaryEntityIds: ["source.ln-x", "source.ln-y", "target.ln"],
      summary: "Show persistent arguments changing role while logarithm applications fuse."
    }
  });
}

test("the request is versioned, serializable, immutable, and strips presentation extras", () => {
  const raw = {
    ...requestFixture(),
    durationMs: 800,
    path: "M 0 0 L 1 1",
    domSelector: ".source-x"
  } as KpSemanticMotionCompilerRequestV1 & {
    durationMs: number;
    path: string;
    domSelector: string;
  };
  const request = createKpSemanticMotionCompilerRequestV1(raw);
  const serialized = JSON.stringify(request);
  const roundTrip = createKpSemanticMotionCompilerRequestV1(
    JSON.parse(serialized) as KpSemanticMotionCompilerRequestV1
  );

  assert.deepEqual(roundTrip, request);
  assert.equal(Object.isFrozen(request), true);
  assert.equal(Object.isFrozen(request.operation.correspondenceMap.records), true);
  assert.equal("durationMs" in request, false);
  assert.equal("path" in request, false);
  assert.equal("domSelector" in request, false);
});

test("all four compiler outcomes are explicit and exhaustively consumable", () => {
  const request = requestFixture();
  const outcomes: readonly KpSemanticMotionCompilerOutcomeV1[] = [
    mintKpSemanticMotionCompilerReady(request),
    createKpSemanticMotionCompilerRepairRequired({
      requestId: request.id,
      issues: [{
        code: "semantic-motion.structure.missing-role",
        path: "$.operation",
        message: "Missing role."
      }],
      repairTargets: [{ kind: "operation-binding", targetId: request.operation.stepId }]
    }),
    createKpSemanticMotionCompilerExplicitStatic({
      requestId: request.id,
      reason: "authored-static",
      staticStateId: request.targetState.id
    }),
    createKpSemanticMotionCompilerHumanReview({
      requestId: request.id,
      reason: "unreviewed-recipe",
      reviewTargetIds: [request.operation.operationId]
    })
  ];

  assert.deepEqual(outcomes.map(describeOutcome), [
    "ready",
    "repair-required",
    "explicit-static",
    "human-review"
  ]);
  assert.ok(outcomes.every(({ schemaVersion }) =>
    schemaVersion === kpSemanticMotionCompilerOutcomeSchemaVersion
  ));
  assert.deepEqual(
    JSON.parse(JSON.stringify(outcomes)).map((outcome: { status: string }) => outcome.status),
    outcomes.map(({ status }) => status)
  );
});

test("structural copies and forged compiler results cannot claim authority", () => {
  const ready = mintKpSemanticMotionCompilerReady(requestFixture());
  assert.equal(ready.status, "ready");
  if (ready.status !== "ready") return;

  assert.equal(isKpVerifiedSemanticMotionCompilation(ready.compilation), true);
  assert.doesNotThrow(() =>
    assertKpVerifiedSemanticMotionCompilation(ready.compilation)
  );

  const copy = structuredClone(ready.compilation) as
    KpVerifiedSemanticMotionCompilation;
  assert.equal(isKpVerifiedSemanticMotionCompilation(copy), false);
  assert.throws(
    () => assertKpVerifiedSemanticMotionCompilation(copy),
    /original compiler-minted compilation authority/
  );

  const forged = {
    ...ready.compilation,
    compilationId: "semantic-motion-compilation.forged"
  } as KpVerifiedSemanticMotionCompilation;
  assert.equal(isKpVerifiedSemanticMotionCompilation(forged), false);
});

function describeOutcome(outcome: KpSemanticMotionCompilerOutcomeV1): string {
  switch (outcome.status) {
    case "ready":
      return outcome.status;
    case "repair-required":
      return outcome.status;
    case "explicit-static":
      return outcome.status;
    case "human-review":
      return outcome.status;
    default:
      return assertNever(outcome);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected compiler outcome: ${String(value)}`);
}
