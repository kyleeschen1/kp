import assert from "node:assert/strict";
import test from "node:test";

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
  createKpSemanticDerivedValueCache,
  KpSemanticDerivedCacheError
} from "../src/semantic-state/derived-cache.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";

test("a caller cache hits across equivalent branch snapshots", () => {
  const fixture = createFixture("lesson.derived-cache-hit");
  const cache = createKpSemanticDerivedValueCache();
  const first = cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });
  const repeated = cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });
  const branch = cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.unrelatedBranch,
    target: fixture.handles.refs.total
  });

  assert.deepEqual(first, { amount: 6 });
  assert.equal(repeated, first);
  assert.equal(branch, first);
  assert.equal(fixture.calls.total, 1);
  assert.deepEqual(cache.inspect(), {
    schemaVersion: "kp.semantic-derived-cache-stats.v1",
    kind: "semantic-derived-cache-stats",
    status: "active",
    entries: 1,
    hits: 2,
    misses: 1
  });
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(cache.inspect()));
});

test("cache instances isolate values and reset locally", () => {
  const fixture = createFixture("lesson.derived-cache-isolation");
  const first = createKpSemanticDerivedValueCache();
  const second = createKpSemanticDerivedValueCache();

  first.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });
  first.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });
  second.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });
  assert.equal(fixture.calls.total, 2);

  first.reset();
  assert.equal(first.inspect().entries, 0);
  assert.equal(first.inspect().hits, 0);
  first.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });
  second.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });
  assert.equal(fixture.calls.total, 3);
  assert.deepEqual(second.inspect(), {
    schemaVersion: "kp.semantic-derived-cache-stats.v1",
    kind: "semantic-derived-cache-stats",
    status: "active",
    entries: 1,
    hits: 1,
    misses: 1
  });
});

test("disposing a cache clears it and expires its capability", () => {
  const fixture = createFixture("lesson.derived-cache-disposal");
  const cache = createKpSemanticDerivedValueCache();
  cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });

  cache.dispose();
  assert.deepEqual(cache.inspect(), {
    schemaVersion: "kp.semantic-derived-cache-stats.v1",
    kind: "semantic-derived-cache-stats",
    status: "disposed",
    entries: 0,
    hits: 0,
    misses: 1
  });
  assert.throws(
    () => cache.evaluate({
      graph: fixture.graph,
      snapshot: fixture.initial,
      target: fixture.handles.refs.total
    }),
    (error) => error instanceof KpSemanticDerivedCacheError &&
      error.code === "derived-cache-disposed"
  );
  assert.throws(
    () => cache.reset(),
    (error) => error instanceof KpSemanticDerivedCacheError &&
      error.code === "derived-cache-disposed"
  );
});

test("a dependency change recomputes one requested chain", () => {
  const fixture = createChainFixture();
  const cache = createKpSemanticDerivedValueCache();

  assert.equal(cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.third
  }), 5);
  assert.deepEqual(fixture.calls, { first: 1, second: 1, third: 1 });
  assert.equal(cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.updated,
    target: fixture.handles.refs.third
  }), 6);
  assert.deepEqual(fixture.calls, { first: 2, second: 2, third: 2 });
  assert.deepEqual(cache.inspect(), {
    schemaVersion: "kp.semantic-derived-cache-stats.v1",
    kind: "semantic-derived-cache-stats",
    status: "active",
    entries: 6,
    hits: 0,
    misses: 6
  });
});

test("alias updates reuse copied and unrequested derived branches", () => {
  const fixture = createSelectiveFixture();
  const cache = createKpSemanticDerivedValueCache();

  assert.equal(cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.shared,
    target: fixture.handles.refs.total
  }), 10);
  assert.equal(cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.unrelatedBranch,
    target: fixture.handles.refs.total
  }), 10);
  assert.equal(cache.evaluate({
    graph: fixture.graph,
    snapshot: fixture.updated,
    target: fixture.handles.refs.total
  }), 16);
  assert.deepEqual(fixture.calls, {
    alias: 2,
    copy: 1,
    total: 2,
    unrequested: 0
  });
  assert.deepEqual(cache.inspect(), {
    schemaVersion: "kp.semantic-derived-cache-stats.v1",
    kind: "semantic-derived-cache-stats",
    status: "active",
    entries: 5,
    hits: 2,
    misses: 5
  });
});

function createFixture(namespace: string) {
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    base: kpStateValue({ amount: 3 }),
    other: kpStateValue<number>(0),
    total: kpStateDerived<{ readonly amount: number }>()
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const calls = { total: 0 };
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.base],
    compute: ([base]) => {
      calls.total += 1;
      return { amount: base.amount * 2 };
    }
  });
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [total]
  });
  const updateOther = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "update-other",
    author(state) {
      state.other.update(value => value + 1);
    }
  });
  const unrelatedBranch = updateOther.apply(initial, "first").commit.after;
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [total])
  );
  return { compiled, handles, calls, initial, unrelatedBranch, graph };
}

function createChainFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.selective-derived-chain",
    kpStateGroup({
      base: kpStateValue<number>(2),
      first: kpStateDerived<number>(),
      second: kpStateDerived<number>(),
      third: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const calls = { first: 0, second: 0, third: 0 };
  const first = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.first,
    dependencies: [handles.refs.base],
    compute: ([value]) => {
      calls.first += 1;
      return value + 1;
    }
  });
  const second = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.second,
    dependencies: [handles.refs.first],
    compute: ([value]) => {
      calls.second += 1;
      return value + 1;
    }
  });
  const third = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.third,
    dependencies: [handles.refs.second],
    compute: ([value]) => {
      calls.third += 1;
      return value + 1;
    }
  });
  const definitions = [third, first, second];
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: definitions
  });
  const updateBase = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "update-base",
    author(state) {
      state.base.update(value => value + 1);
    }
  });
  const updated = updateBase.apply(initial, "first").commit.after;
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, definitions)
  );
  return { compiled, handles, calls, initial, updated, graph };
}

function createSelectiveFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.selective-derived-diamond",
    kpStateGroup({
      source: kpStateValue({ amount: 2 }),
      alias: kpStateValue({ amount: 9 }),
      copy: kpStateValue({ amount: 7 }),
      other: kpStateValue<number>(0),
      aliasDerived: kpStateDerived<number>(),
      copyDerived: kpStateDerived<number>(),
      total: kpStateDerived<number>(),
      unrequested: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const calls = { alias: 0, copy: 0, total: 0, unrequested: 0 };
  const aliasDerived = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.aliasDerived,
    dependencies: [handles.refs.alias],
    compute: ([value]) => {
      calls.alias += 1;
      return value.amount * 2;
    }
  });
  const copyDerived = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.copyDerived,
    dependencies: [handles.refs.copy],
    compute: ([value]) => {
      calls.copy += 1;
      return value.amount * 3;
    }
  });
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.aliasDerived, handles.refs.copyDerived],
    compute: ([alias, copy]) => {
      calls.total += 1;
      return alias + copy;
    }
  });
  const unrequested = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.unrequested,
    dependencies: [handles.refs.other],
    compute: ([value]) => {
      calls.unrequested += 1;
      return value * 100;
    }
  });
  const definitions = [unrequested, total, copyDerived, aliasDerived];
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: definitions
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
  const updateSource = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "update-source",
    author(state) {
      state.source.update(({ amount }) => ({ amount: amount + 3 }));
    }
  });
  const updated = updateSource.apply(shared, "first").commit.after;
  const updateOther = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "update-other",
    author(state) {
      state.other.update(value => value + 1);
    }
  });
  const unrelatedBranch = updateOther.apply(shared, "first").commit.after;
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, definitions)
  );
  return {
    compiled,
    handles,
    calls,
    shared,
    updated,
    unrelatedBranch,
    graph
  };
}
