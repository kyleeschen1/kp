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
