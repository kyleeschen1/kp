import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKpVerifiedSemanticMotionEndpointFrontier,
  createKpSemanticMotionCompilerRequestV1,
  isKpVerifiedSemanticMotionEndpointFrontier,
  kpSemanticMotionCompilerRequestSchemaVersion,
  validateKpSemanticMotionEndpointsAndFrontier,
  type KpSemanticMotionCompilerRequestV1,
  type KpSemanticMotionSourceAuthorityV1,
  type KpVerifiedSemanticMotionEndpointFrontier
} from "../src/domain-ir/public-api.ts";

const contextEntityId = "equation.equals";

function sourceFixture(): KpSemanticMotionSourceAuthorityV1 {
  return {
    sourceId: "semantic.log-quotient",
    revisionId: "revision.1",
    assetIds: ["animation.log-quotient"],
    states: [{
      id: "state.log-difference",
      objectIds: ["equation.log-difference"],
      entityIds: ["source.ln-x", "source.ln-y", "source.x", "source.y", contextEntityId]
    }, {
      id: "state.log-quotient",
      objectIds: ["equation.log-quotient"],
      entityIds: ["target.ln", "target.x", "target.y", "target.fraction-bar", contextEntityId]
    }],
    entities: [
      ...["source.ln-x", "source.ln-y", "source.x", "source.y", contextEntityId]
        .map((id) => ({
          id,
          semanticIdentityId: `identity.${id}`,
          provenance: { kind: "authored" as const, sourceId: "semantic.log-quotient" }
        })),
      ...["target.ln", "target.x", "target.y", "target.fraction-bar"]
        .map((id) => ({
          id,
          semanticIdentityId: `identity.${id}`,
          provenance: {
            kind: "introduced" as const,
            transformationId: "transform.log-difference-to-quotient"
          }
        }))
    ]
  };
}

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
    sourceState: sourceFixture().states[0]!,
    targetState: sourceFixture().states[1]!,
    operation: {
      stepId: "step.fuse-log-quotient",
      transformationId: "transform.log-difference-to-quotient",
      operationId: "kp.semantic-motion.log-quotient",
      roleBindings: {
        "source-arguments": ["source.x", "source.y"],
        "target-arguments": ["target.x", "target.y"]
      },
      correspondenceMap: {
        id: "correspondence.log-quotient",
        records: [{
          id: "x-role-change",
          relation: "role-change",
          sourceSelectorIds: ["source.x"],
          targetSelectorIds: ["target.x"],
          summary: "x becomes the numerator."
        }]
      }
    },
    rewriteFrontier: {
      sourceEntityIds: ["source.ln-x", "source.ln-y", "source.x", "source.y"],
      targetEntityIds: ["target.ln", "target.x", "target.y", "target.fraction-bar"],
      contextEntityIds: [contextEntityId]
    },
    teachingIntent: {
      kind: "transmit",
      primaryEntityIds: ["source.x", "source.y", "target.x", "target.y"],
      secondaryEntityIds: ["source.ln-x", "source.ln-y", "target.ln"],
      summary: "Follow the argument identities into the quotient."
    }
  });
}

test("exact authoritative endpoints and a total disjoint frontier mint authority", () => {
  const result = validateKpSemanticMotionEndpointsAndFrontier({
    request: requestFixture(),
    source: sourceFixture()
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  assert.equal(
    isKpVerifiedSemanticMotionEndpointFrontier(result.endpointFrontier),
    true
  );
  assert.doesNotThrow(() =>
    assertKpVerifiedSemanticMotionEndpointFrontier(result.endpointFrontier)
  );
  assert.deepEqual(result.endpointFrontier.contextEntityIds, [contextEntityId]);
});

test("wrong revisions, foreign assets, and endpoint drift fail closed", () => {
  const request = requestFixture();
  const result = validateKpSemanticMotionEndpointsAndFrontier({
    request: {
      ...request,
      assetId: "animation.foreign",
      semanticSource: { ...request.semanticSource, revisionId: "revision.stale" },
      sourceState: {
        ...request.sourceState,
        entityIds: [...request.sourceState.entityIds].reverse()
      }
    },
    source: sourceFixture()
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.deepEqual(new Set(result.issues.map(({ code }) => code)), new Set([
    "semantic-motion.endpoint.source-revision",
    "semantic-motion.endpoint.foreign-asset",
    "semantic-motion.endpoint.entity-mismatch"
  ]));
});

test("frontier validation rejects foreign, overlapping, duplicated, and uncovered entities", () => {
  const request = requestFixture();
  const result = validateKpSemanticMotionEndpointsAndFrontier({
    request: {
      ...request,
      rewriteFrontier: {
        sourceEntityIds: ["source.x", "source.x", "source.foreign", contextEntityId],
        targetEntityIds: ["target.x"],
        contextEntityIds: [contextEntityId, "context.foreign"]
      }
    },
    source: sourceFixture()
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  const codes = new Set(result.issues.map(({ code }) => code));
  ([
    "semantic-motion.frontier.duplicate",
    "semantic-motion.frontier.context-not-shared",
    "semantic-motion.frontier.overlap",
    "semantic-motion.frontier.foreign-source",
    "semantic-motion.frontier.incomplete-source",
    "semantic-motion.frontier.incomplete-target"
  ] as const).forEach((code) => assert.equal(codes.has(code), true, code));
});

test("serialized or structurally copied endpoint certificates lose authority", () => {
  const result = validateKpSemanticMotionEndpointsAndFrontier({
    request: requestFixture(),
    source: sourceFixture()
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  const copied = structuredClone(result.endpointFrontier) as
    KpVerifiedSemanticMotionEndpointFrontier;
  assert.equal(isKpVerifiedSemanticMotionEndpointFrontier(copied), false);
  assert.throws(
    () => assertKpVerifiedSemanticMotionEndpointFrontier(copied),
    /original endpoint\/frontier validator authority/
  );
});
