import assert from "node:assert/strict";
import test from "node:test";

import {
  appendKpSemanticEntityVersion,
  createKpSemanticEntityVersionStore,
  readKpSemanticEntityVersion,
  readLatestKpSemanticEntityVersion
} from "../src/semantic-state/entity-version-store.ts";
import {
  createKpSemanticStateIdentityScope
} from "../src/semantic-state/identity.ts";

function marketFixture() {
  const identities = createKpSemanticStateIdentityScope("test.market-state");
  const transformation = identities.transformation("add-tax");
  return {
    identities,
    entityId: identities.entity("market"),
    addTax: identities.appliedTransformation(transformation, 0)
  };
}

test("entity stores isolate and freeze their initial value", () => {
  const fixture = marketFixture();
  const input = {
    tax: { numerator: 0n, denominator: 1n },
    labels: ["supply", "demand"]
  };
  const store = createKpSemanticEntityVersionStore({
    identities: fixture.identities,
    entityId: fixture.entityId,
    value: input,
    sourceId: "fixture.market.baseline"
  });
  input.tax.numerator = 5n;
  input.labels.push("taxed-supply");

  const initial = readLatestKpSemanticEntityVersion(store);
  assert.deepEqual(initial.value, {
    tax: { numerator: 0n, denominator: 1n },
    labels: ["supply", "demand"]
  });
  assert.notEqual(initial.value, input);
  assert.equal(Object.isFrozen(store), true);
  assert.equal(Object.isFrozen(store.versions), true);
  assert.equal(Object.isFrozen(store.versionIndex), true);
  assert.equal(Object.isFrozen(initial), true);
  assert.equal(Object.isFrozen(initial.value), true);
  assert.equal(Object.isFrozen(initial.value.tax), true);
  assert.equal(Object.isFrozen(initial.value.labels), true);
  assert.equal(
    Reflect.set(initial.value.tax, "numerator", 9n),
    false
  );
});

test("successors retain entity identity and explicit provenance", () => {
  const fixture = marketFixture();
  const initialStore = createKpSemanticEntityVersionStore({
    identities: fixture.identities,
    entityId: fixture.entityId,
    value: { tax: 0 },
    sourceId: "fixture.market.baseline"
  });
  const successorStore = appendKpSemanticEntityVersion(initialStore, {
    value: { tax: 4 },
    transformationId: fixture.addTax
  });
  const initial = readLatestKpSemanticEntityVersion(initialStore);
  const successor = readLatestKpSemanticEntityVersion(successorStore);

  assert.equal(initialStore.versions.length, 1);
  assert.equal(successorStore.versions.length, 2);
  assert.equal(successor.entityId, initial.entityId);
  assert.equal(successor.ordinal, 1);
  assert.equal(successor.value.tax, 4);
  assert.deepEqual(successor.provenance, {
    kind: "successor",
    previousVersionId: initial.id,
    transformationId: fixture.addTax
  });
  assert.equal(successorStore.versions[0], initialStore.versions[0]);
  assert.equal(readLatestKpSemanticEntityVersion(initialStore).value.tax, 0);
});

test("materialized versions recover directly without transformation replay", () => {
  const fixture = marketFixture();
  const initialStore = createKpSemanticEntityVersionStore({
    identities: fixture.identities,
    entityId: fixture.entityId,
    value: { tax: 0 },
    sourceId: "fixture.market.baseline"
  });
  const nextStore = appendKpSemanticEntityVersion(initialStore, {
    value: { tax: 4 },
    transformationId: fixture.addTax
  });
  const initialId = initialStore.latestVersionId;

  assert.equal(readKpSemanticEntityVersion(nextStore, initialId).value.tax, 0);
  assert.equal(
    nextStore.versionIndex[initialId],
    0,
    "recovery uses the committed version index"
  );
  assert.throws(
    () => readKpSemanticEntityVersion(
      nextStore,
      fixture.identities.version(fixture.identities.entity("supply"), 0)
    ),
    /does not belong to entity/u
  );
});

test("stores reject mutable executable values and foreign transformations", () => {
  const fixture = marketFixture();
  const foreign = createKpSemanticStateIdentityScope("test.foreign-state");
  const store = createKpSemanticEntityVersionStore({
    identities: fixture.identities,
    entityId: fixture.entityId,
    value: { tax: 0 },
    sourceId: "fixture.market.baseline"
  });

  assert.throws(
    () => createKpSemanticEntityVersionStore({
      identities: fixture.identities,
      entityId: fixture.entityId,
      value: { evaluate: (() => 1) } as never,
      sourceId: "fixture.market.executable"
    }),
    /structural data, not function/u
  );
  assert.throws(
    () => appendKpSemanticEntityVersion(store, {
      value: { tax: 1 },
      transformationId: foreign.appliedTransformation(
        foreign.transformation("add-tax"),
        0
      )
    }),
    /does not belong to entity scope/u
  );
});
