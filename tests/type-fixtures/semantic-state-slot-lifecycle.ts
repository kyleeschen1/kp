import {
  createKpAggregateSemanticSnapshot,
  createKpSemanticSlotAbsence
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

const identities = createKpSemanticStateIdentityScope("fixture.lifecycle");
const requiredSlotId = identities.slot("required");
const optionalSlotId = identities.slot("optional");
const required = createKpSemanticEntityVersionStore({
  identities,
  entityId: identities.entity("required"),
  value: { value: 1 },
  sourceId: "fixture.required"
});
const transaction = beginKpSemanticTransaction({
  identities,
  before: createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [requiredSlotId],
    optionalSlotIds: [optionalSlotId],
    bindings: [{
      slotId: requiredSlotId,
      entityId: required.entityId,
      versionId: required.latestVersionId
    }],
    absences: [createKpSemanticSlotAbsence({
      slotId: optionalSlotId,
      reason: "not-introduced",
      sourceId: "fixture.optional"
    })],
    entityStores: [required]
  }),
  transformationId: identities.appliedTransformation(
    identities.transformation("introduce"),
    "first"
  )
});

transaction.introduce(transaction.scope, {
  id: "introduce.optional",
  sourceId: "fixture.introduction",
  slotId: optionalSlotId,
  newEntityId: identities.entity("introduced"),
  value: { value: 2 }
});

transaction.introduce(transaction.scope, {
  id: "introduce.invalid-id",
  sourceId: "fixture.invalid-id",
  slotId: optionalSlotId,
  // @ts-expect-error Introduced identities must be entity IDs.
  newEntityId: required.latestVersionId,
  value: { value: 2 }
});

transaction.introduce(transaction.scope, {
  id: "introduce.invalid-value",
  sourceId: "fixture.invalid-value",
  slotId: optionalSlotId,
  newEntityId: identities.entity("invalid-value"),
  // @ts-expect-error Persistent lifecycle values cannot contain executable functions.
  value: { evaluate: () => 1 }
});
