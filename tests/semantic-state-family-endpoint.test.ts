import assert from "node:assert/strict";
import test from "node:test";

import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import { kpStateGroup, kpStateValue } from
  "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import {
  defineKpSemanticStateTransform
} from "../src/semantic-state/authoring-state-transform.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";
import {
  createKpSemanticSnapshotRecoveryIndex,
  pinKpAggregateSemanticSnapshot,
  recoverKpPinnedSnapshot
} from "../src/semantic-state/pinned-recovery.ts";
import {
  projectKpSemanticTransactionToExistingAuthority
} from "../src/semantic/semantic-state-authority-adapter.ts";

test("family application is the ordinary persistent transform application", () => {
  const fixture = createFixture();
  const family = createFamily(fixture);
  const applied = family.apply(fixture.initial, {
    applicationId: "first",
    parameters: { delta: 3 },
    sourceId: "lesson.family-endpoint.application.first"
  });
  const ordinary = defineKpSemanticStateTransform({
    compiled: fixture.compiled,
    handles: fixture.handles,
    id: "raise-amount",
    author(state) {
      state.amount.update(previous => previous + 3);
    }
  }).apply(fixture.initial, "first");

  assert.deepEqual(applied.commit, ordinary.commit);
  assert.equal(applied.commit, applied.endpointApplication.commit);
  assert.equal(applied.commit.before, fixture.initial);
  assert.equal(applied.before.amount.read(), 2);
  assert.equal(applied.after.amount.read(), 5);
  assert.equal(applied.before.stable.read(), "unchanged");
  assert.equal(applied.after.stable.read(), "unchanged");
  assert.equal(applied.definitionId, ordinary.definitionId);
  assert.equal(applied.transformationId, ordinary.transformationId);
});

test("endpoint application preserves sharing projection and direct recovery", () => {
  const fixture = createFixture();
  const applied = createFamily(fixture).apply(fixture.initial, {
    applicationId: "authority",
    parameters: { delta: 4 },
    sourceId: "lesson.family-endpoint.application.authority"
  });
  const stableSlot = fixture.handles.refs.stable.slotId;
  const stableBefore = fixture.initial.bindings[
    fixture.initial.bindingIndex[stableSlot]!
  ]!;
  const stableAfter = applied.commit.after.bindings[
    applied.commit.after.bindingIndex[stableSlot]!
  ]!;
  const stableStoreBefore = fixture.initial.entityStores[
    fixture.initial.entityIndex[stableBefore.entityId]!
  ]!;
  const stableStoreAfter = applied.commit.after.entityStores[
    applied.commit.after.entityIndex[stableAfter.entityId]!
  ]!;
  assert.equal(stableBefore, stableAfter);
  assert.equal(stableStoreBefore, stableStoreAfter);

  const projection = projectKpSemanticTransactionToExistingAuthority({
    commit: applied.commit,
    entityDescriptors: fixture.compiled.leaves.map((leaf) => ({
      entityId: leaf.identities.initialEntityId,
      semanticKind: "family-endpoint-value",
      label: leaf.encodedPath,
      provenance: {
        kind: "authored" as const,
        sourceId: leaf.identities.sourceIds.initialValue
      }
    }))
  });
  assert.deepEqual(projection.changeSet.records.map(({ kind }) => kind), [
    "revised",
    "persisted"
  ]);
  assert.equal(projection.transactionId, applied.commit.transactionId);
  assert.equal(projection.correspondenceMap.records.length, 2);
  assert.equal(projection.lineageGraph.edges.length, 2);

  const recovery = createKpSemanticSnapshotRecoveryIndex([
    applied.commit.before,
    applied.commit.after
  ]);
  assert.equal(
    recoverKpPinnedSnapshot(
      recovery,
      pinKpAggregateSemanticSnapshot(applied.commit.before)
    ),
    fixture.initial
  );
  assert.equal(
    recoverKpPinnedSnapshot(
      recovery,
      pinKpAggregateSemanticSnapshot(applied.commit.after)
    ),
    applied.commit.after
  );
});

test("family author failure aborts without exposing an application", () => {
  const fixture = createFixture();
  const failure = new Error("family author stopped");
  const transition = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: "lesson.family-endpoint.amount",
    target: fixture.handles.refs.amount
  });
  const family = defineKpSemanticStateFamily({
    compiled: fixture.compiled,
    handles: fixture.handles,
    id: "raise-amount-failure",
    sourceId: "lesson.family-endpoint.raise-amount-failure",
    parameters: kpStateFamilyParameters<{ readonly delta: number }>(),
    transitions: builder => [
      builder.interpolate(transition, ({ before }) => before)
    ] as const,
    author() {
      throw failure;
    }
  });

  assert.throws(() => family.apply(fixture.initial, {
    applicationId: "failure",
    parameters: { delta: 3 },
    sourceId: "lesson.family-endpoint.application.failure"
  }), (error) => error === failure);
  assert.equal(fixture.handles.pin(fixture.initial).amount.read(), 2);
  assert.equal(fixture.initial.entityStores.every(
    store => store.versions.length === 1
  ), true);
});

function createFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.family-endpoint",
    kpStateGroup({
      amount: kpStateValue<number>(2),
      stable: kpStateValue("unchanged")
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  return {
    compiled,
    handles,
    initial: materializeKpSemanticStateInitialSnapshot(compiled)
  };
}

function createFamily(fixture: ReturnType<typeof createFixture>) {
  const transition = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: "lesson.family-endpoint.amount",
    target: fixture.handles.refs.amount
  });
  return defineKpSemanticStateFamily({
    compiled: fixture.compiled,
    handles: fixture.handles,
    id: "raise-amount",
    sourceId: "lesson.family-endpoint.raise-amount",
    parameters: kpStateFamilyParameters<{ readonly delta: number }>(),
    transitions: builder => [
      builder.interpolate(transition, ({ before }) => before)
    ] as const,
    author(parameters, state) {
      state.amount.update(previous => previous + parameters.delta);
    }
  });
}
