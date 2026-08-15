import {
  compileKpSemanticMotionPrecedence,
  compileKpSemanticMotionLifecycle,
  compileKpSemanticMotionRoleCohorts,
  createKpSemanticMotionCompilerRequestV1,
  kpSemanticMotionCompilerRequestSchemaVersion,
  validateKpSemanticMotionCorrespondenceAndProvenance,
  validateKpSemanticMotionEndpointsAndFrontier,
  type KpSemanticMotionCompilerRequestV1,
  type KpSemanticMotionEntityAuthorityV1,
  type KpSemanticMotionOperationStructureContract,
  type KpSemanticMotionSourceAuthorityV1,
  type KpVerifiedSemanticMotionLifecycle,
  type KpVerifiedSemanticMotionPrecedence
} from "../../src/domain-ir/public-api.ts";
import type {
  SelectorCorrespondenceRelationId,
  SelectorCorrespondenceRecord
} from "../../src/semantic/correspondence.ts";

export interface KpSemanticMotionCompilerTestFixture {
  readonly request: KpSemanticMotionCompilerRequestV1;
  readonly source: KpSemanticMotionSourceAuthorityV1;
  readonly lifecycle: KpVerifiedSemanticMotionLifecycle;
}

export interface KpSequentialSemanticMotionFixture {
  readonly source: KpSemanticMotionSourceAuthorityV1;
  readonly steps: readonly {
    readonly request: KpSemanticMotionCompilerRequestV1;
    readonly precedence: KpVerifiedSemanticMotionPrecedence;
  }[];
}

interface FixtureInput {
  readonly id: string;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly relations: readonly {
    readonly id: string;
    readonly relation: SelectorCorrespondenceRelationId;
    readonly sourceEntityIds: readonly string[];
    readonly targetEntityIds: readonly string[];
  }[];
}

export function createQuotientSemanticMotionFixture(): KpSemanticMotionCompilerTestFixture {
  return createFixture({
    id: "quotient",
    sourceEntityIds: ["q.source.ln-left", "q.source.ln-right", "q.source.x", "q.source.y"],
    targetEntityIds: ["q.target.ln", "q.target.x", "q.target.y"],
    roleBindings: {
      "source-operators": ["q.source.ln-left", "q.source.ln-right"],
      "source-arguments": ["q.source.x", "q.source.y"],
      "target-operator": ["q.target.ln"],
      "target-arguments": ["q.target.x", "q.target.y"]
    },
    relations: [{
      id: "operators-fuse",
      relation: "fan-in",
      sourceEntityIds: ["q.source.ln-left", "q.source.ln-right"],
      targetEntityIds: ["q.target.ln"]
    }, roleChange("x-changes-role", "q.source.x", "q.target.x"), roleChange("y-changes-role", "q.source.y", "q.target.y")]
  });
}

export function createDistributionSemanticMotionFixture(): KpSemanticMotionCompilerTestFixture {
  return createFixture({
    id: "distribution",
    sourceEntityIds: ["d.source.factor", "d.source.left", "d.source.plus", "d.source.right"],
    targetEntityIds: ["d.target.factor-left", "d.target.left", "d.target.plus", "d.target.factor-right", "d.target.right"],
    roleBindings: {
      "source-factor": ["d.source.factor"],
      "factor-copies": ["d.target.factor-left", "d.target.factor-right"],
      "source-addends": ["d.source.left", "d.source.right"],
      "target-addends": ["d.target.left", "d.target.right"],
      connector: ["d.source.plus", "d.target.plus"]
    },
    relations: [{
      id: "factor-fans-out",
      relation: "fan-out",
      sourceEntityIds: ["d.source.factor"],
      targetEntityIds: ["d.target.factor-left", "d.target.factor-right"]
    }, roleChange("left-persists", "d.source.left", "d.target.left"), roleChange("plus-persists", "d.source.plus", "d.target.plus"), roleChange("right-persists", "d.source.right", "d.target.right")]
  });
}

export function createCancellationSemanticMotionFixture(): KpSemanticMotionCompilerTestFixture {
  return createFixture({
    id: "cancellation",
    sourceEntityIds: ["c.source.x", "c.source.plus-three", "c.source.minus-three", "c.source.equals", "c.source.seven"],
    targetEntityIds: ["c.target.x", "c.target.equals", "c.target.seven"],
    roleBindings: {
      "inverse-pair": ["c.source.plus-three", "c.source.minus-three"],
      "source-survivors": ["c.source.x", "c.source.equals", "c.source.seven"],
      "target-survivors": ["c.target.x", "c.target.equals", "c.target.seven"]
    },
    relations: [{
      id: "inverse-pair-cancels",
      relation: "cancelation",
      sourceEntityIds: ["c.source.plus-three", "c.source.minus-three"],
      targetEntityIds: []
    }, roleChange("x-persists", "c.source.x", "c.target.x"), roleChange("equals-persists", "c.source.equals", "c.target.equals"), roleChange("seven-persists", "c.source.seven", "c.target.seven")]
  });
}

export function createSequentialSemanticMotionFixture(
  transitionCount = 3,
  semanticIdentityId = "identity.sequence"
): KpSequentialSemanticMotionFixture {
  if (!Number.isInteger(transitionCount) || transitionCount < 1) {
    throw new Error("Sequential semantic-motion fixture requires at least one transition.");
  }
  const sourceId = "semantic.sequence";
  const revisionId = "revision.1";
  const assetId = "animation.sequence";
  const stateIds = Array.from({ length: transitionCount + 1 }, (_, index) => `state.sequence.${index}`);
  const entityIds = Array.from({ length: transitionCount + 1 }, (_, index) => `sequence.entity.${index}`);
  const transformationIds = Array.from({ length: transitionCount }, (_, index) => `transform.sequence.${index}`);
  const source: KpSemanticMotionSourceAuthorityV1 = {
    sourceId,
    revisionId,
    assetIds: [assetId],
    states: stateIds.map((id, index) => ({
      id,
      objectIds: [`object.sequence.${index}`],
      entityIds: [entityIds[index]!]
    })),
    entities: entityIds.map((id, index) => index === 0
      ? { id, semanticIdentityId, provenance: { kind: "authored", sourceId } }
      : {
          id,
          semanticIdentityId,
          provenance: {
            kind: "identity-successor",
            transformationId: transformationIds[index - 1]!,
            sourceEntityIds: [entityIds[index - 1]!]
          }
        })
  };
  const contract: KpSemanticMotionOperationStructureContract = {
    operationId: "kp.semantic-motion.role-change",
    roles: [
      role("source-material", "exactly-one", "material", "none"),
      role("target-material", "exactly-one", "material", "none")
    ],
    cohorts: [cohort("cohort.sequence.material", ["source-material", "target-material"], "identity-role-change")],
    attachments: []
  };
  const steps = transformationIds.map((transformationId, index) => {
    const request = createKpSemanticMotionCompilerRequestV1({
      schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
      id: `request.sequence.${index}`,
      assetId,
      semanticSource: { sourceId, revisionId, operationPacks: [{ packId: "kp.semantic-motion", version: "0.1.0" }] },
      sourceState: source.states[index]!,
      targetState: source.states[index + 1]!,
      operation: {
        stepId: `step.sequence.${index}`,
        transformationId,
        operationId: contract.operationId,
        roleBindings: {
          "source-material": [entityIds[index]!],
          "target-material": [entityIds[index + 1]!]
        },
        correspondenceMap: {
          id: `correspondence.sequence.${index}`,
          records: [{
            id: `record.sequence.${index}`,
            relation: "role-change",
            sourceSelectorIds: [entityIds[index]!],
            targetSelectorIds: [entityIds[index + 1]!],
            summary: `sequence ${index}`
          }]
        }
      },
      rewriteFrontier: {
        sourceEntityIds: [entityIds[index]!],
        targetEntityIds: [entityIds[index + 1]!],
        contextEntityIds: []
      },
      teachingIntent: {
        kind: "transmit",
        primaryEntityIds: [entityIds[index]!, entityIds[index + 1]!],
        secondaryEntityIds: [],
        summary: `sequence ${index}`
      }
    });
    const endpoints = validateKpSemanticMotionEndpointsAndFrontier({ request, source });
    if (endpoints.status !== "verified") throw new Error(`Sequence ${index} endpoint validation failed.`);
    const provenance = validateKpSemanticMotionCorrespondenceAndProvenance({ request, source, endpointFrontier: endpoints.endpointFrontier });
    if (provenance.status !== "verified") throw new Error(`Sequence ${index} provenance validation failed.`);
    const lifecycle = compileKpSemanticMotionLifecycle({ request, provenance: provenance.provenance });
    if (lifecycle.status !== "verified") throw new Error(`Sequence ${index} lifecycle compilation failed.`);
    const structure = compileKpSemanticMotionRoleCohorts({ request, lifecycle: lifecycle.lifecycle, contract });
    if (structure.status !== "verified") throw new Error(`Sequence ${index} structure compilation failed.`);
    const precedence = compileKpSemanticMotionPrecedence({
      request,
      structure: structure.structure,
      spec: {
        events: [{
          id: `event.sequence.${index}.orient`,
          kind: "orient",
          cohortIds: ["cohort.sequence.material"],
          attachmentIds: [],
          correspondenceRecordIds: [],
          summary: "Orient the stable identity."
        }, {
          id: `event.sequence.${index}.settle`,
          kind: "settlement",
          cohortIds: ["cohort.sequence.material"],
          attachmentIds: [],
          correspondenceRecordIds: [],
          summary: "Settle the successor representation."
        }, {
          id: `event.sequence.${index}.ready`,
          kind: "native-target-ready",
          cohortIds: [],
          attachmentIds: [],
          correspondenceRecordIds: [],
          summary: "Native target ready."
        }],
        edges: [{
          beforeEventId: `event.sequence.${index}.orient`,
          afterEventId: `event.sequence.${index}.settle`
        }, {
          beforeEventId: `event.sequence.${index}.settle`,
          afterEventId: `event.sequence.${index}.ready`
        }]
      }
    });
    if (precedence.status !== "verified") throw new Error(`Sequence ${index} precedence compilation failed.`);
    return { request, precedence: precedence.precedence };
  });
  return { source, steps };
}

export function quotientSemanticMotionStructureContract(): KpSemanticMotionOperationStructureContract {
  return {
    operationId: "kp.semantic-motion.quotient",
    roles: [
      role("source-operators", "one-or-more", "operator", "required"),
      role("source-arguments", "one-or-more", "material", "none"),
      role("target-operator", "exactly-one", "operator", "required"),
      role("target-arguments", "one-or-more", "material", "none")
    ],
    cohorts: [
      cohort("cohort.quotient.operator-fusion", ["source-operators", "target-operator"], "log-application-fusion"),
      cohort("cohort.quotient.arguments", ["source-arguments", "target-arguments"], "quotient-argument-role-change")
    ],
    attachments: [
      attachment("attachment.source-operators", "operator-argument", ["source-arguments"], ["source-operators"]),
      attachment("attachment.target-operator", "operator-argument", ["target-arguments"], ["target-operator"])
    ]
  };
}

export function distributionSemanticMotionStructureContract(): KpSemanticMotionOperationStructureContract {
  return {
    operationId: "kp.semantic-motion.distribution",
    roles: [
      role("source-factor", "exactly-one", "material", "none"),
      role("factor-copies", "one-or-more", "material", "none"),
      role("source-addends", "one-or-more", "material", "none"),
      role("target-addends", "one-or-more", "material", "none"),
      role("connector", "one-or-more", "punctuation", "required")
    ],
    cohorts: [
      cohort("cohort.distribution.factors", ["source-factor", "factor-copies"], "ordered-factor-fan-out"),
      cohort("cohort.distribution.addends", ["source-addends", "target-addends"], "ordered-addend-continuity"),
      cohort("cohort.distribution.connector", ["connector"], "connector-axis-local")
    ],
    attachments: [
      attachment("attachment.distribution.connector", "connector-between", ["target-addends"], ["connector"])
    ]
  };
}

export function cancellationSemanticMotionStructureContract(): KpSemanticMotionOperationStructureContract {
  return {
    operationId: "kp.semantic-motion.cancellation",
    roles: [
      role("inverse-pair", "one-or-more", "operator", "required"),
      role("source-survivors", "one-or-more", "material", "none"),
      role("target-survivors", "one-or-more", "material", "none")
    ],
    cohorts: [
      cohort("cohort.cancellation.inverse-pair", ["inverse-pair"], "inverse-shared-contact"),
      cohort("cohort.cancellation.survivors", ["source-survivors", "target-survivors"], "survivor-compaction-local")
    ],
    attachments: [
      attachment("attachment.cancellation.signs", "sign-term", ["source-survivors"], ["inverse-pair"])
    ]
  };
}

function createFixture(input: FixtureInput): KpSemanticMotionCompilerTestFixture {
  const transformationId = `transform.${input.id}`;
  const sourceId = `semantic.${input.id}`;
  const correspondenceRecords: readonly SelectorCorrespondenceRecord[] = input.relations.map((relation) => ({
    id: relation.id,
    relation: relation.relation,
    sourceSelectorIds: relation.sourceEntityIds,
    targetSelectorIds: relation.targetEntityIds,
    summary: relation.id
  }));
  const source: KpSemanticMotionSourceAuthorityV1 = {
    sourceId,
    revisionId: "revision.1",
    assetIds: [`animation.${input.id}`],
    states: [{ id: `state.${input.id}.source`, objectIds: [`object.${input.id}.source`], entityIds: input.sourceEntityIds }, { id: `state.${input.id}.target`, objectIds: [`object.${input.id}.target`], entityIds: input.targetEntityIds }],
    entities: [
      ...input.sourceEntityIds.map((id) => authored(id, sourceId)),
      ...input.targetEntityIds.map((id) => targetAuthority(id, transformationId, correspondenceRecords))
    ]
  };
  const request = createKpSemanticMotionCompilerRequestV1({
    schemaVersion: kpSemanticMotionCompilerRequestSchemaVersion,
    id: `request.${input.id}`,
    assetId: `animation.${input.id}`,
    semanticSource: { sourceId, revisionId: source.revisionId, operationPacks: [{ packId: "kp.semantic-motion", version: "0.1.0" }] },
    sourceState: source.states[0]!,
    targetState: source.states[1]!,
    operation: { stepId: `step.${input.id}`, transformationId, operationId: `kp.semantic-motion.${input.id}`, roleBindings: input.roleBindings, correspondenceMap: { id: `correspondence.${input.id}`, records: correspondenceRecords } },
    rewriteFrontier: { sourceEntityIds: input.sourceEntityIds, targetEntityIds: input.targetEntityIds, contextEntityIds: [] },
    teachingIntent: { kind: "cause", primaryEntityIds: [...input.sourceEntityIds, ...input.targetEntityIds], secondaryEntityIds: [], summary: input.id }
  });
  const endpoints = validateKpSemanticMotionEndpointsAndFrontier({ request, source });
  if (endpoints.status !== "verified") throw new Error(`Fixture ${input.id} endpoint validation failed.`);
  const provenance = validateKpSemanticMotionCorrespondenceAndProvenance({ request, source, endpointFrontier: endpoints.endpointFrontier });
  if (provenance.status !== "verified") throw new Error(`Fixture ${input.id} provenance validation failed.`);
  const lifecycle = compileKpSemanticMotionLifecycle({ request, provenance: provenance.provenance });
  if (lifecycle.status !== "verified") throw new Error(`Fixture ${input.id} lifecycle compilation failed.`);
  return { request, source, lifecycle: lifecycle.lifecycle };
}

function targetAuthority(
  id: string,
  transformationId: string,
  records: readonly SelectorCorrespondenceRecord[]
): KpSemanticMotionEntityAuthorityV1 {
  const record = records.find(({ targetSelectorIds }) => targetSelectorIds.includes(id));
  if (record === undefined) throw new Error(`Target ${id} has no fixture provenance.`);
  if (record.relation === "identity" || record.relation === "role-change") {
    const sourceEntityId = record.sourceSelectorIds[0]!;
    return { id, semanticIdentityId: `identity.${sourceEntityId}`, provenance: { kind: "identity-successor", transformationId, sourceEntityIds: [sourceEntityId] } };
  }
  if (record.relation === "introduction") {
    return { id, semanticIdentityId: `identity.${id}`, provenance: { kind: "introduced", transformationId } };
  }
  return { id, semanticIdentityId: `identity.${id}`, provenance: { kind: "derived", transformationId, sourceEntityIds: record.sourceSelectorIds } };
}

function authored(id: string, sourceId: string): KpSemanticMotionEntityAuthorityV1 {
  return { id, semanticIdentityId: `identity.${id}`, provenance: { kind: "authored", sourceId } };
}

function roleChange(id: string, sourceEntityId: string, targetEntityId: string): FixtureInput["relations"][number] {
  return { id, relation: "role-change", sourceEntityIds: [sourceEntityId], targetEntityIds: [targetEntityId] };
}

function role(
  id: string,
  cardinality: "exactly-one" | "one-or-more",
  participation: "material" | "operator" | "punctuation",
  attachmentValue: "required" | "none"
) {
  return { id, cardinality, participation, attachment: attachmentValue } as const;
}

function cohort(id: string, memberRoleIds: readonly string[], variantId: string) {
  return { id, memberRoleIds, cohesion: { scope: "family-local" as const, variantId } };
}

function attachment(
  id: string,
  kind: "operator-argument" | "connector-between" | "sign-term",
  anchorRoleIds: readonly string[],
  attachedRoleIds: readonly string[]
) {
  return { id, kind, anchorRoleIds, attachedRoleIds };
}
