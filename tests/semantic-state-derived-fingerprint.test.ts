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
  createKpSemanticConcreteDerivationFingerprint,
  createKpSemanticDerivationFingerprint,
  type KpSemanticDerivedDependencyToken
} from "../src/semantic-state/derived-fingerprint.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";

test("concrete tokens preserve alias and copy identity authority", () => {
  const fixture = createFixture();
  const fingerprint = readFingerprint(fixture, fixture.shared);
  const source = readToken(fingerprint, fixture.handles.refs.source.slotId);
  const alias = readToken(fingerprint, fixture.handles.refs.alias.slotId);
  const copy = readToken(fingerprint, fixture.handles.refs.copy.slotId);

  assert.equal(alias.entityId, source.entityId);
  assert.equal(alias.versionId, source.versionId);
  assert.notEqual(alias.slotId, source.slotId);
  assert.notEqual(alias.key, source.key);
  assert.notEqual(copy.entityId, source.entityId);
  assert.notEqual(copy.versionId, source.versionId);
  assert.equal("value" in source, false);
  assert.ok(Object.isFrozen(fingerprint));
  assert.ok(Object.isFrozen(fingerprint.dependencies));
});

test("new versions change fingerprints even when payloads are equal", () => {
  const fixture = createFixture();
  const shared = readFingerprint(fixture, fixture.shared);
  const updated = readFingerprint(fixture, fixture.updated);
  const equalRevision = readFingerprint(fixture, fixture.equalRevision);

  assert.notEqual(updated.key, shared.key);
  assert.notEqual(equalRevision.key, shared.key);
  assert.notEqual(
    readToken(equalRevision, fixture.handles.refs.source.slotId).versionId,
    readToken(shared, fixture.handles.refs.source.slotId).versionId
  );
  assert.equal(
    readToken(updated, fixture.handles.refs.copy.slotId).key,
    readToken(shared, fixture.handles.refs.copy.slotId).key
  );
});

test("an unrelated branch snapshot reuses the exact fingerprint", () => {
  const fixture = createFixture();
  const shared = readFingerprint(fixture, fixture.shared);
  const branch = readFingerprint(fixture, fixture.unrelatedBranch);

  assert.notEqual(fixture.unrelatedBranch.id, fixture.shared.id);
  assert.deepEqual(branch, shared);
  assert.equal(branch.key.includes(fixture.shared.id), false);
  assert.equal(branch.key.includes(fixture.unrelatedBranch.id), false);
});

test("nested fingerprints compose concrete dependency authority", () => {
  const fixture = createNestedFixture();
  const initial = createKpSemanticDerivationFingerprint({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.summary
  });
  const updated = createKpSemanticDerivationFingerprint({
    graph: fixture.graph,
    snapshot: fixture.updated,
    target: fixture.handles.refs.summary
  });
  const doubled = requireDerivedToken(initial.dependencies[0]);
  const concrete = doubled.fingerprint.dependencies[0];

  assert.equal(doubled.slotId, fixture.handles.refs.doubled.slotId);
  assert.equal(concrete?.kind, "semantic-concrete-dependency-token");
  assert.notEqual(updated.key, initial.key);
  assert.ok(Object.isFrozen(doubled));
  assert.ok(Object.isFrozen(doubled.fingerprint));
});

test("diamond fingerprints ignore declaration order and unrelated branches", () => {
  const fixture = createNestedFixture();
  const first = createKpSemanticDerivationFingerprint({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });
  const permuted = createKpSemanticDerivationFingerprint({
    graph: fixture.permutedGraph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.total
  });
  const branch = createKpSemanticDerivationFingerprint({
    graph: fixture.graph,
    snapshot: fixture.unrelatedBranch,
    target: fixture.handles.refs.total
  });
  const left = requireDerivedToken(first.dependencies[0]);
  const right = requireDerivedToken(first.dependencies[1]);
  const leftShared = requireDerivedToken(left.fingerprint.dependencies[0]);
  const rightShared = requireDerivedToken(right.fingerprint.dependencies[0]);

  assert.equal(leftShared.key, rightShared.key);
  assert.deepEqual(permuted, first);
  assert.deepEqual(branch, first);
  assert.notEqual(fixture.unrelatedBranch.id, fixture.initial.id);
});

function createFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.concrete-derived-fingerprint",
    kpStateGroup({
      source: kpStateValue({ amount: 2 }),
      alias: kpStateValue({ amount: 9 }),
      copy: kpStateValue({ amount: 7 }),
      other: kpStateValue<number>(0),
      total: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [
      handles.refs.source,
      handles.refs.alias,
      handles.refs.copy
    ],
    compute: ([source, alias, copy]) =>
      source.amount + alias.amount + copy.amount
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
  const updateSource = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "update-source",
    author(state) {
      state.source.update(({ amount }) => ({ amount: amount + 3 }));
    }
  });
  const updated = updateSource.apply(shared, "first").commit.after;
  const reviseEqually = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "revise-equally",
    author(state) {
      state.source.update(value => value);
    }
  });
  const equalRevision = reviseEqually.apply(shared, "first").commit.after;
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
    normalizeKpSemanticDerivedGraphInput(compiled, [total])
  );
  return {
    compiled,
    handles,
    total,
    shared,
    updated,
    equalRevision,
    unrelatedBranch,
    graph
  };
}

function readFingerprint(
  fixture: ReturnType<typeof createFixture>,
  snapshot: ReturnType<typeof createFixture>["shared"]
) {
  return createKpSemanticConcreteDerivationFingerprint({
    graph: fixture.graph,
    snapshot,
    target: fixture.handles.refs.total
  });
}

function readToken(
  fingerprint: ReturnType<typeof readFingerprint>,
  slotId: string
) {
  const token = fingerprint.dependencies.find(candidate =>
    candidate.slotId === slotId
  );
  if (token === undefined) {
    throw new Error(`Missing concrete fingerprint token ${slotId}.`);
  }
  return token;
}

function createNestedFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.nested-derived-fingerprint",
    kpStateGroup({
      base: kpStateValue<number>(2),
      other: kpStateValue<number>(0),
      doubled: kpStateDerived<number>(),
      summary: kpStateDerived<number>(),
      left: kpStateDerived<number>(),
      right: kpStateDerived<number>(),
      total: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const doubled = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.doubled,
    dependencies: [handles.refs.base],
    compute: ([base]) => base * 2
  });
  const summary = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.summary,
    dependencies: [handles.refs.doubled],
    compute: ([value]) => value + 1
  });
  const left = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.left,
    dependencies: [handles.refs.doubled],
    compute: ([value]) => value + 2
  });
  const right = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.right,
    dependencies: [handles.refs.doubled],
    compute: ([value]) => value + 3
  });
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.left, handles.refs.right],
    compute: ([leftValue, rightValue]) => leftValue + rightValue
  });
  const definitions = [summary, total, right, doubled, left];
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
    normalizeKpSemanticDerivedGraphInput(compiled, definitions)
  );
  const permutedGraph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [...definitions].reverse())
  );
  return {
    compiled,
    handles,
    initial,
    updated,
    unrelatedBranch,
    graph,
    permutedGraph
  };
}

function requireDerivedToken(
  token: ReturnType<typeof createKpSemanticDerivationFingerprint>[
    "dependencies"
  ][number] | undefined
): KpSemanticDerivedDependencyToken {
  if (token?.kind !== "semantic-derived-dependency-token") {
    throw new Error("Expected a nested derived fingerprint token.");
  }
  return token;
}
