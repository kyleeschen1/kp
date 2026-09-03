import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpSemanticStateSchema
} from "../src/semantic-state/authoring-schema-compiler.ts";
import {
  createKpSemanticStateHandleSet,
  KpSemanticStateViewError
} from "../src/semantic-state/authoring-state-handles.ts";
import {
  materializeKpSemanticStateInitialSnapshot
} from "../src/semantic-state/authoring-state-materializer.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateOptional,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import { KpSemanticSlotAccessError } from
  "../src/semantic-state/aggregate-snapshot.ts";
import { KpSemanticDerivedBindingError } from
  "../src/semantic-state/derived-binding.ts";
import { beginKpSemanticTransaction } from
  "../src/semantic-state/transaction.ts";

test("pinned handle trees recover exact historical values", () => {
  const compiled = compileKpSemanticStateSchema("lesson.handle-market", kpStateGroup({
    market: kpStateGroup({
      supply: kpStateValue({ intercept: 2, slope: 1 }),
      demand: kpStateValue({ intercept: 12, slope: -1 })
    }),
    governmentRevenue: kpStateOptional<number>()
  }));
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const handles = createKpSemanticStateHandleSet(compiled);
  const initialView = handles.pin(initial);
  const transformationId = compiled.identityScope.appliedTransformation(
    compiled.identityScope.transformation("seller-tax"),
    "first"
  );
  const transaction = beginKpSemanticTransaction({
    identities: compiled.identityScope,
    before: initial,
    transformationId
  });
  transaction.update(transaction.scope, {
    id: "update.supply",
    sourceId: "lesson.seller-tax",
    revisionId: "taxed-supply",
    slotId: handles.refs.market.supply.slotId,
    update(previous) {
      const curve = previous as { readonly intercept: number; readonly slope: number };
      return { ...curve, intercept: curve.intercept + 4 };
    }
  });
  const after = transaction.commit(transaction.scope).after;
  const afterView = handles.pin(after);

  assert.deepEqual(initialView.market.supply.read(), {
    intercept: 2,
    slope: 1
  });
  assert.deepEqual(afterView.market.supply.read(), {
    intercept: 6,
    slope: 1
  });
  assert.equal(
    initialView.market.supply.reference,
    afterView.market.supply.reference
  );
  assert.deepEqual(handles.pin(initial).market.supply.read(), {
    intercept: 2,
    slope: 1
  });
});

test("pinned reads preserve typed absence and deferred-derived diagnostics", () => {
  const root = kpStateGroup({
    input: kpStateValue(2),
    missing: kpStateOptional<number>(),
    doubled: kpStateDerived<number>()
  });
  const compiled = compileKpSemanticStateSchema("lesson.handle-diagnostics", root);
  const input = compiled.leaves.find((leaf) => leaf.path[0] === "input");
  const doubled = compiled.leaves.find((leaf) => leaf.path[0] === "doubled");
  assert.notEqual(input, undefined);
  assert.notEqual(doubled, undefined);
  if (input === undefined || doubled === undefined) return;
  const snapshot = materializeKpSemanticStateInitialSnapshot(compiled, {
    derived: [{
      targetSlotId: doubled.identities.slotId,
      dependencySlotIds: [input.identities.slotId]
    }]
  });
  const view = createKpSemanticStateHandleSet(compiled).pin(snapshot);

  assert.throws(() => view.missing.read(), (error) => {
    assert.ok(error instanceof KpSemanticSlotAccessError);
    assert.equal(error.code, "slot-absent");
    return true;
  });
  assert.throws(() => view.doubled.read(), (error) => {
    assert.ok(error instanceof KpSemanticDerivedBindingError);
    assert.equal(error.code, "derived-read-unsupported");
    return true;
  });
});

test("handle sets reject foreign and shape-incompatible snapshots", () => {
  const compiled = compileKpSemanticStateSchema("lesson.handle-shape", kpStateGroup({
    value: kpStateValue(1)
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const foreign = compileKpSemanticStateSchema("lesson.handle-foreign", kpStateGroup({
    value: kpStateValue(1)
  }));
  assertViewError(
    () => handles.pin(materializeKpSemanticStateInitialSnapshot(foreign)),
    "foreign-snapshot"
  );

  const differentShape = compileKpSemanticStateSchema(
    "lesson.handle-shape",
    kpStateGroup({ other: kpStateValue(1) })
  );
  assertViewError(
    () => handles.pin(materializeKpSemanticStateInitialSnapshot(differentShape)),
    "snapshot-schema-mismatch"
  );

  const derivedCompiled = compileKpSemanticStateSchema(
    "lesson.handle-disposition",
    kpStateGroup({ value: kpStateDerived<number>() })
  );
  const concreteCompiled = compileKpSemanticStateSchema(
    "lesson.handle-disposition",
    kpStateGroup({ value: kpStateValue(1) })
  );
  assertViewError(
    () => createKpSemanticStateHandleSet(derivedCompiled).pin(
      materializeKpSemanticStateInitialSnapshot(concreteCompiled)
    ),
    "snapshot-schema-mismatch"
  );
});

test("typed handles are built without runtime property interception", () => {
  const source = readFileSync(
    "src/semantic-state/authoring-state-handles.ts",
    "utf8"
  );
  assert.doesNotMatch(source, /new\s+Proxy/u);
});

function assertViewError(
  run: () => unknown,
  code: KpSemanticStateViewError["code"]
): void {
  assert.throws(run, (error) => {
    assert.ok(error instanceof KpSemanticStateViewError);
    assert.equal(error.code, code);
    return true;
  });
}
