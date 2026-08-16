import {
  createKpSemanticMotionCompilerRequestV1,
  kpSemanticMotionCompilerRequestSchemaVersion,
} from "../domain-ir/semantic-motion-compiler-contract.ts";
import {
  compileKpSemanticMotion
} from "../domain-ir/semantic-motion-compiler.ts";
import type {
  KpCompiledSemanticMotionChoreography
} from "../domain-ir/semantic-motion-choreography-compiler.ts";
import type {
  KpSemanticMotionEventSpec,
  KpSemanticMotionPrecedenceSpec
} from "../domain-ir/semantic-motion-precedence-compiler.ts";
import type {
  KpSemanticMotionOperationStructureContract
} from "../domain-ir/semantic-motion-role-cohort-compiler.ts";
import {
  createKpSemanticMotionSourceAuthority
} from "../domain-ir/semantic-motion-source-authority.ts";
import {
  kpCanonicalCancellationPressureContract
} from "./cancellation-pressure-contract.ts";

const contract = kpCanonicalCancellationPressureContract;
const operation = contract.operationExecution;
const sourceEntityIds = Object.freeze([...contract.source.selectorIds]);
const targetEntityIds = Object.freeze([...contract.target.selectorIds]);
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
const sourceSurvivorIds = Object.freeze(contract.continuants.map(
  ({ sourceSelectorId }) => sourceSelectorId
));
const targetSurvivorIds = Object.freeze(contract.continuants.map(
  ({ targetSelectorId }) => targetSelectorId
));

export const kpCanonicalCancellationPressureSemanticMotionSource =
  createKpSemanticMotionSourceAuthority({
    sourceId: "semantic-source.cancellation.generated-x-plus-3",
    revisionId: "revision.cancellation.semantic-motion.v1",
    transformationId: operation.transformationId,
    assetIds: [contract.animationId],
    sourceState,
    targetState,
    correspondenceMap: operation.correspondenceMap,
    semanticIdentityIdByEntityId
  });

export const kpCanonicalCancellationPressureSemanticMotionRequest =
  createKpSemanticMotionCompilerRequestV1({
    schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
    id: "request.cancellation.generated-x-plus-3.semantic-motion.v1",
    assetId: contract.animationId,
    semanticSource: {
      sourceId: kpCanonicalCancellationPressureSemanticMotionSource.sourceId,
      revisionId:
        kpCanonicalCancellationPressureSemanticMotionSource.revisionId,
      operationPacks: [{ packId: "kp.semantic-motion", version: "0.1.0" }]
    },
    sourceState,
    targetState,
    operation: {
      stepId: "step.cancellation.generated-x-plus-3",
      transformationId: operation.transformationId,
      operationId: "kp.semantic-motion.cancellation",
      roleBindings: {
        "inverse-pair": [...contract.inversePair.sourceSelectorIds],
        "source-survivors": sourceSurvivorIds,
        "target-survivors": targetSurvivorIds
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
        ...contract.inversePair.sourceSelectorIds
      ]),
      secondaryEntityIds: Object.freeze([
        ...sourceSurvivorIds,
        ...targetSurvivorIds
      ]),
      summary:
        "Establish shared contact before retiring the inverse pair, then compact only identity-preserving survivors."
    }
  });

export const kpCanonicalCancellationPressureSemanticMotionStructure =
  Object.freeze({
    operationId: "kp.semantic-motion.cancellation",
    roles: Object.freeze([
      role("inverse-pair", "one-or-more", "operator", "required"),
      role("source-survivors", "one-or-more", "material", "none"),
      role("target-survivors", "one-or-more", "material", "none")
    ]),
    cohorts: Object.freeze([{
      id: "cohort.cancellation.inverse-pair",
      memberRoleIds: Object.freeze(["inverse-pair"]),
      cohesion: Object.freeze({
        scope: "family-local" as const,
        variantId: "inverse-shared-contact"
      })
    }, {
      id: "cohort.cancellation.survivors",
      memberRoleIds: Object.freeze([
        "source-survivors",
        "target-survivors"
      ]),
      cohesion: Object.freeze({
        scope: "family-local" as const,
        variantId: "survivor-compaction-local"
      })
    }]),
    attachments: Object.freeze([{
      id: "attachment.cancellation.signs",
      kind: "sign-term" as const,
      anchorRoleIds: Object.freeze(["source-survivors"]),
      attachedRoleIds: Object.freeze(["inverse-pair"])
    }])
  } satisfies KpSemanticMotionOperationStructureContract);

export const kpCanonicalCancellationPressureSemanticMotionPrecedence =
  precedenceChain([
    event(
      "event.cancellation.inverse-pair-oriented",
      "orient",
      ["cohort.cancellation.inverse-pair"]
    ),
    event(
      "event.cancellation.inverse-contact-established",
      "contact",
      ["cohort.cancellation.inverse-pair"],
      [contract.inversePair.correspondenceRecordId]
    ),
    event(
      "event.cancellation.inverse-pair-retired",
      "retirement",
      ["cohort.cancellation.inverse-pair"],
      [contract.inversePair.correspondenceRecordId]
    ),
    event(
      "event.cancellation.survivors-compacted",
      "settlement",
      ["cohort.cancellation.survivors"]
    ),
    Object.freeze({
      id: "event.cancellation.native-target-ready",
      kind: "native-target-ready" as const,
      cohortIds: Object.freeze([]),
      attachmentIds: Object.freeze([]),
      correspondenceRecordIds: Object.freeze([]),
      summary: "Transfer paint ownership to the settled native target."
    })
  ]);

const compiled = compileKpSemanticMotion({
  request: kpCanonicalCancellationPressureSemanticMotionRequest,
  source: kpCanonicalCancellationPressureSemanticMotionSource,
  structureContract: kpCanonicalCancellationPressureSemanticMotionStructure,
  precedenceSpec: kpCanonicalCancellationPressureSemanticMotionPrecedence
});

if (compiled.status !== "compiled") {
  throw new Error(
    `Canonical cancellation semantic motion failed closed with ${compiled.status}.`
  );
}

export const kpCanonicalCompiledCancellationPressureSemanticMotion:
  KpCompiledSemanticMotionChoreography = compiled.choreography;

function role(
  id: string,
  cardinality: "one-or-more",
  participation: "material" | "operator",
  attachment: "required" | "none"
) {
  return Object.freeze({ id, cardinality, participation, attachment });
}

function event(
  id: string,
  kind: KpSemanticMotionEventSpec["kind"],
  cohortIds: readonly string[],
  correspondenceRecordIds: readonly string[] = []
): KpSemanticMotionEventSpec {
  return Object.freeze({
    id,
    kind,
    cohortIds: Object.freeze([...cohortIds]),
    attachmentIds: Object.freeze([]),
    correspondenceRecordIds: Object.freeze([...correspondenceRecordIds]),
    summary: `${kind} cancellation semantic material.`
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
