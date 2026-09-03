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

const identities = createKpSemanticStateIdentityScope("fixture.update");
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

transaction.update(transaction.scope, {
  id: "update.tax",
  sourceId: "fixture.tax-rule",
  revisionId: "tax",
  slotId,
  update(previous) {
    return previous;
  }
});

// @ts-expect-error Update operations require explicit authored source identity.
transaction.update(transaction.scope, {
  id: "update.missing-source",
  revisionId: "missing-source",
  slotId,
  update(previous) {
    return previous;
  }
});

transaction.update(transaction.scope, {
  id: "update.async",
  sourceId: "fixture.async-rule",
  revisionId: "async",
  slotId,
  // @ts-expect-error Async callbacks cannot produce committed semantic values.
  async update(previous) {
    return previous;
  }
});
