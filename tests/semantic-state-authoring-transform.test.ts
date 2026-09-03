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
import { KpSemanticTransactionError } from
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
