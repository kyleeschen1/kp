import assert from "node:assert/strict";
import test from "node:test";

import {
  planKpFiniteSumRelationClearingTransit
} from "../src/rendering/finite-sum-relation-aware-transit.ts";

test("finite sum copies take a measured arc around the retained relation", () => {
  const plan = planKpFiniteSumRelationClearingTransit({
    id: "finite-sum.body.0",
    relationOccurrenceId: "occurrence.finite-sum-equivalence.relation",
    startPaintRect: { left: 16, top: 45, width: 8, height: 10 },
    endPaintRect: { left: 86, top: 45, width: 8, height: 10 },
    relationInkRect: { left: 46, top: 43, width: 8, height: 14 }
  });

  assert.equal(plan.relationRecordId,
    "occurrence.finite-sum-equivalence.relation");
  assert.equal(plan.selected.variant, "arc-above");
  assert.equal(plan.selected.collisionCount, 0);
  assert.deepEqual(plan.candidates.map(({ variant }) => variant), [
    "arc-above",
    "arc-below"
  ]);
});

test("relation-aware transit fails closed when no bounded arc clears", () => {
  assert.throws(() => planKpFiniteSumRelationClearingTransit({
    id: "finite-sum.body.blocked",
    relationOccurrenceId: "occurrence.finite-sum-equivalence.relation",
    startPaintRect: { left: 16, top: 45, width: 8, height: 10 },
    endPaintRect: { left: 86, top: 45, width: 8, height: 10 },
    relationInkRect: { left: 0, top: 0, width: 120, height: 100 }
  }), /cannot clear retained relation/u);
});
