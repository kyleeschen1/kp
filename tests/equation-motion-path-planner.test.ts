import assert from "node:assert/strict";
import test from "node:test";

import {
  kpEquationMotionPathVariantIds,
  planKpEquationMotionPath,
  planKpEquationMotionPathBetweenPoints,
  sampleKpEquationMotionPath
} from "../src/rendering/equation-motion-path-planner.ts";
import type { KpEquationLayoutPlan } from "../src/rendering/equation-layout-plan.ts";

test("path planner evaluates direct, above, below, and around variants", () => {
  const plan = planKpEquationMotionPathBetweenPoints({
    id: "path.all-variants",
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 }
  });

  assert.deepEqual(
    [...plan.candidates].sort((left, right) =>
      kpEquationMotionPathVariantIds.indexOf(left.variant) -
      kpEquationMotionPathVariantIds.indexOf(right.variant)
    ).map((candidate) => candidate.variant),
    [...kpEquationMotionPathVariantIds]
  );
  assert.equal(plan.selected.variant, "direct");
  assert.equal(plan.selected.travelDistance, 100);
});

test("collision scoring rejects a shorter blocked route", () => {
  const plan = planKpEquationMotionPathBetweenPoints({
    id: "path.around-obstacle",
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    obstacles: [{ left: 44, top: -6, width: 12, height: 12 }],
    variants: ["direct", "arc-above", "arc-below"],
    clearance: 36,
    moverRadius: 1,
    sampleCount: 40
  });

  assert.ok(plan.candidates.find((candidate) => candidate.variant === "direct")!.collisionCount > 0);
  assert.equal(plan.selected.collisionCount, 0);
  assert.equal(plan.selected.variant, "arc-above");
});

test("reading order and explicit semantic lanes break safe-path ties deterministically", () => {
  const forward = planKpEquationMotionPathBetweenPoints({
    id: "path.forward",
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    variants: ["arc-below", "arc-above"]
  });
  const backward = planKpEquationMotionPathBetweenPoints({
    id: "path.backward",
    start: { x: 100, y: 0 },
    end: { x: 0, y: 0 },
    variants: ["arc-above", "arc-below"]
  });
  const forced = planKpEquationMotionPathBetweenPoints({
    id: "path.forced",
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    variants: ["arc-above", "arc-below"],
    preferredVariant: "arc-below"
  });

  assert.equal(forward.selected.variant, "arc-above");
  assert.equal(backward.selected.variant, "arc-below");
  assert.equal(forced.selected.variant, "arc-below");
  assert.deepEqual(
    forced,
    planKpEquationMotionPathBetweenPoints({
      id: "path.forced",
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      variants: ["arc-above", "arc-below"],
      preferredVariant: "arc-below"
    })
  );
});

test("quadratic sampling clamps progress and preserves exact endpoints", () => {
  const plan = planKpEquationMotionPathBetweenPoints({
    id: "path.sample",
    start: { x: 10, y: 20 },
    end: { x: 90, y: 20 },
    variants: ["arc-above"]
  });

  assert.deepEqual(sampleKpEquationMotionPath(plan.selected, -1), { x: 10, y: 20 });
  assert.deepEqual(sampleKpEquationMotionPath(plan.selected, 1), { x: 90, y: 20 });
  assert.ok(sampleKpEquationMotionPath(plan.selected, 0.5).y < 20);
});

test("layout-plan adapter excludes the moving relation's own destination", () => {
  const layout = layoutPlan();
  const path = planKpEquationMotionPath({
    id: "path.persist-x",
    layoutPlan: layout,
    relationRecordId: "persist.x",
    sampleCount: 40
  });

  assert.equal(path.relationRecordId, "persist.x");
  assert.equal(path.selected.variant, "arc-above");
  assert.equal(path.selected.collisionCount, 0);
});

function layoutPlan(): KpEquationLayoutPlan {
  return {
    kind: "equation-layout-plan",
    id: "layout.path-test",
    transitionId: "transition.path-test",
    revision: 0,
    source: { side: "source", tokens: [] },
    target: { side: "target", tokens: [] },
    reservations: [
      {
        id: "destination.persist-x",
        kind: "destination",
        relationRecordId: "persist.x",
        motionId: "target.x",
        bounds: { left: 94, top: -6, width: 12, height: 12 }
      },
      {
        id: "destination.other",
        kind: "destination",
        relationRecordId: "persist.other",
        motionId: "target.other",
        bounds: { left: 44, top: -6, width: 12, height: 12 }
      }
    ],
    waypoints: [
      {
        id: "persist.x.source",
        relationRecordId: "persist.x",
        role: "source",
        ordinal: 0,
        point: { x: 0, y: 0 }
      },
      {
        id: "persist.x.target",
        relationRecordId: "persist.x",
        role: "target",
        ordinal: 2,
        point: { x: 100, y: 0 }
      }
    ],
    geometryPolicy: "measure-once-per-step"
  };
}
