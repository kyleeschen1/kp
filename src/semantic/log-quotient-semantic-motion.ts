import {
  compileKpSemanticMotion,
  createKpSemanticMotionCompilerRequestV1,
  kpSemanticMotionCompilerRequestSchemaVersion,
  type KpCompiledSemanticMotionChoreography,
  type KpSemanticMotionEntityAuthorityV1,
  type KpSemanticMotionEventSpec,
  type KpSemanticMotionOperationStructureContract,
  type KpSemanticMotionPrecedenceSpec,
  type KpSemanticMotionSourceAuthorityV1
} from "../domain-ir/public-api.ts";
import type {
  SelectorCorrespondenceRecord
} from "./correspondence.ts";
import {
  listKpLogQuotientExpressionNodes,
  type KpLogQuotientExpressionNode,
  type KpLogQuotientSemanticId,
  type KpLogQuotientState
} from "./log-quotient-states.ts";
import {
  kpCanonicalCompiledLogQuotientOperation
} from "./log-quotient-transformation-compiler.ts";
import { kpLogQuotientAnimationId } from "./log-quotient-ids.ts";

const operation = kpCanonicalCompiledLogQuotientOperation;
const transformation = operation.transformation;
const correspondenceMap = transformation.correspondenceMap;
if (correspondenceMap === undefined) {
  throw new Error("Canonical log-quotient semantic motion requires correspondence authority.");
}

const sourceState = stateRef(operation.contract.source);
const targetState = stateRef(operation.contract.target);

export const kpCanonicalLogQuotientSemanticMotionSource = Object.freeze({
  sourceId: "semantic-source.log-quotient.difference-to-quotient",
  revisionId: "revision.log-quotient.semantic-motion.v1",
  assetIds: Object.freeze([kpLogQuotientAnimationId]),
  states: Object.freeze([sourceState, targetState]),
  entities: Object.freeze([
    ...listKpLogQuotientExpressionNodes(operation.contract.source).map((node) =>
      authoredEntity(node, "semantic-source.log-quotient.difference-to-quotient")
    ),
    ...listKpLogQuotientExpressionNodes(operation.contract.target).map((node) =>
      targetEntity(node, correspondenceMap.records)
    )
  ])
} satisfies KpSemanticMotionSourceAuthorityV1);

export const kpCanonicalLogQuotientSemanticMotionRequest =
  createKpSemanticMotionCompilerRequestV1({
    schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
    id: "request.log-quotient.difference-to-quotient.semantic-motion.v1",
    assetId: kpLogQuotientAnimationId,
    semanticSource: {
      sourceId: kpCanonicalLogQuotientSemanticMotionSource.sourceId,
      revisionId: kpCanonicalLogQuotientSemanticMotionSource.revisionId,
      operationPacks: [{ packId: "kp.semantic-motion", version: "0.1.0" }]
    },
    sourceState,
    targetState,
    operation: {
      stepId: "step.log-quotient.difference-to-quotient",
      transformationId: transformation.id,
      operationId: "kp.semantic-motion.quotient",
      roleBindings: {
        "source-operators": sourceIds(
          "semantic.log-quotient.wrapper.source-left.operator",
          "semantic.log-quotient.wrapper.source-right.operator"
        ),
        "source-arguments": sourceIds(
          "semantic.log-quotient.variable.x",
          "semantic.log-quotient.variable.y"
        ),
        "target-operator": targetIds(
          "semantic.log-quotient.wrapper.fused.operator"
        ),
        "target-arguments": targetIds(
          "semantic.log-quotient.variable.x",
          "semantic.log-quotient.variable.y"
        )
      },
      correspondenceMap
    },
    rewriteFrontier: {
      sourceEntityIds: sourceState.entityIds,
      targetEntityIds: targetState.entityIds,
      contextEntityIds: []
    },
    teachingIntent: {
      kind: "cause",
      primaryEntityIds: Object.freeze([
        ...sourceIds(
          "semantic.log-quotient.wrapper.source-left.operator",
          "semantic.log-quotient.wrapper.source-right.operator",
          "semantic.log-quotient.variable.x",
          "semantic.log-quotient.variable.y"
        ),
        ...targetIds(
          "semantic.log-quotient.wrapper.fused.operator",
          "semantic.log-quotient.variable.x",
          "semantic.log-quotient.variable.y"
        )
      ]),
      secondaryEntityIds: [],
      summary:
        "Show two logarithm applications fusing while their arguments take numerator and denominator roles."
    }
  });

export const kpCanonicalLogQuotientSemanticMotionStructure = Object.freeze({
  operationId: "kp.semantic-motion.quotient",
  roles: Object.freeze([
    role("source-operators", "one-or-more", "operator", "required"),
    role("source-arguments", "one-or-more", "material", "none"),
    role("target-operator", "exactly-one", "operator", "required"),
    role("target-arguments", "one-or-more", "material", "none")
  ]),
  cohorts: Object.freeze([{
    id: "cohort.quotient.operator-fusion",
    memberRoleIds: Object.freeze(["source-operators", "target-operator"]),
    cohesion: Object.freeze({
      scope: "family-local" as const,
      variantId: "log-application-fusion"
    })
  }, {
    id: "cohort.quotient.arguments",
    memberRoleIds: Object.freeze(["source-arguments", "target-arguments"]),
    cohesion: Object.freeze({
      scope: "family-local" as const,
      variantId: "quotient-argument-role-change"
    })
  }]),
  attachments: Object.freeze([{
    id: "attachment.source-operators",
    kind: "operator-argument" as const,
    anchorRoleIds: Object.freeze(["source-arguments"]),
    attachedRoleIds: Object.freeze(["source-operators"])
  }, {
    id: "attachment.target-operator",
    kind: "operator-argument" as const,
    anchorRoleIds: Object.freeze(["target-arguments"]),
    attachedRoleIds: Object.freeze(["target-operator"])
  }])
} satisfies KpSemanticMotionOperationStructureContract);

export const kpCanonicalLogQuotientSemanticMotionPrecedence =
  precedenceChain([
    event("event.log-quotient.orient", "orient", ["cohort.quotient.operator-fusion"]),
    event("event.log-quotient.clear-enclosures", "clearance", ["cohort.quotient.arguments"]),
    event("event.log-quotient.arguments-depart", "departure", ["cohort.quotient.arguments"]),
    event("event.log-quotient.arguments-arrive", "arrival", ["cohort.quotient.arguments"]),
    Object.freeze({
      id: "event.log-quotient.target-attachment",
      kind: "attachment" as const,
      cohortIds: Object.freeze([]),
      attachmentIds: Object.freeze(["attachment.target-operator"]),
      correspondenceRecordIds: Object.freeze([]),
      summary: "Attach the fused logarithm to the completed quotient argument."
    }),
    Object.freeze({
      id: "event.log-quotient.native-target-ready",
      kind: "native-target-ready" as const,
      cohortIds: Object.freeze([]),
      attachmentIds: Object.freeze([]),
      correspondenceRecordIds: Object.freeze([]),
      summary: "Transfer paint ownership to the settled native target."
    })
  ]);

const compiled = compileKpSemanticMotion({
  request: kpCanonicalLogQuotientSemanticMotionRequest,
  source: kpCanonicalLogQuotientSemanticMotionSource,
  structureContract: kpCanonicalLogQuotientSemanticMotionStructure,
  precedenceSpec: kpCanonicalLogQuotientSemanticMotionPrecedence
});

if (compiled.status !== "compiled") {
  throw new Error(
    `Canonical log-quotient semantic motion failed closed with ${compiled.status}.`
  );
}

export const kpCanonicalCompiledLogQuotientSemanticMotion:
  KpCompiledSemanticMotionChoreography = compiled.choreography;

function stateRef(state: KpLogQuotientState) {
  return Object.freeze({
    id: state.id,
    objectIds: Object.freeze([state.id]),
    entityIds: Object.freeze(
      listKpLogQuotientExpressionNodes(state).map(({ id }) => id)
    )
  });
}

function sourceIds(...semanticIds: readonly KpLogQuotientSemanticId[]): readonly string[] {
  return semanticIds.map((semanticId) => occurrence(operation.contract.source, semanticId));
}

function targetIds(...semanticIds: readonly KpLogQuotientSemanticId[]): readonly string[] {
  return semanticIds.map((semanticId) => occurrence(operation.contract.target, semanticId));
}

function occurrence(
  state: KpLogQuotientState,
  semanticId: KpLogQuotientSemanticId
): string {
  const matches = listKpLogQuotientExpressionNodes(state).filter(
    (node) => node.semanticId === semanticId
  );
  if (matches.length !== 1) {
    throw new Error(`${semanticId} must name exactly one ${state.id} occurrence.`);
  }
  return matches[0]!.id;
}

function authoredEntity(
  node: KpLogQuotientExpressionNode,
  sourceId: string
): KpSemanticMotionEntityAuthorityV1 {
  return Object.freeze({
    id: node.id,
    semanticIdentityId: node.semanticId,
    provenance: Object.freeze({ kind: "authored" as const, sourceId })
  });
}

function targetEntity(
  node: KpLogQuotientExpressionNode,
  records: readonly SelectorCorrespondenceRecord[]
): KpSemanticMotionEntityAuthorityV1 {
  const record = records.find(({ targetSelectorIds }) =>
    targetSelectorIds.includes(node.id)
  );
  if (record === undefined) {
    throw new Error(`Target entity ${node.id} has no correspondence provenance.`);
  }
  const transformationId = transformation.id;
  if (record.relation === "identity" || record.relation === "role-change") {
    const sourceId = record.sourceSelectorIds[0]!;
    const sourceNode = listKpLogQuotientExpressionNodes(operation.contract.source)
      .find(({ id }) => id === sourceId);
    if (sourceNode === undefined) {
      throw new Error(`Identity successor ${node.id} has no source ${sourceId}.`);
    }
    return Object.freeze({
      id: node.id,
      semanticIdentityId: sourceNode.semanticId,
      provenance: Object.freeze({
        kind: "identity-successor" as const,
        transformationId,
        sourceEntityIds: Object.freeze([sourceId] as const)
      })
    });
  }
  if (record.relation === "introduction") {
    return Object.freeze({
      id: node.id,
      semanticIdentityId: node.semanticId,
      provenance: Object.freeze({ kind: "introduced" as const, transformationId })
    });
  }
  return Object.freeze({
    id: node.id,
    semanticIdentityId: node.semanticId,
    provenance: Object.freeze({
      kind: "derived" as const,
      transformationId,
      sourceEntityIds: Object.freeze([...record.sourceSelectorIds])
    })
  });
}

function role(
  id: string,
  cardinality: "exactly-one" | "one-or-more",
  participation: "material" | "operator",
  attachment: "required" | "none"
) {
  return Object.freeze({ id, cardinality, participation, attachment });
}

function event(
  id: string,
  kind: KpSemanticMotionEventSpec["kind"],
  cohortIds: readonly string[]
): KpSemanticMotionEventSpec {
  return Object.freeze({
    id,
    kind,
    cohortIds: Object.freeze([...cohortIds]),
    attachmentIds: Object.freeze([]),
    correspondenceRecordIds: Object.freeze([]),
    summary: `${kind} log-quotient semantic material.`
  });
}

function precedenceChain(
  events: readonly KpSemanticMotionEventSpec[]
): KpSemanticMotionPrecedenceSpec {
  return Object.freeze({
    events: Object.freeze([...events]),
    edges: Object.freeze(events.slice(0, -1).map((current, index) =>
      Object.freeze({
        beforeEventId: current.id,
        afterEventId: events[index + 1]!.id
      })
    ))
  });
}
