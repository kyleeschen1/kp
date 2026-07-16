import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEquationLayoutPlan,
  replanKpEquationLayoutBetweenSteps,
  waypointsForKpEquationLayoutRelation
} from "../src/rendering/equation-layout-plan.ts";
import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionGeometry
} from "../src/rendering/equation-motion-dom.ts";

test("layout planning snapshots deterministic endpoints and reserves transit space", () => {
  const geometry = measuredGeometry();
  const first = createKpEquationLayoutPlan({ id: "layout.move-x", geometry });
  const second = createKpEquationLayoutPlan({ id: "layout.move-x", geometry });

  assert.deepEqual(first, second);
  assert.equal(first.geometryPolicy, "measure-once-per-step");
  assert.deepEqual(first.source.tokens.map((token) => token.bounds), [
    { left: 10, top: 10, width: 10, height: 20 },
    { left: 30, top: 10, width: 12, height: 20 }
  ]);
  assert.deepEqual(first.target.tokens.map((token) => token.bounds), [
    { left: 70, top: 10, width: 10, height: 20 },
    { left: 90, top: 10, width: 12, height: 20 }
  ]);
  assert.deepEqual(
    first.reservations.map((reservation) => [reservation.kind, reservation.relationRecordId]),
    [
      ["destination", "persist.x"],
      ["destination", "persist.equals"],
      ["transit", "persist.x"],
      ["transit", "persist.equals"]
    ]
  );
  assert.ok(first.reservations.find((reservation) =>
    reservation.id === "persist.x.transit"
  )!.bounds.top < 10);
});

test("semantic waypoints pin exact start and end centers around clearance", () => {
  const plan = createKpEquationLayoutPlan({
    id: "layout.move-x",
    geometry: measuredGeometry()
  });
  const waypoints = waypointsForKpEquationLayoutRelation(plan, "persist.x");

  assert.deepEqual(waypoints.map((waypoint) => waypoint.role), [
    "source",
    "clearance",
    "target"
  ]);
  assert.deepEqual(waypoints[0]?.point, { x: 15, y: 20 });
  assert.deepEqual(waypoints[2]?.point, { x: 75, y: 20 });
  assert.ok(waypoints[1]!.point.y < 20);
});

test("a plan never rereads changing DOM geometry during playback", () => {
  const geometry = measuredGeometry();
  const plan = createKpEquationLayoutPlan({ id: "layout.move-x", geometry });
  const sourceElement = geometry.sourceTokens[0]!.element as unknown as {
    bounds: { left: number; top: number; width: number; height: number };
  };
  sourceElement.bounds.left = 999;

  assert.equal(plan.source.tokens[0]?.bounds.left, 10);
  assert.deepEqual(
    waypointsForKpEquationLayoutRelation(plan, "persist.x")[0]?.point,
    { x: 15, y: 20 }
  );
});

test("resize is incorporated only by explicit replanning between steps", () => {
  const initial = createKpEquationLayoutPlan({
    id: "layout.move-x",
    geometry: measuredGeometry()
  });
  const resizedGeometry = measuredGeometry(2);
  const resized = replanKpEquationLayoutBetweenSteps({
    previous: initial,
    geometry: resizedGeometry
  });

  assert.equal(initial.revision, 0);
  assert.equal(resized.revision, 1);
  assert.equal(initial.target.tokens[0]?.bounds.left, 70);
  assert.equal(resized.target.tokens[0]?.bounds.left, 140);
  assert.deepEqual(initial.source.tokens[0]?.bounds, { left: 10, top: 10, width: 10, height: 20 });
});

function measuredGeometry(scale = 1): KpMeasuredEquationTransitionGeometry {
  const sourceTokens = [
    token("source.x", 10 * scale, 10, 10, 20),
    token("source.equals", 30 * scale, 10, 12, 20)
  ];
  const targetTokens = [
    token("target.x", 70 * scale, 10, 10, 20),
    token("target.equals", 90 * scale, 10, 12, 20)
  ];
  return {
    transitionId: "transition.move-x",
    sourceTokens,
    targetTokens,
    relations: [
      relation("persist.x", "x", sourceTokens[0]!, targetTokens[0]!),
      relation("persist.equals", "equals", sourceTokens[1]!, targetTokens[1]!)
    ]
  };
}

function token(
  motionId: string,
  left: number,
  top: number,
  width: number,
  height: number
): AnnotatedMotionToken {
  const bounds = { left, top, width, height };
  const element = {
    bounds,
    dataset: { kpMotionId: motionId },
    textContent: motionId,
    getBoundingClientRect: () => bounds
  } as unknown as HTMLElement;
  return {
    motionId,
    text: motionId,
    rect: bounds,
    localRect: bounds,
    element
  };
}

function relation(
  recordId: string,
  selectorId: string,
  source: AnnotatedMotionToken,
  target: AnnotatedMotionToken
): KpMeasuredEquationTransitionGeometry["relations"][number] {
  return {
    recordId,
    lifecycle: "persist",
    source: {
      selectorIds: [`before.${selectorId}`],
      motionIds: [source.motionId],
      bounds: source.localRect
    },
    target: {
      selectorIds: [`after.${selectorId}`],
      motionIds: [target.motionId],
      bounds: target.localRect
    },
    delta: {
      x: target.localRect.left - source.localRect.left,
      y: target.localRect.top - source.localRect.top,
      scaleX: 1,
      scaleY: 1
    }
  };
}
