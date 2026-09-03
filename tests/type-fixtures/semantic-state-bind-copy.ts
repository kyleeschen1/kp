import {
  createKpAggregateSemanticSnapshot
} from "../../src/semantic-state/aggregate-snapshot.ts";
import {
  createKpSemanticEntityVersionStore
} from "../../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../../src/semantic-state/identity.ts";
import {
  beginKpSemanticTransaction
} from "../../src/semantic-state/transaction.ts";

const identities = createKpSemanticStateIdentityScope("fixture.copy");
const sourceSlotId = identities.slot("source");
const targetSlotId = identities.slot("target");
const source = createKpSemanticEntityVersionStore({
  identities,
  entityId: identities.entity("source"),
  value: { value: 1 },
  sourceId: "fixture.source"
});
const target = createKpSemanticEntityVersionStore({
  identities,
  entityId: identities.entity("target"),
  value: { value: 2 },
  sourceId: "fixture.target"
});
const transaction = beginKpSemanticTransaction({
  identities,
  before: createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [sourceSlotId, targetSlotId],
    bindings: [
      { slotId: sourceSlotId, entityId: source.entityId, versionId: source.latestVersionId },
      { slotId: targetSlotId, entityId: target.entityId, versionId: target.latestVersionId }
    ],
    entityStores: [source, target]
  }),
  transformationId: identities.appliedTransformation(
    identities.transformation("copy"),
    "first"
  )
});

transaction.bindCopy(transaction.scope, {
  id: "copy.target",
  sourceId: "fixture.copy-rule",
  sourceSlotId,
  targetSlotId,
  newEntityId: identities.entity("copy")
});

transaction.bindCopy(transaction.scope, {
  id: "copy.invalid-id",
  sourceId: "fixture.copy-rule",
  sourceSlotId,
  targetSlotId,
  // @ts-expect-error A copy identity must be an entity ID, not a version ID.
  newEntityId: source.latestVersionId
});
