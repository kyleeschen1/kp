import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSemanticMotionLifecycle,
  createKpSemanticMotionCompilerRequestV1,
  kpSemanticMotionCompilerRequestSchemaVersion,
  semanticMotionLifecycleFingerprint,
  validateKpSemanticMotionCorrespondenceAndProvenance,
  validateKpSemanticMotionEndpointsAndFrontier,
  validateKpSemanticMotionLifecycleTrace,
  type KpSemanticMotionCompilerRequestV1,
  type KpSemanticMotionLifecycleTrace,
  type KpSemanticMotionSourceAuthorityV1,
  type KpVerifiedSemanticMotionLifecycle
} from "../src/domain-ir/public-api.ts";

test("dense ownership samples preserve one owner and continuous semantic material", () => {
  const lifecycle = fixtureLifecycle();
  const trace = denseTrace(101);
  assert.deepEqual(
    validateKpSemanticMotionLifecycleTrace({ lifecycle, trace }),
    []
  );
});

test("salience can vary without changing lifecycle or paint ownership", () => {
  const lifecycle = fixtureLifecycle();
  const first = denseTrace(21, "source-first");
  const second = denseTrace(21, "target-first");
  assert.notDeepEqual(first.samples.map(({ salience }) => salience), second.samples.map(({ salience }) => salience));
  assert.equal(
    semanticMotionLifecycleFingerprint(first),
    semanticMotionLifecycleFingerprint(second)
  );
  assert.deepEqual(validateKpSemanticMotionLifecycleTrace({ lifecycle, trace: first }), []);
  assert.deepEqual(validateKpSemanticMotionLifecycleTrace({ lifecycle, trace: second }), []);
});

test("dual owners, visibility gaps, and opacity-routed presence fail closed", () => {
  const lifecycle = fixtureLifecycle();
  const valid = denseTrace(5);
  const samples = structuredClone(valid.samples);
  const transitIndices = samples
    .map(({ phase }, index) => phase === "transit" ? index : -1)
    .filter((index) => index >= 0);
  const blankIndex = transitIndices[0]!;
  const duplicateIndex = transitIndices[1]!;
  const malformed = {
    ...valid,
    opacity: 0,
    samples: samples.map((sample, index) => {
      if (index === blankIndex) {
        return {
          ...sample,
          material: [{
            ...sample.material[0]!,
            presentEntityIds: [],
            paintOwners: []
          }]
        };
      }
      if (index === duplicateIndex) {
        const material = sample.material[0]!;
        const entityId = material.presentEntityIds[0]!;
        return {
          ...sample,
          material: [{
            ...material,
            paintOwners: [
              ...material.paintOwners,
              { entityId, ownerId: "owner.duplicate" }
            ]
          }]
        };
      }
      return sample;
    })
  } as KpSemanticMotionLifecycleTrace;
  const codes = new Set(validateKpSemanticMotionLifecycleTrace({
    lifecycle,
    trace: malformed
  }).map(({ code }) => code));
  assert.equal(codes.has("semantic-motion.lifecycle.opacity-authority"), true);
  assert.equal(codes.has("semantic-motion.lifecycle.visibility-gap"), true);
  assert.equal(codes.has("semantic-motion.lifecycle.paint-owner"), true);
});

test("reduced motion exposes exact source and target native checkpoints only", () => {
  const lifecycle = fixtureLifecycle();
  const reduced: KpSemanticMotionLifecycleTrace = {
    mode: "reduced-motion",
    samples: [sampleAt(0, "source-native", "source-first"), sampleAt(1, "target-native", "target-first")]
  };
  assert.deepEqual(validateKpSemanticMotionLifecycleTrace({ lifecycle, trace: reduced }), []);
  const invalid = {
    ...reduced,
    samples: [reduced.samples[0]!, sampleAt(0.5, "transit", "source-first"), reduced.samples[1]!]
  };
  assert.ok(validateKpSemanticMotionLifecycleTrace({ lifecycle, trace: invalid })
    .some(({ code }) => code === "semantic-motion.lifecycle.trace-shape"));
});

function fixtureLifecycle(): KpVerifiedSemanticMotionLifecycle {
  const { request, source } = fixture();
  const endpoints = validateKpSemanticMotionEndpointsAndFrontier({ request, source });
  assert.equal(endpoints.status, "verified");
  if (endpoints.status !== "verified") throw new Error("Endpoint fixture failed.");
  const provenance = validateKpSemanticMotionCorrespondenceAndProvenance({
    request,
    source,
    endpointFrontier: endpoints.endpointFrontier
  });
  assert.equal(provenance.status, "verified");
  if (provenance.status !== "verified") throw new Error("Provenance fixture failed.");
  const lifecycle = compileKpSemanticMotionLifecycle({
    request,
    provenance: provenance.provenance
  });
  assert.equal(lifecycle.status, "verified");
  if (lifecycle.status !== "verified") throw new Error("Lifecycle fixture failed.");
  return lifecycle.lifecycle;
}

function fixture(): {
  readonly request: KpSemanticMotionCompilerRequestV1;
  readonly source: KpSemanticMotionSourceAuthorityV1;
} {
  const sourceEntityId = "source.x";
  const targetEntityId = "target.x";
  const transformationId = "transform.x-role-change";
  const source: KpSemanticMotionSourceAuthorityV1 = {
    sourceId: "semantic.x-role-change",
    revisionId: "revision.1",
    assetIds: ["animation.x-role-change"],
    states: [{
      id: "state.source",
      objectIds: ["object.source"],
      entityIds: [sourceEntityId]
    }, {
      id: "state.target",
      objectIds: ["object.target"],
      entityIds: [targetEntityId]
    }],
    entities: [{
      id: sourceEntityId,
      semanticIdentityId: "identity.x",
      provenance: { kind: "authored", sourceId: "semantic.x-role-change" }
    }, {
      id: targetEntityId,
      semanticIdentityId: "identity.x",
      provenance: {
        kind: "identity-successor",
        transformationId,
        sourceEntityIds: [sourceEntityId]
      }
    }]
  };
  return {
    source,
    request: createKpSemanticMotionCompilerRequestV1({
      schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
      id: "request.x-role-change",
      assetId: "animation.x-role-change",
      semanticSource: {
        sourceId: source.sourceId,
        revisionId: source.revisionId,
        operationPacks: [{ packId: "kp.semantic-motion", version: "0.1.0" }]
      },
      sourceState: source.states[0]!,
      targetState: source.states[1]!,
      operation: {
        stepId: "step.x-role-change",
        transformationId,
        operationId: "kp.semantic-motion.x-role-change",
        roleBindings: { source: [sourceEntityId], target: [targetEntityId] },
        correspondenceMap: {
          id: "correspondence.x-role-change",
          records: [{
            id: "x-persists",
            relation: "role-change",
            sourceSelectorIds: [sourceEntityId],
            targetSelectorIds: [targetEntityId],
            summary: "x persists into a new role."
          }]
        }
      },
      rewriteFrontier: {
        sourceEntityIds: [sourceEntityId],
        targetEntityIds: [targetEntityId],
        contextEntityIds: []
      },
      teachingIntent: {
        kind: "transmit",
        primaryEntityIds: [sourceEntityId, targetEntityId],
        secondaryEntityIds: [],
        summary: "Follow x."
      }
    })
  };
}

function denseTrace(
  count: number,
  salience: "source-first" | "target-first" = "source-first"
): KpSemanticMotionLifecycleTrace {
  return {
    mode: "animated",
    samples: Array.from({ length: count }, (_, index) => {
      const progress = index / (count - 1);
      const phase = progress === 0
        ? "source-native" as const
        : progress === 1
          ? "target-native" as const
          : "transit" as const;
      return sampleAt(progress, phase, salience);
    })
  };
}

function sampleAt(
  progress: number,
  phase: "source-native" | "transit" | "target-native",
  salience: "source-first" | "target-first"
): KpSemanticMotionLifecycleTrace["samples"][number] {
  const entityId = phase === "target-native" || (phase === "transit" && progress >= 0.5)
    ? "target.x"
    : "source.x";
  const role = salience === "source-first"
    ? progress < 0.5 ? "primary" as const : "secondary" as const
    : progress < 0.5 ? "secondary" as const : "primary" as const;
  return {
    progress,
    phase,
    material: [{
      correspondenceRecordId: "x-persists",
      presentEntityIds: [entityId],
      paintOwners: [{ entityId, ownerId: `paint.${entityId}` }]
    }],
    salience: [{ entityId, role }]
  };
}
