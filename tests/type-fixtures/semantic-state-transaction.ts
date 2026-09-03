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
  beginKpSemanticTransaction,
  type KpSemanticTransactionScope
} from "../../src/semantic-state/transaction.ts";

const identities = createKpSemanticStateIdentityScope("fixture.transaction");
const slotId = identities.slot("market");
const entity = createKpSemanticEntityVersionStore({
  identities,
  entityId: identities.entity("market"),
  value: { tax: 0 },
  sourceId: "fixture.market"
});
const before = createKpAggregateSemanticSnapshot({
  identities,
  snapshotId: identities.initialSnapshot(),
  requiredSlotIds: [slotId],
  bindings: [{
    slotId,
    entityId: entity.entityId,
    versionId: entity.latestVersionId
  }],
  entityStores: [entity]
});
const transaction = beginKpSemanticTransaction({
  identities,
  before,
  transformationId: identities.appliedTransformation(
    identities.transformation("update-market"),
    "first"
  )
});
transaction.read(transaction.scope, slotId);

// @ts-expect-error Plain objects cannot forge scoped transaction capability.
const forgedScope: KpSemanticTransactionScope = {
  transactionId: transaction.transactionId
};
void forgedScope;

// @ts-expect-error Entity IDs cannot address contextual transaction slots.
transaction.read(transaction.scope, entity.entityId);
