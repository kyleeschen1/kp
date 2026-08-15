import {
  compileKpSemanticMotion,
  createKpSemanticMotionCompilerRequestV1,
  createKpSemanticMotionSourceAuthority,
  kpSemanticMotionCompilerRequestSchemaVersion,
  type KpCompiledSemanticMotionChoreography,
  type KpSemanticMotionEventSpec,
  type KpSemanticMotionOperationStructureContract,
  type KpSemanticMotionPrecedenceSpec
} from "../domain-ir/public-api.ts";
import {
  kpCanonicalDistributionPressureContract
} from "./distribution-pressure-contract.ts";

const contract = kpCanonicalDistributionPressureContract;
const operation = contract.operationExecution;
const sourceEntityIds = Object.freeze([
  contract.source.factorSelectorId,
  contract.source.groupingSelectorIds[0],
  contract.source.leftAddendSelectorId,
  contract.source.connectorSelectorId,
  contract.source.rightAddendSelectorId,
  contract.source.groupingSelectorIds[1]
]);
const targetEntityIds = Object.freeze([
  contract.target.leftFactorSelectorId,
  contract.target.leftAddendSelectorId,
  contract.target.connectorSelectorId,
  contract.target.rightFactorSelectorId,
  contract.target.rightAddendSelectorId
]);
const sourceState = Object.freeze({
  id: contract.source.objectId,
  objectIds: Object.freeze([contract.source.objectId]),
  entityIds: sourceEntityIds
});
const targetState = Object.freeze({
  id: contract.target.objectId,
  objectIds: Object.freeze([contract.target.objectId]),
  entityIds: targetEntityIds
});
const semanticIdentityIdByEntityId = Object.freeze(Object.fromEntries(
  [...sourceEntityIds, ...targetEntityIds].map((entityId) => [
    entityId,
    `semantic-identity.${entityId}`
  ])
));

export const kpCanonicalDistributionPressureSemanticMotionSource =
  createKpSemanticMotionSourceAuthority({
    sourceId: "semantic-source.distribution.expand-a-sum",
    revisionId: "revision.distribution.semantic-motion.v1",
    transformationId: operation.transformationId,
    assetIds: [contract.animationId],
    sourceState,
    targetState,
    correspondenceMap: operation.correspondenceMap,
    semanticIdentityIdByEntityId
  });

export const kpCanonicalDistributionPressureSemanticMotionRequest =
  createKpSemanticMotionCompilerRequestV1({
    schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
    id: "request.distribution.expand-a-sum.semantic-motion.v1",
    assetId: contract.animationId,
    semanticSource: {
      sourceId: kpCanonicalDistributionPressureSemanticMotionSource.sourceId,
      revisionId:
        kpCanonicalDistributionPressureSemanticMotionSource.revisionId,
      operationPacks: [{ packId: "kp.semantic-motion", version: "0.1.0" }]
    },
    sourceState,
    targetState,
    operation: {
      stepId: "step.distribution.expand-a-sum",
      transformationId: operation.transformationId,
      operationId: "kp.semantic-motion.distribution",
      roleBindings: {
        "source-factor": [contract.source.factorSelectorId],
        "factor-copies": [...contract.factorFanOut.targetFactorSelectorIds],
        "source-addends": [
          contract.source.leftAddendSelectorId,
          contract.source.rightAddendSelectorId
        ],
        "target-addends": [
          contract.target.leftAddendSelectorId,
          contract.target.rightAddendSelectorId
        ],
        connector: [
          contract.source.connectorSelectorId,
          contract.target.connectorSelectorId
        ]
      },
      correspondenceMap: operation.correspondenceMap
    },
    rewriteFrontier: {
      sourceEntityIds,
      targetEntityIds,
      contextEntityIds: []
    },
    teachingIntent: {
      kind: "cause",
      primaryEntityIds: Object.freeze([
        contract.source.factorSelectorId,
        ...contract.factorFanOut.targetFactorSelectorIds,
        contract.source.leftAddendSelectorId,
        contract.source.rightAddendSelectorId,
        contract.target.leftAddendSelectorId,
        contract.target.rightAddendSelectorId
      ]),
      secondaryEntityIds: Object.freeze([
        contract.source.connectorSelectorId,
        contract.target.connectorSelectorId
      ]),
      summary:
        "Show one factor causing an ordered copy beside every persistent addend while the connector remains attached."
    }
  });

export const kpCanonicalDistributionPressureSemanticMotionStructure =
  Object.freeze({
    operationId: "kp.semantic-motion.distribution",
    roles: Object.freeze([
      role("source-factor", "exactly-one", "material", "none"),
      role("factor-copies", "one-or-more", "material", "none"),
      role("source-addends", "one-or-more", "material", "none"),
      role("target-addends", "one-or-more", "material", "none"),
      role("connector", "one-or-more", "punctuation", "required")
    ]),
    cohorts: Object.freeze([{
      id: "cohort.distribution.factors",
      memberRoleIds: Object.freeze(["source-factor", "factor-copies"]),
      cohesion: Object.freeze({
        scope: "family-local" as const,
        variantId: "ordered-factor-fan-out"
      })
    }, {
      id: "cohort.distribution.addends",
      memberRoleIds: Object.freeze(["source-addends", "target-addends"]),
      cohesion: Object.freeze({
        scope: "family-local" as const,
        variantId: "ordered-addend-continuity"
      })
    }, {
      id: "cohort.distribution.connector",
      memberRoleIds: Object.freeze(["connector"]),
      cohesion: Object.freeze({
        scope: "family-local" as const,
        variantId: "connector-axis-local"
      })
    }]),
    attachments: Object.freeze([{
      id: "attachment.distribution.connector",
      kind: "connector-between" as const,
      anchorRoleIds: Object.freeze(["target-addends"]),
      attachedRoleIds: Object.freeze(["connector"])
    }])
  } satisfies KpSemanticMotionOperationStructureContract);

export const kpCanonicalDistributionPressureSemanticMotionPrecedence =
  precedenceChain([
    event("event.distribution.reserve-products", "orient", ["cohort.distribution.addends"]),
    event("event.distribution.factor-departs", "departure", ["cohort.distribution.factors"]),
    event("event.distribution.factor-copies-arrive", "arrival", ["cohort.distribution.factors"]),
    Object.freeze({
      id: "event.distribution.connector-attached",
      kind: "attachment" as const,
      cohortIds: Object.freeze([]),
      attachmentIds: Object.freeze(["attachment.distribution.connector"]),
      correspondenceRecordIds: Object.freeze([]),
      summary: "Keep the persistent connector attached between ordered products."
    }),
    event("event.distribution.products-settled", "settlement", ["cohort.distribution.addends"]),
    Object.freeze({
      id: "event.distribution.native-target-ready",
      kind: "native-target-ready" as const,
      cohortIds: Object.freeze([]),
      attachmentIds: Object.freeze([]),
      correspondenceRecordIds: Object.freeze([]),
      summary: "Transfer paint ownership to the settled native target."
    })
  ]);

const compiled = compileKpSemanticMotion({
  request: kpCanonicalDistributionPressureSemanticMotionRequest,
  source: kpCanonicalDistributionPressureSemanticMotionSource,
  structureContract: kpCanonicalDistributionPressureSemanticMotionStructure,
  precedenceSpec: kpCanonicalDistributionPressureSemanticMotionPrecedence
});

if (compiled.status !== "compiled") {
  throw new Error(
    `Canonical distribution semantic motion failed closed with ${compiled.status}.`
  );
}

export const kpCanonicalCompiledDistributionPressureSemanticMotion:
  KpCompiledSemanticMotionChoreography = compiled.choreography;

function role(
  id: string,
  cardinality: "exactly-one" | "one-or-more",
  participation: "material" | "punctuation",
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
    summary: `${kind} distribution semantic material.`
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
