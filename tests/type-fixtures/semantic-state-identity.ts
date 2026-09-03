import {
  areSameKpSemanticStateId,
  createKpSemanticStateIdentityScope,
  type KpAggregateSnapshotId,
  type KpAppliedTransformationId,
  type KpAuthorAliasId,
  type KpDisplayLabelId,
  type KpSemanticEntityId,
  type KpSemanticRepresentationId,
  type KpSemanticSlotId,
  type KpSemanticVersionId,
  type KpStateOccurrenceId,
  type KpTransformationDefinitionId
} from "../../src/semantic-state/identity.ts";

const ids = createKpSemanticStateIdentityScope("fixture.semantic-state");
const entity = ids.entity("market");
const version = ids.version(entity, 0);
const snapshot = ids.snapshot(0);
const slot = ids.slot("market.supply");
const occurrence = ids.occurrence("market.graph");
const alias = ids.alias("m");
const label = ids.displayLabel("market.title");
const representation = ids.representation("market.graph");
const transformation = ids.transformation("add-tax");
const applied = ids.appliedTransformation(transformation, 0);

const exactKinds: [
  KpSemanticEntityId,
  KpSemanticVersionId,
  KpAggregateSnapshotId,
  KpSemanticSlotId,
  KpStateOccurrenceId,
  KpAuthorAliasId,
  KpDisplayLabelId,
  KpSemanticRepresentationId,
  KpTransformationDefinitionId,
  KpAppliedTransformationId
] = [
  entity,
  version,
  snapshot,
  slot,
  occurrence,
  alias,
  label,
  representation,
  transformation,
  applied
];
void exactKinds;

areSameKpSemanticStateId(entity, ids.entity("supply"));

// @ts-expect-error A version cannot be used as an entity.
ids.version(version, 1);
// @ts-expect-error A snapshot cannot be used as a transformation definition.
ids.appliedTransformation(snapshot, 1);
// @ts-expect-error Entity and slot identities have different equality domains.
areSameKpSemanticStateId(entity, slot);
// @ts-expect-error An ordinary string is not a minted semantic entity ID.
const forgedEntity: KpSemanticEntityId = "market";
void forgedEntity;
