import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpVerifiedFiniteSumEquivalenceFrame,
  kpFiniteSumEquivalenceFrame,
  kpFiniteSumEquivalenceFrameOccurrenceIds
} from "../src/semantic/finite-sum-equivalence-frame.ts";
import {
  kpCanonicalFiniteSumExpansionOperation
} from "../src/semantic/canonical-finite-sum-expansion.ts";

test("finite sum retains the source while constructing a distinct target", () => {
  const frame = kpFiniteSumEquivalenceFrame;
  assert.equal(isKpVerifiedFiniteSumEquivalenceFrame(frame), true);
  assert.equal(frame.projection.policy, "equivalence-frame");
  assert.equal(frame.operationId,
    kpCanonicalFiniteSumExpansionOperation.operation);

  const source = frame.projection.occurrences.find(({ id }) =>
    id === kpFiniteSumEquivalenceFrameOccurrenceIds.source);
  const relation = frame.projection.occurrences.find(({ id }) =>
    id === kpFiniteSumEquivalenceFrameOccurrenceIds.relation);
  const target = frame.projection.occurrences.find(({ id }) =>
    id === kpFiniteSumEquivalenceFrameOccurrenceIds.target);
  assert.ok(source);
  assert.ok(relation);
  assert.ok(target);
  assert.notEqual(source.id, target.id);
  assert.deepEqual(source.referentIds, target.referentIds);
  assert.equal(relation.kind, "relation");
});

test("transition and settled paint retain source and equality context", () => {
  const [, transition, settled] =
    kpFiniteSumEquivalenceFrame.projection.paintFrames;
  for (const frame of [transition, settled]) {
    assert.ok(frame.claims.some(({ representationOccurrenceId, ownerKind }) =>
      representationOccurrenceId ===
        kpFiniteSumEquivalenceFrameOccurrenceIds.source &&
      ownerKind === "frozen-native-context"));
    assert.ok(frame.claims.some(({ representationOccurrenceId, ownerKind }) =>
      representationOccurrenceId ===
        kpFiniteSumEquivalenceFrameOccurrenceIds.relation &&
      ownerKind === "native-relation"));
  }
});
