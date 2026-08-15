import type { CorrespondenceMap } from "../semantic/correspondence.ts";
import type {
  KpSemanticMotionEntityAuthorityV1,
  KpSemanticMotionSourceAuthorityV1
} from "./semantic-motion-endpoint-validator.ts";
import type {
  KpSemanticMotionStateRefV1
} from "./semantic-motion-compiler-contract.ts";

/**
 * Builds source/target provenance from authored correspondence. The builder
 * never guesses identity from glyphs: callers must name every endpoint
 * identity, and continuants inherit only through explicit identity records.
 */
export function createKpSemanticMotionSourceAuthority(input: {
  readonly sourceId: string;
  readonly revisionId: string;
  readonly transformationId: string;
  readonly assetIds: readonly string[];
  readonly sourceState: KpSemanticMotionStateRefV1;
  readonly targetState: KpSemanticMotionStateRefV1;
  readonly correspondenceMap: CorrespondenceMap;
  readonly semanticIdentityIdByEntityId: Readonly<Record<string, string>>;
}): KpSemanticMotionSourceAuthorityV1 {
  const sourceIdentities = new Map(input.sourceState.entityIds.map((entityId) => {
    const semanticIdentityId = requiredIdentity(input, entityId);
    return [entityId, semanticIdentityId] as const;
  }));
  const entities: KpSemanticMotionEntityAuthorityV1[] = [
    ...input.sourceState.entityIds.map((entityId) => Object.freeze({
      id: entityId,
      semanticIdentityId: sourceIdentities.get(entityId)!,
      provenance: Object.freeze({
        kind: "authored" as const,
        sourceId: input.sourceId
      })
    })),
    ...input.targetState.entityIds
      .filter((entityId) => !sourceIdentities.has(entityId))
      .map((entityId) => targetAuthority(input, sourceIdentities, entityId))
  ];
  return Object.freeze({
    sourceId: input.sourceId,
    revisionId: input.revisionId,
    assetIds: Object.freeze([...input.assetIds]),
    states: Object.freeze([input.sourceState, input.targetState]),
    entities: Object.freeze(entities)
  });
}

function targetAuthority(
  input: Parameters<typeof createKpSemanticMotionSourceAuthority>[0],
  sourceIdentities: ReadonlyMap<string, string>,
  entityId: string
): KpSemanticMotionEntityAuthorityV1 {
  const records = input.correspondenceMap.records.filter(
    ({ targetSelectorIds }) => targetSelectorIds.includes(entityId)
  );
  if (records.length !== 1) {
    throw new Error(
      `Target semantic entity ${entityId} requires exactly one correspondence record.`
    );
  }
  const record = records[0]!;
  const transformationId = input.transformationId;
  if (record.relation === "identity" || record.relation === "role-change") {
    if (record.sourceSelectorIds.length !== 1) {
      throw new Error(`Continuant ${entityId} requires exactly one source entity.`);
    }
    const sourceEntityId = record.sourceSelectorIds[0]!;
    const semanticIdentityId = sourceIdentities.get(sourceEntityId);
    if (semanticIdentityId === undefined) {
      throw new Error(`Continuant ${entityId} references foreign source ${sourceEntityId}.`);
    }
    return Object.freeze({
      id: entityId,
      semanticIdentityId,
      provenance: Object.freeze({
        kind: "identity-successor" as const,
        transformationId,
        sourceEntityIds: Object.freeze([sourceEntityId] as const)
      })
    });
  }
  if (record.relation === "introduction") {
    return Object.freeze({
      id: entityId,
      semanticIdentityId: requiredIdentity(input, entityId),
      provenance: Object.freeze({
        kind: "introduced" as const,
        transformationId
      })
    });
  }
  if (record.relation !== "fan-in" && record.relation !== "fan-out") {
    throw new Error(
      `Target semantic entity ${entityId} cannot derive from ${record.relation}.`
    );
  }
  return Object.freeze({
    id: entityId,
    semanticIdentityId: requiredIdentity(input, entityId),
    provenance: Object.freeze({
      kind: "derived" as const,
      transformationId,
      sourceEntityIds: Object.freeze([...record.sourceSelectorIds])
    })
  });
}

function requiredIdentity(
  input: Parameters<typeof createKpSemanticMotionSourceAuthority>[0],
  entityId: string
): string {
  const identity = input.semanticIdentityIdByEntityId[entityId];
  if (identity === undefined || identity.trim().length === 0) {
    throw new Error(`Semantic entity ${entityId} requires authored identity.`);
  }
  return identity;
}
