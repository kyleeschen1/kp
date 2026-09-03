import assert from "node:assert/strict";
import test from "node:test";

import { KpSemanticSlotAccessError } from
  "../src/semantic-state/aggregate-snapshot.ts";
import { defineKpSemanticStateDerivation } from
  "../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateOptional,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../src/semantic-state/authoring-state-transform.ts";
import {
  evaluateKpSemanticDerivedValue,
  KpSemanticDerivedEvaluationError,
  resolveKpSemanticConcreteDependency
} from "../src/semantic-state/derived-evaluator.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput,
  type KpSemanticDerivedGraphLeafReference
} from "../src/semantic-state/derived-graph.ts";
import type { KpPersistentSemanticValue } from
  "../src/semantic-state/entity-version-store.ts";

test("concrete resolution retains exact alias and copy authority", () => {
  const fixture = createFixture();
  const source = resolve(fixture, fixture.shared, "source");
  const alias = resolve(fixture, fixture.shared, "alias");
  const copy = resolve(fixture, fixture.shared, "copy");

  assert.equal(source.snapshotId, fixture.shared.id);
  assert.equal(alias.entityId, source.entityId);
  assert.equal(alias.versionId, source.versionId);
  assert.equal(alias.value, source.value);
  assert.notEqual(copy.entityId, source.entityId);
  assert.deepEqual(copy.value, source.value);
  assert.notEqual(copy.value, source.value);
  assert.equal(readAmount(source.value), 2);
  assert.ok(Object.isFrozen(source));
});

test("one pinned snapshot never follows a newer alias revision", () => {
  const fixture = createFixture();
  const historical = resolve(fixture, fixture.shared, "source");
  const current = resolve(fixture, fixture.updated, "source");
  const currentAlias = resolve(fixture, fixture.updated, "alias");
  const currentCopy = resolve(fixture, fixture.updated, "copy");

  assert.notEqual(current.versionId, historical.versionId);
  assert.equal(readAmount(historical.value), 2);
  assert.equal(readAmount(current.value), 5);
  assert.equal(currentAlias.entityId, current.entityId);
  assert.equal(currentAlias.versionId, current.versionId);
  assert.equal(currentCopy.entityId, resolve(
    fixture,
    fixture.shared,
    "copy"
  ).entityId);
  assert.equal(readAmount(currentCopy.value), 2);
  assert.deepEqual(resolve(fixture, fixture.shared, "source"), historical);
});

test("optional absence stays an explicit pinned snapshot diagnostic", () => {
  const fixture = createFixture();
  assert.throws(
    () => resolve(fixture, fixture.shared, "optional"),
    (error) => error instanceof KpSemanticDerivedEvaluationError &&
      error.code === "derived-dependency-absent" &&
      error.slotId === fixture.handles.refs.optional.slotId &&
      error.cause instanceof KpSemanticSlotAccessError &&
      error.cause.code === "slot-absent"
  );
});

test("derived and foreign snapshots cannot enter concrete resolution", () => {
  const fixture = createFixture();
  const derivedTarget = fixture.graph.input.definitions[0]?.target;
  if (derivedTarget === undefined) {
    throw new Error("Expected the evaluator fixture derived target.");
  }
  assert.throws(
    () => resolveKpSemanticConcreteDependency({
      graph: fixture.graph,
      snapshot: fixture.shared,
      dependency: derivedTarget
    }),
    (error) => error instanceof KpSemanticDerivedEvaluationError &&
      error.code === "derived-dependency-not-concrete"
  );

  const foreign = createFixture("lesson.foreign-derived-evaluator");
  assert.throws(
    () => resolveKpSemanticConcreteDependency({
      graph: fixture.graph,
      snapshot: foreign.initial,
      dependency: dependencyFor(fixture, "source")
    }),
    (error) => error instanceof KpSemanticDerivedEvaluationError &&
      error.code === "foreign-derived-snapshot"
  );
});

test("one requested derived value evaluates from concrete dependencies", () => {
  const fixture = createNestedFixture("lesson.single-derived-evaluator");

  assert.equal(evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot: fixture.snapshot,
    target: fixture.handles.refs.doubled
  }), 6);
  assert.deepEqual(fixture.calls, { doubled: 1, summary: 0 });
});

test("nested derived dependencies evaluate in declared tuple order", () => {
  const fixture = createNestedFixture("lesson.nested-derived-evaluator");

  const result = evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot: fixture.snapshot,
    target: fixture.handles.refs.summary
  });
  assert.deepEqual(result, { amount: 9, label: "3 + 6" });
  assert.ok(Object.isFrozen(result));
  assert.deepEqual(fixture.calls, { doubled: 1, summary: 1 });
});

test("one requested diamond closure excludes independent definitions", () => {
  const fixture = createDiamondFixture();

  assert.equal(evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot: fixture.snapshot,
    target: fixture.handles.refs.total
  }), 12);
  assert.deepEqual(fixture.calls, {
    shared: 1,
    left: 1,
    right: 1,
    total: 1,
    independent: 0
  });
});

test("compute failures identify their exact target without partial escape", () => {
  const fixture = createFailureFixture();

  assert.throws(
    () => evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      snapshot: fixture.snapshot,
      target: fixture.handles.refs.total
    }),
    (error) => error instanceof KpSemanticDerivedEvaluationError &&
      error.code === "derived-compute-failed" &&
      error.slotId === fixture.handles.refs.failure.slotId &&
      error.path?.join(".") === "failure" &&
      error.cause === fixture.failure
  );
  assert.deepEqual(fixture.calls, { first: 1, failure: 1, total: 0 });
});

test("invalid derived results fail before becoming observable values", () => {
  const fixture = createInvalidResultFixture();

  assert.throws(
    () => evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      snapshot: fixture.snapshot,
      target: fixture.handles.refs.invalid
    }),
    (error) => error instanceof KpSemanticDerivedEvaluationError &&
      error.code === "invalid-derived-result" &&
      error.slotId === fixture.handles.refs.invalid.slotId &&
      error.path?.join(".") === "invalid" &&
      error.cause instanceof Error
  );
});

function createFixture(namespace = "lesson.derived-evaluator") {
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    source: kpStateValue({ amount: 2 }),
    alias: kpStateValue({ amount: 9 }),
    copy: kpStateValue({ amount: 7 }),
    optional: kpStateOptional<{ readonly amount: number }>(),
    total: kpStateDerived<number>()
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [
      handles.refs.source,
      handles.refs.alias,
      handles.refs.copy,
      handles.refs.optional
    ],
    compute: ([source, alias, copy, optional]) =>
      source.amount + alias.amount + copy.amount + optional.amount
  });
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [total]
  });
  const shareAndCopy = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "share-and-copy",
    author(state) {
      state.alias.bind(state.source);
      state.copy.bindCopy(state.source);
    }
  });
  const shared = shareAndCopy.apply(initial, "first").commit.after;
  const update = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "update-source",
    author(state) {
      state.source.update(({ amount }) => ({ amount: amount + 3 }));
    }
  });
  const updated = update.apply(shared, "first").commit.after;
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [total])
  );
  return { compiled, handles, total, initial, shared, updated, graph };
}

function resolve(
  fixture: ReturnType<typeof createFixture>,
  snapshot: ReturnType<typeof createFixture>["initial"],
  encodedPath: "source" | "alias" | "copy" | "optional"
) {
  return resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    snapshot,
    dependency: dependencyFor(fixture, encodedPath)
  });
}

function dependencyFor(
  fixture: ReturnType<typeof createFixture>,
  encodedPath: "source" | "alias" | "copy" | "optional"
): KpSemanticDerivedGraphLeafReference {
  const dependency = fixture.graph.input.edges.find(({ dependency }) =>
    dependency.encodedPath === encodedPath
  )?.dependency;
  if (dependency === undefined) {
    throw new Error(`Missing evaluator dependency ${encodedPath}.`);
  }
  return dependency;
}

function readAmount(value: KpPersistentSemanticValue): number {
  if (value === null || typeof value !== "object" ||
      Array.isArray(value) || !("amount" in value) ||
      typeof value["amount"] !== "number") {
    throw new Error("Expected an amount record.");
  }
  return value["amount"];
}

function createNestedFixture(namespace: string) {
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    base: kpStateValue({ amount: 3 }),
    doubled: kpStateDerived<number>(),
    summary: kpStateDerived<{
      readonly amount: number;
      readonly label: string;
    }>()
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const calls = { doubled: 0, summary: 0 };
  const doubled = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.doubled,
    dependencies: [handles.refs.base],
    compute: ([base]) => {
      calls.doubled += 1;
      return base.amount * 2;
    }
  });
  const summary = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.summary,
    dependencies: [handles.refs.base, handles.refs.doubled],
    compute: ([base, derived]) => {
      calls.summary += 1;
      return {
        amount: base.amount + derived,
        label: `${base.amount} + ${derived}`
      };
    }
  });
  const snapshot = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [summary, doubled]
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [summary, doubled])
  );
  return { compiled, handles, calls, doubled, summary, snapshot, graph };
}

function createDiamondFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.requested-derived-closure",
    kpStateGroup({
      base: kpStateValue(2),
      shared: kpStateDerived<number>(),
      left: kpStateDerived<number>(),
      right: kpStateDerived<number>(),
      total: kpStateDerived<number>(),
      independent: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const calls = { shared: 0, left: 0, right: 0, total: 0, independent: 0 };
  const shared = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.shared,
    dependencies: [handles.refs.base],
    compute: ([base]) => {
      calls.shared += 1;
      return base * 2;
    }
  });
  const left = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.left,
    dependencies: [handles.refs.shared],
    compute: ([value]) => {
      calls.left += 1;
      return value + 1;
    }
  });
  const right = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.right,
    dependencies: [handles.refs.shared],
    compute: ([value]) => {
      calls.right += 1;
      return value + 3;
    }
  });
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.left, handles.refs.right],
    compute: ([leftValue, rightValue]) => {
      calls.total += 1;
      return leftValue + rightValue;
    }
  });
  const independent = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.independent,
    dependencies: [handles.refs.base],
    compute: ([base]) => {
      calls.independent += 1;
      return base * 100;
    }
  });
  const definitions = [independent, total, right, left, shared];
  const snapshot = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: definitions
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, definitions)
  );
  return { compiled, handles, calls, snapshot, graph };
}

function createFailureFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.derived-compute-failure",
    kpStateGroup({
      base: kpStateValue(2),
      first: kpStateDerived<number>(),
      failure: kpStateDerived<number>(),
      total: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const calls = { first: 0, failure: 0, total: 0 };
  const failure = new Error("fixture compute failure");
  const first = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.first,
    dependencies: [handles.refs.base],
    compute: ([base]) => {
      calls.first += 1;
      return base + 1;
    }
  });
  const failing = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.failure,
    dependencies: [handles.refs.base],
    compute: () => {
      calls.failure += 1;
      throw failure;
    }
  });
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.first, handles.refs.failure],
    compute: ([left, right]) => {
      calls.total += 1;
      return left + right;
    }
  });
  const definitions = [total, failing, first];
  const snapshot = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: definitions
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, definitions)
  );
  return { compiled, handles, calls, failure, snapshot, graph };
}

function createInvalidResultFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.invalid-derived-result",
    kpStateGroup({
      base: kpStateValue(2),
      invalid: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const invalid = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.invalid,
    dependencies: [handles.refs.base],
    compute: () => Number.POSITIVE_INFINITY
  });
  const snapshot = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [invalid]
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [invalid])
  );
  return { compiled, handles, snapshot, graph };
}
