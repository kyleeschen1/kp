import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot,
  readKpSemanticDerivedBinding,
  readKpSemanticSlotBinding
} from "../src/semantic-state/aggregate-snapshot.ts";
import {
  createKpSemanticDerivedBindingDeclaration,
  KpSemanticDerivedBindingError
} from "../src/semantic-state/derived-binding.ts";
import {
  createKpSemanticEntityVersionStore,
  type KpPersistentSemanticValue
} from "../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../src/semantic-state/identity.ts";
import {
  beginKpSemanticTransaction
} from "../src/semantic-state/transaction.ts";

function derivedFixture() {
  const identities = createKpSemanticStateIdentityScope("test.derived-binding");
  const inputSlot = identities.slot("input");
  const outputSlot = identities.slot("output");
  const input = createKpSemanticEntityVersionStore({
    identities,
    entityId: identities.entity("input"),
    value: { value: 3 },
    sourceId: "fixture.input"
  });
  const declaration = createKpSemanticDerivedBindingDeclaration({
    identities,
    derivationId: identities.derivation("double-input"),
    slotId: outputSlot,
    dependencySlotIds: [inputSlot],
    sourceId: "lesson.double-input"
  });
  const snapshot = createKpAggregateSemanticSnapshot({
    identities,
    snapshotId: identities.initialSnapshot(),
    requiredSlotIds: [inputSlot, outputSlot],
    bindings: [{
      slotId: inputSlot,
      entityId: input.entityId,
      versionId: input.latestVersionId
    }],
    derivedBindings: [declaration],
    entityStores: [input]
  });
  return { identities, inputSlot, outputSlot, input, declaration, snapshot };
}

function numericValue(value: KpPersistentSemanticValue): number {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected an input record.");
  }
  const result = (value as Readonly<Record<string, KpPersistentSemanticValue>>)
    ["value"];
  if (typeof result !== "number") {
    throw new Error("Expected a numeric input.");
  }
  return result;
}

test("derived bindings serialize nominal identity and typed dependencies", () => {
  const fixture = derivedFixture();
  const declaration = readKpSemanticDerivedBinding(
    fixture.snapshot,
    fixture.outputSlot
  );
  assert.deepEqual(declaration, {
    schemaVersion: "kp.semantic-derived-binding.v1",
    kind: "semantic-derived-binding",
    derivationId: fixture.identities.derivation("double-input"),
    slotId: fixture.outputSlot,
    dependencies: [{
      schemaVersion: "kp.semantic-derived-dependency.v1",
      kind: "semantic-derived-dependency",
      slotId: fixture.inputSlot
    }],
    sourceId: "lesson.double-input"
  });
  assert.equal(Object.isFrozen(declaration), true);
  assert.equal(Object.isFrozen(declaration.dependencies), true);
  assert.equal(Object.isFrozen(declaration.dependencies[0]), true);
  assert.deepEqual(JSON.parse(JSON.stringify(declaration)), declaration);
});

test("derived reads fail with an explicit unsupported diagnostic", () => {
  const fixture = derivedFixture();
  const transaction = beginKpSemanticTransaction({
    identities: fixture.identities,
    before: fixture.snapshot,
    transformationId: fixture.identities.appliedTransformation(
      fixture.identities.transformation("revise-input"),
      "first"
    )
  });
  for (const read of [
    () => readKpSemanticSlotBinding(fixture.snapshot, fixture.outputSlot),
    () => transaction.read(transaction.scope, fixture.outputSlot)
  ]) {
    assert.throws(
      read,
      (error) => error instanceof KpSemanticDerivedBindingError &&
        error.code === "derived-read-unsupported" &&
        error.declaration.derivationId === fixture.declaration.derivationId
    );
  }
});

test("all transaction writes reject a derived target before staging", () => {
  const fixture = derivedFixture();
  const transaction = beginKpSemanticTransaction({
    identities: fixture.identities,
    before: fixture.snapshot,
    transformationId: fixture.identities.appliedTransformation(
      fixture.identities.transformation("invalid-derived-write"),
      "first"
    )
  });
  const writes = [
    () => transaction.update(transaction.scope, {
      id: "update.derived",
      sourceId: "fixture.invalid-update",
      revisionId: "derived",
      slotId: fixture.outputSlot,
      update(previous) {
        return previous;
      }
    }),
    () => transaction.bind(transaction.scope, {
      id: "bind.derived",
      sourceId: "fixture.invalid-bind",
      sourceSlotId: fixture.inputSlot,
      targetSlotId: fixture.outputSlot
    }),
    () => transaction.bindCopy(transaction.scope, {
      id: "copy.derived",
      sourceId: "fixture.invalid-copy",
      sourceSlotId: fixture.inputSlot,
      targetSlotId: fixture.outputSlot,
      newEntityId: fixture.identities.entity("copy")
    }),
    () => transaction.remove(transaction.scope, {
      id: "remove.derived",
      sourceId: "fixture.invalid-remove",
      slotId: fixture.outputSlot
    }),
    () => transaction.stage(transaction.scope, {
      id: "stage.derived",
      entityStoreReplacements: [],
      slotRebindings: [{
        slotId: fixture.outputSlot,
        entityId: fixture.input.entityId,
        versionId: fixture.input.latestVersionId
      }]
    })
  ];
  for (const write of writes) {
    assert.throws(
      write,
      (error) => error instanceof KpSemanticDerivedBindingError &&
        error.code === "derived-write-unsupported"
    );
  }
});

test("dependency revisions preserve the static read-only declaration", () => {
  const fixture = derivedFixture();
  const transaction = beginKpSemanticTransaction({
    identities: fixture.identities,
    before: fixture.snapshot,
    transformationId: fixture.identities.appliedTransformation(
      fixture.identities.transformation("revise-input"),
      "first"
    )
  });
  transaction.update(transaction.scope, {
    id: "update.input",
    sourceId: "lesson.revise-input",
    revisionId: "input",
    slotId: fixture.inputSlot,
    update(previous) {
      return { value: numericValue(previous) + 1 };
    }
  });
  const commit = transaction.commit(transaction.scope);
  assert.equal(commit.after.derivedBindings, commit.before.derivedBindings);
  assert.equal(commit.after.derivedBindings[0], commit.before.derivedBindings[0]);
  assert.throws(
    () => readKpSemanticSlotBinding(commit.after, fixture.outputSlot),
    (error) => error instanceof KpSemanticDerivedBindingError &&
      error.code === "derived-read-unsupported"
  );
});

test("derived declarations reject invalid and ambiguous slot contracts", () => {
  const fixture = derivedFixture();
  assert.throws(
    () => createKpSemanticDerivedBindingDeclaration({
      identities: fixture.identities,
      derivationId: fixture.identities.derivation("empty"),
      slotId: fixture.outputSlot,
      dependencySlotIds: [],
      sourceId: "fixture.empty"
    }),
    /at least one dependency/u
  );
  assert.throws(
    () => createKpSemanticDerivedBindingDeclaration({
      identities: fixture.identities,
      derivationId: fixture.identities.derivation("self"),
      slotId: fixture.outputSlot,
      dependencySlotIds: [fixture.outputSlot],
      sourceId: "fixture.self"
    }),
    /cannot depend on its own slot/u
  );
  assert.throws(
    () => createKpAggregateSemanticSnapshot({
      identities: fixture.identities,
      snapshotId: fixture.identities.initialSnapshot(),
      requiredSlotIds: [fixture.inputSlot, fixture.outputSlot],
      bindings: [
        {
          slotId: fixture.inputSlot,
          entityId: fixture.input.entityId,
          versionId: fixture.input.latestVersionId
        },
        {
          slotId: fixture.outputSlot,
          entityId: fixture.input.entityId,
          versionId: fixture.input.latestVersionId
        }
      ],
      derivedBindings: [fixture.declaration],
      entityStores: [fixture.input]
    }),
    /cannot also be bound or absent/u
  );
});

test("the declaration boundary contains no evaluator or reactive machinery", () => {
  const source = readFileSync("src/semantic-state/derived-binding.ts", "utf8");
  assert.doesNotMatch(source, /\bProxy\b|globalThis|evaluate\s*\(|cache|invalidate/u);
  assert.doesNotMatch(
    source,
    /from ["'][^"']*(?:render|timeline|animation|editor)/u
  );
});
