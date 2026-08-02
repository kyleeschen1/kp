import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpMatrixLinearMapPlan,
  sampleKpMatrixLinearMapFrame
} from "../src/animation/matrix-linear-map-frame.ts";

const animation = createKpAnimationAssets().find((candidate) =>
  candidate.id ===
    "animation.generated.linear-algebra.matrix-vector.two-by-two"
)!;
const plan = createKpMatrixLinearMapPlan(animation);
const frame = (progress: number, direction: "forward" | "rewind" = "forward") =>
  sampleKpMatrixLinearMapFrame({
    plan,
    progress,
    direction,
    accessibilityMode: "full-motion"
  });

test("one rank-6 plan binds the canonical timeline and both semantic views", () => {
  assert.equal(plan.timelineId, animation.timeline?.id);
  assert.equal(plan.durationMs, 2_400);
  assert.equal(plan.operationBank.transformationId,
    animation.transformations[0]?.id);
  assert.equal(plan.semantics.linearMap.id,
    animation.transformations[1]?.sourceObjectIds[0]);
});

test("operation-bank and geometry frames share one semantic playhead", () => {
  const early = frame(0.18);
  assert.equal(early.semanticProgress, 0.18);
  assert.equal(early.operationBank.inputOpacity, 1);
  assert.equal(early.operationBank.activeRowIndex, 0);
  assert.equal(early.operationBank.rows[0]?.foldPhase, "products");
  assert.equal(early.geometry.visibility, 0);

  const handoff = frame(0.52);
  assert.equal(handoff.operationBank.rows[0]?.status, "resolved");
  assert.equal(handoff.operationBank.rows[1]?.foldPhase, "route");
  assert.equal(handoff.geometry.visibility, 0);

  const late = frame(0.8);
  assert.equal(late.operationBank.rows[1]?.foldPhase, "gather");
  assert.ok(late.geometry.basisRevealProgress > 0.99);
  assert.ok(late.geometry.vectorMapProgress > 0);

  const settled = frame(1);
  assert.ok(settled.operationBank.rows.every((row) =>
    row.foldPhase === "coordinate" && row.coordinateProgress === 1
  ));
  assert.deepEqual(settled.geometry.inputCoordinates, [4, 5]);
  assert.deepEqual(settled.geometry.outputCoordinates, [13, 15]);
  assert.deepEqual(settled.geometry.mappedBasisVectors, [[2, 0], [1, 3]]);
  assert.deepEqual(settled.geometry.currentBasisVectors, [[2, 0], [1, 3]]);
  assert.deepEqual(settled.geometry.currentVectorCoordinates, [13, 15]);
  assert.equal(settled.geometry.transformedGridSegments.length, 12);
  assert.deepEqual(settled.geometry.transformedGridSegments.at(-1), {
    id: "grid.second-basis.5",
    family: "second-basis",
    from: [10, 0],
    to: [15, 15]
  });
  assert.equal(settled.geometry.outputVectorRevealProgress, 1);
});

test("synchronized rank-6 frame has exact semantic rewind", () => {
  assert.deepEqual(
    { ...frame(0.37), direction: "rewind" },
    frame(0.63, "rewind")
  );
});
