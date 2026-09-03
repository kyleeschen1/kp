declare const kpSemanticStateIdBrand: unique symbol;

type KpSemanticStateId<Kind extends string> = string & {
  readonly [kpSemanticStateIdBrand]: Kind;
};

export type KpSemanticEntityId = KpSemanticStateId<"entity">;
export type KpSemanticVersionId = KpSemanticStateId<"version">;
export type KpAggregateSnapshotId = KpSemanticStateId<"aggregate-snapshot">;
/** A contextual role is addressed by its slot, never by entity identity. */
export type KpSemanticSlotId = KpSemanticStateId<"role-slot">;
export type KpStateOccurrenceId = KpSemanticStateId<"state-occurrence">;
export type KpAuthorAliasId = KpSemanticStateId<"author-alias">;
export type KpDisplayLabelId = KpSemanticStateId<"display-label">;
export type KpSemanticRepresentationId =
  KpSemanticStateId<"representation">;
export type KpTransformationDefinitionId =
  KpSemanticStateId<"transformation-definition">;
export type KpAppliedTransformationId =
  KpSemanticStateId<"applied-transformation">;

export type KpAnySemanticStateId =
  | KpSemanticEntityId
  | KpSemanticVersionId
  | KpAggregateSnapshotId
  | KpSemanticSlotId
  | KpStateOccurrenceId
  | KpAuthorAliasId
  | KpDisplayLabelId
  | KpSemanticRepresentationId
  | KpTransformationDefinitionId
  | KpAppliedTransformationId;

export interface KpSemanticStateIdentityScope {
  readonly namespace: string;
  entity(localId: string): KpSemanticEntityId;
  initialVersion(entityId: KpSemanticEntityId): KpSemanticVersionId;
  successorVersion(
    entityId: KpSemanticEntityId,
    transformationId: KpAppliedTransformationId,
    revisionId: string
  ): KpSemanticVersionId;
  initialSnapshot(): KpAggregateSnapshotId;
  successorSnapshot(
    transformationId: KpAppliedTransformationId
  ): KpAggregateSnapshotId;
  slot(path: string): KpSemanticSlotId;
  occurrence(localId: string): KpStateOccurrenceId;
  alias(localId: string): KpAuthorAliasId;
  displayLabel(localId: string): KpDisplayLabelId;
  representation(localId: string): KpSemanticRepresentationId;
  transformation(localId: string): KpTransformationDefinitionId;
  appliedTransformation(
    definitionId: KpTransformationDefinitionId,
    applicationId: string
  ): KpAppliedTransformationId;
}

const semanticIdPartPattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;

function requireSemanticIdPart(value: string, label: string): string {
  if (!semanticIdPartPattern.test(value)) {
    throw new Error(
      `Invalid semantic state ${label} ${JSON.stringify(value)}; expected a lowercase, scoped identifier.`
    );
  }
  return value;
}

function assertOwnedId(
  value: string,
  expectedPrefix: string,
  label: string
): void {
  if (!value.startsWith(expectedPrefix)) {
    throw new Error(
      `Semantic state ${label} ${JSON.stringify(value)} does not belong to identity scope ${JSON.stringify(expectedPrefix.slice(0, -1))}.`
    );
  }
}

/**
 * IDs are readable deterministic values, while the factory supplies their
 * nominal types. This keeps authors away from casts without making runtime
 * object identity, construction order, or a global registry authoritative.
 */
export function createKpSemanticStateIdentityScope(
  namespace: string
): KpSemanticStateIdentityScope {
  const validNamespace = requireSemanticIdPart(namespace, "namespace");
  const prefix = `kp-state/${validNamespace}`;
  const entityPrefix = `${prefix}/entity/`;
  const transformationPrefix = `${prefix}/transformation/`;

  const scope: KpSemanticStateIdentityScope = {
    namespace: validNamespace,
    entity(localId) {
      return `${entityPrefix}${requireSemanticIdPart(localId, "entity id")}` as
        KpSemanticEntityId;
    },
    initialVersion(entityId) {
      assertOwnedId(entityId, entityPrefix, "entity id");
      return `${entityId}/version/initial` as
        KpSemanticVersionId;
    },
    successorVersion(entityId, transformationId, revisionId) {
      assertOwnedId(entityId, entityPrefix, "entity id");
      const transformationSuffix = ownedTransformationSuffix(
        transformationId,
        transformationPrefix,
        "applied transformation id"
      );
      return `${entityId}/version/from/${transformationSuffix}/revision/${requireSemanticIdPart(revisionId, "revision id")}` as
        KpSemanticVersionId;
    },
    initialSnapshot() {
      return `${prefix}/snapshot/initial` as KpAggregateSnapshotId;
    },
    successorSnapshot(transformationId) {
      const transformationSuffix = ownedTransformationSuffix(
        transformationId,
        transformationPrefix,
        "applied transformation id"
      );
      return `${prefix}/snapshot/from/${transformationSuffix}` as
        KpAggregateSnapshotId;
    },
    slot(path) {
      return `${prefix}/slot/${requireSemanticIdPart(path, "slot path")}` as
        KpSemanticSlotId;
    },
    occurrence(localId) {
      return `${prefix}/occurrence/${requireSemanticIdPart(localId, "occurrence id")}` as
        KpStateOccurrenceId;
    },
    alias(localId) {
      return `${prefix}/alias/${requireSemanticIdPart(localId, "alias id")}` as
        KpAuthorAliasId;
    },
    displayLabel(localId) {
      return `${prefix}/label/${requireSemanticIdPart(localId, "display label id")}` as
        KpDisplayLabelId;
    },
    representation(localId) {
      return `${prefix}/representation/${requireSemanticIdPart(localId, "representation id")}` as
        KpSemanticRepresentationId;
    },
    transformation(localId) {
      return `${transformationPrefix}${requireSemanticIdPart(localId, "transformation id")}` as
        KpTransformationDefinitionId;
    },
    appliedTransformation(definitionId, applicationId) {
      assertOwnedId(
        definitionId,
        transformationPrefix,
        "transformation definition id"
      );
      return `${definitionId}/application/${requireSemanticIdPart(applicationId, "transformation application id")}` as
        KpAppliedTransformationId;
    }
  };

  return Object.freeze(scope);
}

function ownedTransformationSuffix(
  transformationId: KpAppliedTransformationId,
  transformationPrefix: string,
  label: string
): string {
  assertOwnedId(transformationId, transformationPrefix, label);
  const suffix = transformationId.slice(transformationPrefix.length);
  if (!suffix.includes("/application/")) {
    throw new Error(
      `Semantic state ${label} ${JSON.stringify(transformationId)} is not an applied transformation.`
    );
  }
  return suffix;
}

export function areSameKpSemanticStateId<Id extends KpAnySemanticStateId>(
  left: Id,
  right: NoInfer<Id>
): boolean {
  return left === right;
}
