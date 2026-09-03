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
import { createKpSemanticConcreteDerivationFingerprint } from
  "../src/semantic-state/derived-fingerprint.ts";
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
