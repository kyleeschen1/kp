import assert from "node:assert/strict";
import test from "node:test";

import type { KpMeasuredEquationTransitionGeometry } from "../src/rendering/equation-motion-dom.ts";
import { sampleKpEquationTokenMotion } from "../src/rendering/semantic-equation-token-renderer.ts";

const element = { style: {} } as unknown as HTMLElement;
const geometry: KpMeasuredEquationTransitionGeometry = {
  transitionId: "transition.sample",
  sourceTokens: [
    { motionId: "before.x", text: "x", rect: { left: 0, top: 0, width: 10, height: 10 }, localRect: { left: 0, top: 0, width: 10, height: 10 }, element },
    { motionId: "before.7", text: "7", rect: { left: 20, top: 0, width: 10, height: 10 }, localRect: { left: 20, top: 0, width: 10, height: 10 }, element },
    { motionId: "before.3", text: "3", rect: { left: 40, top: 0, width: 10, height: 10 }, localRect: { left: 40, top: 0, width: 10, height: 10 }, element }
  ],
  targetTokens: [
    { motionId: "after.x", text: "x", rect: { left: 10, top: 0, width: 10, height: 10 }, localRect: { left: 10, top: 0, width: 10, height: 10 }, element },
    { motionId: "after.4", text: "4", rect: { left: 30, top: 0, width: 10, height: 10 }, localRect: { left: 30, top: 0, width: 10, height: 10 }, element }
  ],
  relations: [
    {
      recordId: "x",
      lifecycle: "persist",
      source: { selectorIds: ["x"], motionIds: ["before.x"], bounds: { left: 0, top: 0, width: 10, height: 10 } },
      target: { selectorIds: ["x"], motionIds: ["after.x"], bounds: { left: 10, top: 0, width: 10, height: 10 } },
      delta: { x: 10, y: 0, scaleX: 1, scaleY: 1 }
    },
    {
      recordId: "constants",
      lifecycle: "merge",
      source: { selectorIds: ["7", "3"], motionIds: ["before.7", "before.3"], bounds: { left: 20, top: 0, width: 30, height: 10 } },
      target: { selectorIds: ["4"], motionIds: ["after.4"], bounds: { left: 30, top: 0, width: 10, height: 10 } },
      delta: { x: 0, y: 0, scaleX: 1 / 3, scaleY: 1 }
    }
  ]
};

test("persistent semantic tokens move without fading at midpoint and hand off exactly at end", () => {
  const midpoint = sampleKpEquationTokenMotion(geometry, 0.5);
  const source = midpoint.tokens.find((token) => token.motionId === "before.x");
  const target = midpoint.tokens.find((token) => token.motionId === "after.x");
  assert.equal(source?.pose.opacity, 1);
  assert.equal(source?.pose.x, 5);
  assert.equal(target?.pose.opacity, 0);

  const end = sampleKpEquationTokenMotion(geometry, 1);
  assert.equal(end.tokens.find((token) => token.motionId === "before.x")?.pose.opacity, 0);
  assert.equal(end.tokens.find((token) => token.motionId === "after.x")?.pose.opacity, 1);
});

test("fan-in keeps source terms visible until the semantic merge reveal", () => {
  const midpoint = sampleKpEquationTokenMotion(geometry, 0.5);
  assert.equal(midpoint.tokens.find((token) => token.motionId === "before.7")?.pose.opacity, 1);
  assert.equal(midpoint.tokens.find((token) => token.motionId === "after.4")?.pose.opacity, 0);
  const end = sampleKpEquationTokenMotion(geometry, 1);
  assert.equal(end.tokens.find((token) => token.motionId === "before.7")?.pose.opacity, 0);
  assert.equal(end.tokens.find((token) => token.motionId === "after.4")?.pose.opacity, 1);
});

test("wrap choreography moves one persistent argument before enclosure artifacts arrive", () => {
  const wrapGeometry: KpMeasuredEquationTransitionGeometry = {
    transitionId: "transition.wrap",
    enclosureChoreographyKind: "wrap",
    sourceTokens: [
      motionToken("before.x", "x", 0)
    ],
    targetTokens: [
      motionToken("after.f", "f", 10),
      motionToken("after.open", "(", 20),
      motionToken("after.x", "x", 30),
      motionToken("after.close", ")", 40)
    ],
    relations: [
      {
        recordId: "argument",
        lifecycle: "role-change",
        source: endpoint(["before.x"], 0),
        target: endpoint(["after.x"], 30),
        delta: { x: 30, y: 0, scaleX: 1, scaleY: 1 }
      },
      {
        recordId: "enclosure",
        lifecycle: "enter",
        target: {
          selectorIds: ["function", "open", "close"],
          motionIds: ["after.f", "after.open", "after.close"],
          bounds: { left: 10, top: 0, width: 40, height: 10 }
        }
      }
    ]
  };

  const early = sampleKpEquationTokenMotion(wrapGeometry, 0.2);
  assert.equal(early.enclosureChoreography?.kind, "wrap");
  assert.ok((tokenPose(early, "before.x")?.x ?? 0) > 0);
  assert.equal(tokenPose(early, "after.open")?.opacity, 0);
  assert.equal(tokenPose(early, "after.f")?.opacity, 0);

  const middle = sampleKpEquationTokenMotion(wrapGeometry, 0.5);
  assert.equal(tokenPose(middle, "before.x")?.x, 30);
  assert.equal(tokenPose(middle, "before.x")?.opacity, 1);
  assert.ok((tokenPose(middle, "after.open")?.opacity ?? 0) > 0);
  assert.ok((tokenPose(middle, "after.f")?.opacity ?? 1) < 0.05);

  const almostDone = sampleKpEquationTokenMotion(wrapGeometry, 0.99);
  assert.equal(tokenPose(almostDone, "before.x")?.opacity, 1);
  assert.equal(tokenPose(almostDone, "after.x")?.opacity, 0);
  const done = sampleKpEquationTokenMotion(wrapGeometry, 1);
  assert.equal(tokenPose(done, "before.x")?.opacity, 0);
  assert.equal(tokenPose(done, "after.x")?.opacity, 1);
});

function motionToken(
  motionId: string,
  text: string,
  left: number
): KpMeasuredEquationTransitionGeometry["sourceTokens"][number] {
  const rect = { left, top: 0, width: 10, height: 10 };
  return { motionId, text, rect, localRect: rect, element };
}

function endpoint(
  motionIds: readonly string[],
  left: number
): NonNullable<KpMeasuredEquationTransitionGeometry["relations"][number]["source"]> {
  return {
    selectorIds: [...motionIds],
    motionIds: [...motionIds],
    bounds: { left, top: 0, width: 10, height: 10 }
  };
}

function tokenPose(
  frame: ReturnType<typeof sampleKpEquationTokenMotion>,
  motionId: string
) {
  return frame.tokens.find((token) => token.motionId === motionId)?.pose;
}
