import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpStateRetentionProjection,
  isKpVerifiedStateRetentionProjection,
  KpStateRetentionProjectionError,
  type KpStateRetentionProjectionDraft,
  type KpStateRetentionRepresentationOccurrence
} from "../src/domain-ir/state-retention-projection.ts";

test("replacement transfers one paint occurrence without retained context", () => {
  const projection = compileKpStateRetentionProjection(replacementDraft());
  assert.equal(isKpVerifiedStateRetentionProjection(projection), true);
  assert.deepEqual(projection.paintFrames.map(({ phase, claims }) => ({
    phase,
    kinds: claims.map(({ ownerKind }) => ownerKind)
  })), [
    { phase: "source", kinds: ["native-source"] },
    { phase: "transition", kinds: ["live-transition"] },
    { phase: "settled", kinds: ["native-target"] }
  ]);
  assert.equal(projection.occurrences.length, 3);
});

test("equivalence frame keeps distinct frozen source and live target occurrences", () => {
  const projection = compileKpStateRetentionProjection(equivalenceDraft());
  const transition = projection.paintFrames[1];
  const settled = projection.paintFrames[2];
  assert.deepEqual(transition.claims.map(({ ownerKind }) => ownerKind), [
    "frozen-native-context", "native-relation", "live-transition"
  ]);
  assert.deepEqual(settled.claims.map(({ ownerKind }) => ownerKind), [
    "frozen-native-context", "native-relation", "native-target"
  ]);
  assert.notEqual(projection.occurrences[0]?.id,
    projection.occurrences[1]?.id);
  assert.deepEqual(projection.occurrences[0]?.referentIds,
    projection.occurrences[1]?.referentIds);
  assert.equal(new Set(settled.claims.map(({ paintOccurrenceId }) =>
    paintOccurrenceId)).size, settled.claims.length);
});

test("derivation trail retains immutable snapshots beside one live transition", () => {
  const draft = derivationDraft();
  const projection = compileKpStateRetentionProjection(draft);
  assert.equal(Object.isFrozen(projection), true);
  assert.equal(Object.isFrozen(projection.historicalSnapshots), true);
  assert.deepEqual(projection.historicalSnapshots.map(({ id }) => id), [
    "snapshot.step-zero", "snapshot.step-one"
  ]);
  assert.deepEqual(projection.paintFrames[1].claims.map(({ ownerKind }) =>
    ownerKind), [
      "frozen-native-context",
      "frozen-native-context",
      "live-transition"
    ]);
});

test("unknown referents duplicate occurrences and invalid selection fail closed", () => {
  const draft = equivalenceDraft();
  assertProjectionError({
    ...draft,
    targetOccurrence: {
      ...draft.targetOccurrence,
      referentIds: ["referent.unknown"]
    }
  }, "state-retention.unknown-referent");
  assertProjectionError({
    ...draft,
    targetOccurrence: {
      ...draft.targetOccurrence,
      id: draft.sourceOccurrence.id
    }
  }, "state-retention.duplicate-id");
  assertProjectionError({
    ...draft,
    selectedOccurrenceId: "occurrence.missing"
  } as KpStateRetentionProjectionDraft,
  "state-retention.invalid-selection");
});

test("projection serializes semantic topology without presentation authority", () => {
  const projection = compileKpStateRetentionProjection(equivalenceDraft());
  const serialized = JSON.stringify(projection);
  assert.doesNotMatch(serialized,
    /geometry|keyframe|opacity|duration|renderer|domNode/iu);
  assert.deepEqual(JSON.parse(serialized).selection, {
    occurrenceId: "occurrence.target",
    referentIds: ["referent.expression"]
  });
});

function replacementDraft(): KpStateRetentionProjectionDraft {
  return {
    schemaVersion: "kp.state-retention-projection-draft.v1",
    id: "projection.replacement",
    policy: "replacement",
    semanticTransitionId: "transition.log-product",
    referents: referents(),
    sourceOccurrence: occurrence("occurrence.source", "state.source",
      "source-state", ["referent.expression"]),
    targetOccurrence: occurrence("occurrence.target", "state.target",
      "target-state", ["referent.expression"]),
    selectedOccurrenceId: "occurrence.target",
    historicalSnapshots: []
  };
}

function equivalenceDraft(): KpStateRetentionProjectionDraft {
  return {
    schemaVersion: "kp.state-retention-projection-draft.v1",
    id: "projection.equivalence",
    policy: "equivalence-frame",
    semanticTransitionId: "transition.log-product",
    referents: referents(),
    sourceOccurrence: occurrence("occurrence.source", "state.source",
      "source-state", ["referent.expression"]),
    targetOccurrence: occurrence("occurrence.target", "state.target",
      "target-state", ["referent.expression"]),
    relationOccurrence: occurrence("occurrence.relation", "state.frame",
      "relation", ["referent.equivalence"]),
    selectedOccurrenceId: "occurrence.target",
    historicalSnapshots: []
  };
}

function derivationDraft(): KpStateRetentionProjectionDraft {
  const historicalOccurrences = [
    occurrence("occurrence.history.zero", "state.zero", "historical-state",
      ["referent.expression"]),
    occurrence("occurrence.history.one", "state.one", "historical-state",
      ["referent.expression"])
  ] as const;
  return {
    schemaVersion: "kp.state-retention-projection-draft.v1",
    id: "projection.derivation",
    policy: "derivation-trail",
    semanticTransitionId: "transition.log-product",
    referents: referents(),
    sourceOccurrence: occurrence("occurrence.source", "state.source",
      "source-state", ["referent.expression"]),
    targetOccurrence: occurrence("occurrence.target", "state.target",
      "target-state", ["referent.expression"]),
    historicalOccurrences,
    historicalSnapshots: [{
      id: "snapshot.step-zero",
      stateId: "state.zero",
      occurrenceIds: [historicalOccurrences[0].id]
    }, {
      id: "snapshot.step-one",
      stateId: "state.one",
      occurrenceIds: [historicalOccurrences[1].id]
    }],
    selectedOccurrenceId: "occurrence.target"
  };
}

function referents() {
  return [{ id: "referent.expression", meaningId: "meaning.log-product" }, {
    id: "referent.equivalence", meaningId: "meaning.equivalence"
  }];
}

function occurrence(
  id: string,
  stateId: string,
  kind: KpStateRetentionRepresentationOccurrence["kind"],
  referentIds: readonly string[]
): KpStateRetentionRepresentationOccurrence {
  return { id, stateId, kind, referentIds };
}

function assertProjectionError(
  draft: KpStateRetentionProjectionDraft,
  code: KpStateRetentionProjectionError["code"]
): void {
  assert.throws(() => compileKpStateRetentionProjection(draft),
    (error) => error instanceof KpStateRetentionProjectionError &&
      error.code === code);
}
