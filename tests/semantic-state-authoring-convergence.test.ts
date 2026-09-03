import assert from "node:assert/strict";
import test from "node:test";

import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../src/semantic-state/authoring-state-transform.ts";
import { kpStateGroup, kpStateOptional, kpStateValue } from
  "../src/semantic-state/authoring-schema.ts";
import type { KpPersistentSemanticValue } from
  "../src/semantic-state/entity-version-store.ts";
import { beginKpSemanticTransaction } from
  "../src/semantic-state/transaction.ts";
import {
  projectKpSemanticTransactionToExistingAuthority,
  type KpSemanticStateEntityDescriptor
} from "../src/semantic/semantic-state-authority-adapter.ts";

interface ValueRecord {
  readonly value: number;
}

test("facade and raw mixed transactions converge on exact authority", () => {
  const compiled = compileKpSemanticStateSchema(
    "lesson.facade-convergence",
    kpStateGroup({
      roles: kpStateGroup({
        stable: kpStateValue<ValueRecord>({ value: 1 }),
        revised: kpStateValue<ValueRecord>({ value: 2 }),
        source: kpStateValue<ValueRecord>({ value: 3 }),
        bound: kpStateValue<ValueRecord>({ value: 4 }),
        copied: kpStateValue<ValueRecord>({ value: 3 }),
        introduced: kpStateOptional<ValueRecord>(),
        removed: kpStateOptional<ValueRecord>()
      })
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const removedSlot = compiled.identityScope.slot("roles.removed");
  const setup = beginKpSemanticTransaction({
    identities: compiled.identityScope,
    before: initial,
    transformationId: compiled.identityScope.appliedTransformation(
      compiled.identityScope.transformation("prepare-removed"),
      "first"
    )
  });
  setup.introduce(setup.scope, {
    id: "prepare.removed",
    sourceId: "prepare.removed",
    slotId: removedSlot,
    newEntityId: compiled.identityScope.entity("roles.removed.seed"),
    value: { value: 5 }
  });
  const before = setup.commit(setup.scope).after;
  const definition = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "market-policy",
    author(state) {
      state.roles.revised.update(previous => ({ value: previous.value + 10 }));
      state.roles.bound.bind(state.roles.source);
      state.roles.source.update(previous => ({ value: previous.value + 1 }));
      state.roles.copied.bindCopy(state.roles.source);
      state.roles.introduced.introduce({ value: 8 });
      state.roles.removed.remove();
    }
  });
  const facade = definition.apply(before, "first").commit;

  const raw = beginKpSemanticTransaction({
    identities: compiled.identityScope,
    before,
    transformationId: compiled.identityScope.appliedTransformation(
      compiled.identityScope.transformation("market-policy"),
      "first"
    )
  });
  const slot = (name: string) => compiled.identityScope.slot(`roles.${name}`);
  raw.update(raw.scope, {
    id: "schema.roles.revised.update",
    sourceId: "schema.roles.revised.update",
    revisionId: "update",
    slotId: slot("revised"),
    update: increment(10)
  });
  raw.bind(raw.scope, {
    id: "schema.roles.bound.bind",
    sourceId: "schema.roles.bound.bind",
    sourceSlotId: slot("source"),
    targetSlotId: slot("bound")
  });
  raw.update(raw.scope, {
    id: "schema.roles.source.update",
    sourceId: "schema.roles.source.update",
    revisionId: "update",
    slotId: slot("source"),
    update: increment(1)
  });
  raw.bindCopy(raw.scope, {
    id: "schema.roles.copied.bind-copy",
    sourceId: "schema.roles.copied.bind-copy",
    sourceSlotId: slot("source"),
    targetSlotId: slot("copied"),
    newEntityId: compiled.identityScope.entity(
      "roles.copied.from.market-policy.first"
    )
  });
  raw.introduce(raw.scope, {
    id: "schema.roles.introduced.introduce",
    sourceId: "schema.roles.introduced.introduce",
    slotId: slot("introduced"),
    newEntityId: compiled.identityScope.entity(
      "roles.introduced.introduced-by.market-policy.first"
    ),
    value: { value: 8 }
  });
  raw.remove(raw.scope, {
    id: "schema.roles.removed.remove",
    sourceId: "schema.roles.removed.remove",
    slotId: removedSlot
  });
  const rawCommit = raw.commit(raw.scope);

  assert.deepEqual(facade, rawCommit);
  const descriptors = authorityDescriptors(rawCommit);
  const facadeProjection = projectKpSemanticTransactionToExistingAuthority({
    commit: facade,
    entityDescriptors: descriptors
  });
  const rawProjection = projectKpSemanticTransactionToExistingAuthority({
    commit: rawCommit,
    entityDescriptors: descriptors
  });
  assert.deepEqual(facadeProjection, rawProjection);
  assert.deepEqual(
    facadeProjection.changeSet.records.map(({ kind }) => kind),
    [
      "bound",
      "copied",
      "revised",
      "revised",
      "persisted",
      "introduced",
      "removed"
    ]
  );
  assert.deepEqual(
    new Set(facadeProjection.lineageGraph.edges.map(({ relation }) => relation)),
    new Set(["persist", "removal", "copy", "introduction"])
  );
});

function increment(amount: number) {
  return (previous: KpPersistentSemanticValue): KpPersistentSemanticValue => ({
    value: numericValue(previous) + amount
  });
}

function numericValue(value: KpPersistentSemanticValue): number {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a numeric value record.");
  }
  const result = (
    value as Readonly<Record<string, KpPersistentSemanticValue>>
  )["value"];
  if (typeof result !== "number") {
    throw new Error("Expected a numeric value field.");
  }
  return result;
}

function authorityDescriptors(
  commit: ReturnType<ReturnType<typeof beginKpSemanticTransaction>["commit"]>
): readonly KpSemanticStateEntityDescriptor[] {
  const descriptors = commit.before.entityStores.map((store) => ({
    entityId: store.entityId,
    semanticKind: "convergence-component",
    label: store.entityId.split("/").at(-1) ?? "component",
    provenance: {
      kind: "authored" as const,
      sourceId: "fixture.facade-convergence"
    }
  }));
  const introduction = commit.journal.find(
    ({ operation }) => operation.kind === "introduce"
  )?.operation;
  if (introduction?.kind !== "introduce") {
    throw new Error("Expected introduced convergence entity.");
  }
  return [...descriptors, {
    entityId: introduction.newEntityId,
    semanticKind: "convergence-component",
    label: "introduced"
  }];
}
