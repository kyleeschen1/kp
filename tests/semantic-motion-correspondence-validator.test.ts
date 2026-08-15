import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticMotionCompilerRequestV1,
  assertKpVerifiedSemanticMotionProvenance,
  isKpVerifiedSemanticMotionProvenance,
  kpSemanticMotionCompilerRequestSchemaVersion,
  validateKpSemanticMotionCorrespondenceAndProvenance,
  validateKpSemanticMotionEndpointsAndFrontier,
  type KpSemanticMotionCompilerRequestV1,
  type KpSemanticMotionEntityAuthorityV1,
  type KpSemanticMotionSourceAuthorityV1,
  type KpVerifiedSemanticMotionProvenance
} from "../src/domain-ir/public-api.ts";
import type { SelectorCorrespondenceRelationId } from
  "../src/semantic/correspondence.ts";

interface Shape {
  readonly id: string;
  readonly sourceIds: readonly string[];
  readonly targetIds: readonly string[];
  readonly relations: readonly {
    readonly id: string;
    readonly relation: SelectorCorrespondenceRelationId;
    readonly sourceIds: readonly string[];
    readonly targetIds: readonly string[];
  }[];
  readonly entities: readonly KpSemanticMotionEntityAuthorityV1[];
}

test("quotient fan-in, distribution fan-out, and cancellation all prove total provenance", () => {
  for (const shape of [quotientShape(), distributionShape(), cancellationShape()]) {
    const { request, source } = fixture(shape);
    const endpoints = validateKpSemanticMotionEndpointsAndFrontier({ request, source });
    assert.equal(endpoints.status, "verified", shape.id);
    if (endpoints.status !== "verified") continue;
    const result = validateKpSemanticMotionCorrespondenceAndProvenance({
      request,
      source,
      endpointFrontier: endpoints.endpointFrontier
    });
    assert.equal(result.status, "verified", shape.id);
    if (result.status !== "verified") continue;
    assert.equal(isKpVerifiedSemanticMotionProvenance(result.provenance), true);
    assert.equal(result.provenance.records.length, shape.relations.length);
  }
});

test("equal-looking glyphs cannot forge semantic identity", () => {
  const shape = cancellationShape();
  const rightInverseTargetId = "c.target.right-minus-three";
  const { request, source } = fixture({
    ...shape,
    entities: shape.entities.map((entity) =>
      entity.id === rightInverseTargetId
        ? {
            ...entity,
            // The visible label may still be -3; identity is decided only by
            // semantic authority, never glyph equality.
            semanticIdentityId: "identity.c.left-minus-three"
          }
        : entity
    )
  });
  const forgedRequest = {
    ...request,
    operation: {
      ...request.operation,
      correspondenceMap: {
        ...request.operation.correspondenceMap,
        records: request.operation.correspondenceMap.records.map((record) =>
          record.id === "right-inverse-persists"
            ? { ...record, sourceSelectorIds: ["c.source.left-minus-three"] }
            : record
        )
      }
    }
  };
  const endpoints = validateKpSemanticMotionEndpointsAndFrontier({
    request: forgedRequest,
    source
  });
  assert.equal(endpoints.status, "verified");
  if (endpoints.status !== "verified") return;
  const result = validateKpSemanticMotionCorrespondenceAndProvenance({
    request: forgedRequest,
    source,
    endpointFrontier: endpoints.endpointFrontier
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.ok(result.issues.some(({ code }) =>
    code === "semantic-motion.provenance.false-identity"
  ));
});

test("incomplete, foreign, and falsely derived correspondence fails closed", () => {
  const { request, source } = fixture(distributionShape());
  const malformed = {
    ...request,
    operation: {
      ...request.operation,
      correspondenceMap: {
        ...request.operation.correspondenceMap,
        records: request.operation.correspondenceMap.records
          .filter(({ id }) => id !== "right-addend-persists")
          .map((record, index) => index === 0
            ? { ...record, sourceSelectorIds: ["d.source.foreign"] }
            : record)
      }
    }
  };
  const endpoints = validateKpSemanticMotionEndpointsAndFrontier({
    request: malformed,
    source
  });
  assert.equal(endpoints.status, "verified");
  if (endpoints.status !== "verified") return;
  const result = validateKpSemanticMotionCorrespondenceAndProvenance({
    request: malformed,
    source,
    endpointFrontier: endpoints.endpointFrontier
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  const codes = new Set(result.issues.map(({ code }) => code));
  assert.equal(codes.has("semantic-motion.provenance.incomplete-lifecycle"), true);
  assert.equal(codes.has("semantic-motion.provenance.foreign-source"), true);
  assert.equal(codes.has("semantic-motion.provenance.missing-entity-authority"), true);
});

test("copied provenance certificates cannot enter the next compiler stage", () => {
  const { request, source } = fixture(quotientShape());
  const endpoints = validateKpSemanticMotionEndpointsAndFrontier({ request, source });
  assert.equal(endpoints.status, "verified");
  if (endpoints.status !== "verified") return;
  const result = validateKpSemanticMotionCorrespondenceAndProvenance({
    request,
    source,
    endpointFrontier: endpoints.endpointFrontier
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  const copied = structuredClone(result.provenance) as
    KpVerifiedSemanticMotionProvenance;
  assert.equal(isKpVerifiedSemanticMotionProvenance(copied), false);
  assert.throws(
    () => assertKpVerifiedSemanticMotionProvenance(copied),
    /original correspondence\/provenance validator authority/
  );
});

function fixture(shape: Shape): {
  readonly request: KpSemanticMotionCompilerRequestV1;
  readonly source: KpSemanticMotionSourceAuthorityV1;
} {
  const transformationId = `transform.${shape.id}`;
  const source: KpSemanticMotionSourceAuthorityV1 = {
    sourceId: `semantic.${shape.id}`,
    revisionId: "revision.1",
    assetIds: [`animation.${shape.id}`],
    states: [{
      id: `state.${shape.id}.source`,
      objectIds: [`object.${shape.id}.source`],
      entityIds: shape.sourceIds
    }, {
      id: `state.${shape.id}.target`,
      objectIds: [`object.${shape.id}.target`],
      entityIds: shape.targetIds
    }],
    entities: shape.entities
  };
  return {
    source,
    request: createKpSemanticMotionCompilerRequestV1({
      schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
      id: `request.${shape.id}`,
      assetId: `animation.${shape.id}`,
      semanticSource: {
        sourceId: source.sourceId,
        revisionId: source.revisionId,
        operationPacks: [{ packId: "kp.semantic-motion", version: "0.1.0" }]
      },
      sourceState: source.states[0]!,
      targetState: source.states[1]!,
      operation: {
        stepId: `step.${shape.id}`,
        transformationId,
        operationId: `kp.semantic-motion.${shape.id}`,
        roleBindings: { material: [...shape.sourceIds, ...shape.targetIds] },
        correspondenceMap: {
          id: `correspondence.${shape.id}`,
          records: shape.relations.map((relation) => ({
            id: relation.id,
            relation: relation.relation,
            sourceSelectorIds: relation.sourceIds,
            targetSelectorIds: relation.targetIds,
            summary: relation.id
          }))
        }
      },
      rewriteFrontier: {
        sourceEntityIds: shape.sourceIds,
        targetEntityIds: shape.targetIds,
        contextEntityIds: []
      },
      teachingIntent: {
        kind: "cause",
        primaryEntityIds: [...shape.sourceIds, ...shape.targetIds],
        secondaryEntityIds: [],
        summary: shape.id
      }
    })
  };
}

function quotientShape(): Shape {
  const transformationId = "transform.quotient";
  return {
    id: "quotient",
    sourceIds: ["q.source.ln-x", "q.source.ln-y"],
    targetIds: ["q.target.ln"],
    relations: [{
      id: "operators-fuse",
      relation: "fan-in",
      sourceIds: ["q.source.ln-x", "q.source.ln-y"],
      targetIds: ["q.target.ln"]
    }],
    entities: [
      authored("q.source.ln-x", "semantic.quotient"),
      authored("q.source.ln-y", "semantic.quotient"),
      derived("q.target.ln", ["q.source.ln-x", "q.source.ln-y"], transformationId)
    ]
  };
}

function distributionShape(): Shape {
  const transformationId = "transform.distribution";
  return {
    id: "distribution",
    sourceIds: ["d.source.factor", "d.source.b", "d.source.plus", "d.source.c"],
    targetIds: ["d.target.factor-left", "d.target.b", "d.target.plus", "d.target.factor-right", "d.target.c"],
    relations: [{
      id: "factor-fans-out",
      relation: "fan-out",
      sourceIds: ["d.source.factor"],
      targetIds: ["d.target.factor-left", "d.target.factor-right"]
    }, {
      id: "left-addend-persists",
      relation: "identity",
      sourceIds: ["d.source.b"],
      targetIds: ["d.target.b"]
    }, {
      id: "connector-persists",
      relation: "identity",
      sourceIds: ["d.source.plus"],
      targetIds: ["d.target.plus"]
    }, {
      id: "right-addend-persists",
      relation: "identity",
      sourceIds: ["d.source.c"],
      targetIds: ["d.target.c"]
    }],
    entities: [
      authored("d.source.factor", "semantic.distribution"),
      authored("d.source.b", "semantic.distribution", "identity.b"),
      authored("d.source.plus", "semantic.distribution", "identity.plus"),
      authored("d.source.c", "semantic.distribution", "identity.c"),
      derived("d.target.factor-left", ["d.source.factor"], transformationId),
      derived("d.target.factor-right", ["d.source.factor"], transformationId),
      successor("d.target.b", "d.source.b", "identity.b", transformationId),
      successor("d.target.plus", "d.source.plus", "identity.plus", transformationId),
      successor("d.target.c", "d.source.c", "identity.c", transformationId)
    ]
  };
}

function cancellationShape(): Shape {
  const transformationId = "transform.cancellation";
  return {
    id: "cancellation",
    sourceIds: ["c.source.x", "c.source.plus-three", "c.source.left-minus-three", "c.source.right-minus-three"],
    targetIds: ["c.target.x", "c.target.right-minus-three"],
    relations: [{
      id: "inverse-pair-cancels",
      relation: "cancelation",
      sourceIds: ["c.source.plus-three", "c.source.left-minus-three"],
      targetIds: []
    }, {
      id: "x-persists",
      relation: "identity",
      sourceIds: ["c.source.x"],
      targetIds: ["c.target.x"]
    }, {
      id: "right-inverse-persists",
      relation: "identity",
      sourceIds: ["c.source.right-minus-three"],
      targetIds: ["c.target.right-minus-three"]
    }],
    entities: [
      authored("c.source.x", "semantic.cancellation", "identity.x"),
      authored("c.source.plus-three", "semantic.cancellation", "identity.c.plus-three"),
      authored("c.source.left-minus-three", "semantic.cancellation", "identity.c.left-minus-three"),
      authored("c.source.right-minus-three", "semantic.cancellation", "identity.c.right-minus-three"),
      successor("c.target.x", "c.source.x", "identity.x", transformationId),
      successor("c.target.right-minus-three", "c.source.right-minus-three", "identity.c.right-minus-three", transformationId)
    ]
  };
}

function authored(
  id: string,
  sourceId: string,
  semanticIdentityId = `identity.${id}`
): KpSemanticMotionEntityAuthorityV1 {
  return { id, semanticIdentityId, provenance: { kind: "authored", sourceId } };
}

function successor(
  id: string,
  sourceEntityId: string,
  semanticIdentityId: string,
  transformationId: string
): KpSemanticMotionEntityAuthorityV1 {
  return {
    id,
    semanticIdentityId,
    provenance: {
      kind: "identity-successor",
      transformationId,
      sourceEntityIds: [sourceEntityId]
    }
  };
}

function derived(
  id: string,
  sourceEntityIds: readonly string[],
  transformationId: string
): KpSemanticMotionEntityAuthorityV1 {
  return {
    id,
    semanticIdentityId: `identity.${id}`,
    provenance: { kind: "derived", transformationId, sourceEntityIds }
  };
}
