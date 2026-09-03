import assert from "node:assert/strict";
import test from "node:test";

import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import {
  defineKpSemanticStateTransform,
  KpSemanticStateTransformError,
  type KpSemanticStateOperationLeafHandle
} from "../src/semantic-state/authoring-state-transform.ts";
import { kpStateGroup, kpStateValue } from
  "../src/semantic-state/authoring-schema.ts";
import {
  beginKpSemanticTransaction,
  KpSemanticTransactionError
} from
  "../src/semantic-state/transaction.ts";

test("transform definitions derive identity without callback-order authority", () => {
  const fixture = createFixture();
  const first = defineKpSemanticStateTransform({
    ...fixture,
    id: "inspect-market",
    author(state) {
      state.market.demand.read();
      state.market.supply.read();
    }
  });
  const second = defineKpSemanticStateTransform({
    ...fixture,
    id: "inspect-market",
    author(state) {
      state.market.supply.read();
      state.market.demand.read();
    }
  });

  assert.equal(first.id, second.id);
  assert.equal(
    first.id,
    "kp-state/lesson.transform-shell/transformation/inspect-market"
  );
  assert.equal(first.localId, "inspect-market");
});

test("an empty transform aborts and expires every scoped handle", () => {
  const fixture = createFixture();
  let captured: KpSemanticStateOperationLeafHandle<
    { readonly intercept: number; readonly slope: number },
    "required-value"
  > | undefined;
  const definition = defineKpSemanticStateTransform({
    ...fixture,
    id: "empty-market",
    author(state) {
      captured = state.market.supply;
      assert.equal(state.market.supply.read().intercept, 2);
    }
  });

  assert.throws(() => definition.apply(fixture.initial, "first"), (error) => {
    assert.ok(error instanceof KpSemanticStateTransformError);
    assert.equal(error.code, "empty-transform");
    return true;
  });
  assert.notEqual(captured, undefined);
  assert.throws(() => captured?.read(), (error) => {
    assert.ok(error instanceof KpSemanticTransactionError);
    assert.equal(error.code, "scope-expired");
    return true;
  });
  assert.equal(fixture.initial.entityStores[0]?.versions.length, 1);
});

test("author failures abort without replacing their local diagnostic", () => {
  const fixture = createFixture();
  const authoredError = new Error("author stopped");
  const definition = defineKpSemanticStateTransform({
    ...fixture,
    id: "failing-market",
    author() {
      throw authoredError;
    }
  });

  assert.throws(
    () => definition.apply(fixture.initial, "first"),
    (error) => error === authoredError
  );
  assert.equal(fixture.initial.entityStores[0]?.versions.length, 1);
});

test("non-void callback results cannot become hidden transform state", () => {
  const fixture = createFixture();
  const definition = defineKpSemanticStateTransform({
    ...fixture,
    id: "async-market",
    author: (() => Promise.resolve()) as () => void
  });

  assert.throws(() => definition.apply(fixture.initial, "first"), (error) => {
    assert.ok(error instanceof KpSemanticStateTransformError);
    assert.equal(error.code, "unsupported-callback-result");
    return true;
  });
});

test("update compiles to one deterministic same-entity revision", () => {
  const fixture = createFixture();
  const seen: unknown[] = [];
  const definition = defineKpSemanticStateTransform({
    ...fixture,
    id: "raise-supply",
    author(state) {
      state.market.supply.update(previous => {
        seen.push(previous);
        assert.equal(Object.isFrozen(previous), true);
        return { ...previous, intercept: previous.intercept + 4 };
      });
    }
  });

  const application = definition.apply(fixture.initial, "first");

  assert.equal(seen.length, 2);
  assert.equal(seen[0], seen[1]);
  assert.deepEqual(application.before.market.supply.read(), {
    intercept: 2,
    slope: 1
  });
  assert.deepEqual(application.after.market.supply.read(), {
    intercept: 6,
    slope: 1
  });
  assert.deepEqual(fixture.handles.pin(fixture.initial).market.supply.read(), {
    intercept: 2,
    slope: 1
  });
  assert.equal(application.commit.journal.length, 1);
  const operation = application.commit.journal[0]?.operation;
  assert.equal(operation?.kind, "update");
  assert.deepEqual(operation, {
    kind: "update",
    sourceId: "schema.market.supply.update",
    revisionId: "update",
    slotId: fixture.compiled.identityScope.slot("market.supply"),
    previousVersionId:
      "kp-state/lesson.transform-shell/entity/initial.market.supply/version/initial",
    nextVersionId:
      "kp-state/lesson.transform-shell/entity/initial.market.supply/version/from/raise-supply/application/first/revision/update"
  });
});

test("update through an existing alias advances every shared role", () => {
  const fixture = createFixture();
  const aliasDefinition = fixture.compiled.identityScope
    .transformation("prepare-alias");
  const aliasTransaction = beginKpSemanticTransaction({
    identities: fixture.compiled.identityScope,
    before: fixture.initial,
    transformationId: fixture.compiled.identityScope.appliedTransformation(
      aliasDefinition,
      "first"
    )
  });
  aliasTransaction.bind(aliasTransaction.scope, {
    id: "prepare.alias",
    sourceId: "prepare.alias",
    sourceSlotId: fixture.compiled.identityScope.slot("market.supply"),
    targetSlotId: fixture.compiled.identityScope.slot("market.demand")
  });
  const aliased = aliasTransaction.commit(aliasTransaction.scope).after;
  const definition = defineKpSemanticStateTransform({
    ...fixture,
    id: "raise-through-demand",
    author(state) {
      state.market.demand.update(previous => ({
        ...previous,
        intercept: previous.intercept + 5
      }));
    }
  });

  const application = definition.apply(aliased, "first");

  assert.equal(application.before.market.supply.read().intercept, 2);
  assert.equal(application.before.market.demand.read().intercept, 2);
  assert.equal(application.after.market.supply.read().intercept, 7);
  assert.equal(application.after.market.demand.read().intercept, 7);
  assert.equal(
    application.commit.after.bindings[0]?.versionId,
    application.commit.after.bindings[1]?.versionId
  );
});

test("nondeterministic update results abort without changing the input", () => {
  const fixture = createFixture();
  let counter = 0;
  const definition = defineKpSemanticStateTransform({
    ...fixture,
    id: "unstable-supply",
    author(state) {
      state.market.supply.update(previous => ({
        ...previous,
        intercept: previous.intercept + counter++
      }));
    }
  });

  assert.throws(() => definition.apply(fixture.initial, "first"), (error) => {
    assert.ok(error instanceof KpSemanticTransactionError);
    assert.equal(error.code, "nondeterministic-update");
    return true;
  });
  assert.equal(
    fixture.handles.pin(fixture.initial).market.supply.read().intercept,
    2
  );
  assert.equal(fixture.initial.entityStores[0]?.versions.length, 1);
});

test("bind shares exact identity and later updates advance both roles", () => {
  const fixture = createFixture();
  const definition = defineKpSemanticStateTransform({
    ...fixture,
    id: "share-market-curve",
    author(state) {
      state.market.demand.bind(state.market.supply);
      state.market.supply.update(previous => ({
        ...previous,
        intercept: previous.intercept + 3
      }));
    }
  });

  const application = definition.apply(fixture.initial, "first");
  const supplyBinding = application.commit.after.bindings.find(
    ({ slotId }) => slotId ===
      fixture.compiled.identityScope.slot("market.supply")
  );
  const demandBinding = application.commit.after.bindings.find(
    ({ slotId }) => slotId ===
      fixture.compiled.identityScope.slot("market.demand")
  );

  assert.equal(application.before.market.supply.read().intercept, 2);
  assert.equal(application.before.market.demand.read().intercept, 12);
  assert.equal(application.after.market.supply.read().intercept, 5);
  assert.equal(application.after.market.demand.read().intercept, 5);
  assert.equal(supplyBinding?.entityId, demandBinding?.entityId);
  assert.equal(supplyBinding?.versionId, demandBinding?.versionId);
  assert.deepEqual(
    application.commit.journal.map(({ operation }) => operation.kind),
    ["bind", "update"]
  );
  assert.equal(
    application.commit.journal[0]?.writeId,
    "schema.market.demand.bind"
  );
});

test("bind rejects self-aliasing and an already shared target", () => {
  const fixture = createFixture();
  const selfBind = defineKpSemanticStateTransform({
    ...fixture,
    id: "self-bind",
    author(state) {
      state.market.supply.bind(state.market.supply);
    }
  });
  assert.throws(() => selfBind.apply(fixture.initial, "first"), (error) => {
    assert.ok(error instanceof KpSemanticTransactionError);
    assert.equal(error.code, "invalid-bind");
    return true;
  });

  const bind = defineKpSemanticStateTransform({
    ...fixture,
    id: "bind-once",
    author(state) {
      state.market.demand.bind(state.market.supply);
    }
  });
  const first = bind.apply(fixture.initial, "first");
  assert.throws(() => bind.apply(first.commit.after, "second"), (error) => {
    assert.ok(error instanceof KpSemanticTransactionError);
    assert.equal(error.code, "invalid-bind");
    return true;
  });
});

test("bind sources cannot leak across transform application scopes", () => {
  const fixture = createFixture();
  let captured: KpSemanticStateOperationLeafHandle<
    { readonly intercept: number; readonly slope: number },
    "required-value"
  > | undefined;
  const capture = defineKpSemanticStateTransform({
    ...fixture,
    id: "capture-source",
    author(state) {
      captured = state.market.supply;
      state.market.supply.update(previous => ({
        ...previous,
        intercept: previous.intercept + 1
      }));
    }
  });
  const first = capture.apply(fixture.initial, "first");
  const reuse = defineKpSemanticStateTransform({
    ...fixture,
    id: "reuse-source",
    author(state) {
      assert.notEqual(captured, undefined);
      state.market.demand.bind(captured!);
    }
  });

  assert.throws(() => reuse.apply(first.commit.after, "first"), (error) => {
    assert.ok(error instanceof KpSemanticStateTransformError);
    assert.equal(error.code, "foreign-operation-handle");
    return true;
  });
});

function createFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.transform-shell",
    kpStateGroup({
      market: kpStateGroup({
        supply: kpStateValue({ intercept: 2, slope: 1 }),
        demand: kpStateValue({ intercept: 12, slope: -1 })
      })
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  return {
    compiled,
    handles,
    initial: materializeKpSemanticStateInitialSnapshot(compiled)
  };
}
