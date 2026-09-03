import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot,
  readKpSemanticDerivedBinding,
  readKpSemanticSlotBinding
} from
  "../src/semantic-state/aggregate-snapshot.ts";
import { defineKpSemanticStateDerivation } from
  "../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../src/semantic-state/authoring-state-transform.ts";
import {
  createKpSemanticDerivedBindingDeclaration,
  KpSemanticDerivedBindingError
} from
  "../src/semantic-state/derived-binding.ts";
import { createKpSemanticEntityVersionStore } from
  "../src/semantic-state/entity-version-store.ts";
import { createKpSemanticStateIdentityScope } from
  "../src/semantic-state/identity.ts";
import { beginKpSemanticTransaction } from
  "../src/semantic-state/transaction.ts";
import { projectKpSemanticTransactionToExistingAuthority } from
  "../src/semantic/semantic-state-authority-adapter.ts";

interface Curve {
  readonly intercept: number;
  readonly slope: number;
}

interface Crossing {
  readonly price: number;
  readonly quantity: number;
}

test("derive replaces one declaration while preserving concrete snapshot nodes", () => {
  const fixture = createFixture();
  let computeCalls = 0;
  const replacement = defineKpSemanticStateDerivation({
    compiled: fixture.compiled,
    target: fixture.handles.refs.crossing,
    dependencies: [fixture.handles.refs.left],
    compute: ([left]) => {
      computeCalls += 1;
      return { price: left.intercept, quantity: 0 };
    }
  });
  const transform = defineKpSemanticStateTransform({
    compiled: fixture.compiled,
    handles: fixture.handles,
    id: "replace-crossing",
    author(state) {
      state.crossing.derive(replacement);
    }
  });

  const applied = transform.apply(fixture.initial, "first");
  const operation = applied.commit.journal[0]?.operation;

  assert.equal(computeCalls, 0);
  assert.equal(operation?.kind, "derive");
  if (operation?.kind !== "derive") {
    throw new Error("Expected one derive operation.");
  }
  assert.equal(operation.slotId, replacement.declaration.slotId);
  assert.equal(
    applied.commit.after.bindings[0],
    applied.commit.before.bindings[0]
  );
  assert.equal(
    applied.commit.after.entityStores[0],
    applied.commit.before.entityStores[0]
  );
  assert.notEqual(
    applied.commit.after.derivedBindings,
    applied.commit.before.derivedBindings
  );
  assert.equal(
    readKpSemanticDerivedBinding(
      applied.commit.after,
      fixture.handles.refs.crossing.slotId
    ).dependencies.length,
    1
  );
  assert.throws(() => applied.after.crossing.read(), (error) =>
    error instanceof KpSemanticDerivedBindingError &&
      error.code === "derived-read-unsupported"
  );
});

test("derive introduces a declaration by retiring one concrete role", () => {
  const identities = createKpSemanticStateIdentityScope(
    "lesson.derived-introduction"
  );
  const inputSlot = identities.slot("input");
  const outputSlot = identities.slot("output");
  const inputStore = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("input"),
    value: { value: 3 },
    sourceId: "fixture.input"
  });
  const outputStore = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("output"),
    value: { value: 6 },
    sourceId: "fixture.output"
  });
  const before = createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [inputSlot, outputSlot],
    bindings: [
      {
        slotId: inputSlot,
        entityId: inputStore.entityId,
        versionId: inputStore.latestVersionId
      },
      {
        slotId: outputSlot,
        entityId: outputStore.entityId,
        versionId: outputStore.latestVersionId
      }
    ],
    entityStores: [inputStore, outputStore]
  });
  const declaration = createKpSemanticDerivedBindingDeclaration({
    identities,
    derivationId: identities.derivation("double-input"),
    slotId: outputSlot,
    dependencySlotIds: [inputSlot],
    sourceId: "lesson.double-input"
  });
  const transaction = beginKpSemanticTransaction({
    identities,
    before,
    transformationId: identities.appliedTransformation(
      identities.transformation("derive-output"),
      "first"
    )
  });

  transaction.derive(transaction.scope, {
    id: "derive.output",
    sourceId: "lesson.derive-output",
    declaration
  });
  const commit = transaction.commit(transaction.scope);
  const operation = commit.journal[0]?.operation;

  assert.equal(operation?.kind, "derive");
  if (operation?.kind !== "derive") {
    throw new Error("Expected one derive operation.");
  }
  assert.equal(operation.slotId, declaration.slotId);
  assert.equal(
    readKpSemanticSlotBinding(before, outputSlot).entityId,
    outputStore.entityId
  );
  assert.throws(
    () => readKpSemanticSlotBinding(commit.after, outputSlot),
    (error) => error instanceof KpSemanticDerivedBindingError &&
      error.code === "derived-read-unsupported"
  );
  assert.deepEqual(
    readKpSemanticDerivedBinding(commit.after, outputSlot),
    declaration
  );
  assert.equal(commit.after.bindings[0], commit.before.bindings[0]);
  assert.equal(commit.after.entityStores[0], commit.before.entityStores[0]);

  const projection = projectKpSemanticTransactionToExistingAuthority({
    commit,
    entityDescriptors: [
      {
        entityId: inputStore.entityId,
        semanticKind: "input",
        label: "input",
        provenance: { kind: "authored", sourceId: "fixture.input" }
      },
      {
        entityId: outputStore.entityId,
        semanticKind: "output",
        label: "output",
        provenance: { kind: "authored", sourceId: "fixture.output" }
      }
    ]
  });
  assert.deepEqual(projection.changeSet.records.map(({ kind }) => kind), [
    "persisted",
    "removed",
    "derived-binding"
  ]);
});

test("derived replacement projects exact before and after declaration authority", () => {
  const fixture = createFixture();
  const replacement = defineKpSemanticStateDerivation({
    compiled: fixture.compiled,
    target: fixture.handles.refs.crossing,
    dependencies: [fixture.handles.refs.right],
    compute: ([right]) => ({
      price: right.intercept,
      quantity: 0
    })
  });
  const transform = defineKpSemanticStateTransform({
    compiled: fixture.compiled,
    handles: fixture.handles,
    id: "rebind-crossing",
    author(state) {
      state.crossing.derive(replacement);
    }
  });
  const applied = transform.apply(fixture.initial, "first");
  const projection = projectKpSemanticTransactionToExistingAuthority({
    commit: applied.commit,
    entityDescriptors: fixture.compiled.leaves.flatMap((leaf) =>
      leaf.descriptor.kind === "derived-value"
        ? []
        : [{
          entityId: leaf.identities.initialEntityId,
          semanticKind: "curve",
          label: leaf.encodedPath,
          provenance: {
            kind: "authored" as const,
            sourceId: leaf.identities.sourceIds.initialValue
          }
        }]
    )
  });

  assert.deepEqual(projection.changeSet.records.map(({ kind }) => kind), [
    "persisted",
    "persisted",
    "derived-binding"
  ]);
  const bindingChange = projection.changeSet.records.find(
    (record) => record.kind === "derived-binding"
  );
  if (bindingChange?.kind !== "derived-binding") {
    throw new Error("Expected one derived-binding change.");
  }
  assert.equal(
    bindingChange.previous,
    fixture.initial.derivedBindings[0]
  );
  assert.equal(
    bindingChange.next,
    applied.commit.after.derivedBindings[0]
  );
  assert.ok(projection.correspondenceMap.records.every(
    (record) => record.relation === "identity"
  ));
  assert.ok(projection.lineageGraph.edges.every(
    (edge) => edge.relation === "persist"
  ));
});

test("derive rejects an unchanged declaration without staging partial state", () => {
  const fixture = createFixture();
  const transform = defineKpSemanticStateTransform({
    compiled: fixture.compiled,
    handles: fixture.handles,
    id: "repeat-crossing",
    author(state) {
      state.crossing.derive(fixture.initialDefinition);
    }
  });

  assert.throws(
    () => transform.apply(fixture.initial, "first"),
    /must change its explicit declaration/u
  );
  assert.equal(
    readKpSemanticDerivedBinding(
      fixture.initial,
      fixture.handles.refs.crossing.slotId
    ).dependencies.length,
    2
  );
  assert.equal(fixture.initial.bindings.length, 2);
});

function createFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.derived-operation",
    kpStateGroup({
      left: kpStateValue<Curve>({ intercept: 2, slope: 1 }),
      right: kpStateValue<Curve>({ intercept: 12, slope: -1 }),
      crossing: kpStateDerived<Crossing>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const initialDefinition = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.crossing,
    dependencies: [handles.refs.left, handles.refs.right],
    compute: ([left, right]) => ({
      price: (left.intercept + right.intercept) / 2,
      quantity: (right.intercept - left.intercept) / 2
    })
  });
  return Object.freeze({
    compiled,
    handles,
    initialDefinition,
    initial: materializeKpSemanticStateInitialSnapshot(compiled, {
      derivations: [initialDefinition]
    })
  });
}
