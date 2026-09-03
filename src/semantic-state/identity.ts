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
  version(entityId: KpSemanticEntityId, ordinal: number): KpSemanticVersionId;
  snapshot(ordinal: number): KpAggregateSnapshotId;
  slot(path: string): KpSemanticSlotId;
  occurrence(localId: string): KpStateOccurrenceId;
  alias(localId: string): KpAuthorAliasId;
  displayLabel(localId: string): KpDisplayLabelId;
  representation(localId: string): KpSemanticRepresentationId;
  transformation(localId: string): KpTransformationDefinitionId;
  appliedTransformation(
    definitionId: KpTransformationDefinitionId,
    ordinal: number
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

function requireOrdinal(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(
      `Invalid semantic state ${label} ${JSON.stringify(value)}; expected a non-negative safe integer.`
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
    version(entityId, ordinal) {
      assertOwnedId(entityId, entityPrefix, "entity id");
      return `${entityId}/version/${requireOrdinal(ordinal, "version ordinal")}` as
        KpSemanticVersionId;
    },
    snapshot(ordinal) {
      return `${prefix}/snapshot/${requireOrdinal(ordinal, "snapshot ordinal")}` as
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
    appliedTransformation(definitionId, ordinal) {
      assertOwnedId(
        definitionId,
        transformationPrefix,
        "transformation definition id"
      );
      return `${definitionId}/application/${requireOrdinal(ordinal, "transformation application ordinal")}` as
        KpAppliedTransformationId;
    }
  };

  return Object.freeze(scope);
}

export function areSameKpSemanticStateId<Id extends KpAnySemanticStateId>(
  left: Id,
  right: NoInfer<Id>
): boolean {
  return left === right;
}
