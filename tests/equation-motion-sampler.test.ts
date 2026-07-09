import { strict as assert } from "node:assert";
import test from "node:test";

import { createEquationOperationTransition } from "../src/math/equation-transform.ts";
import {
  createEquationMotionPlan,
  type EquationMotionPlan
} from "../src/rendering/equation-motion-plan.ts";
import {
  sampleEquationMotion,
  type EquationMotionFrame,
  type EquationMotionFrameToken
} from "../src/rendering/equation-motion-sampler.ts";

const findFrameToken = (
  frame: EquationMotionFrame,
  tokenId: string
): EquationMotionFrameToken => {
  const token = frame.tokens.find((candidate) => candidate.tokenId === tokenId);
  assert.ok(token, `missing frame token for ${tokenId}`);
  return token;
};

const findOpacity = (frame: EquationMotionFrame, tokenId: string): number =>
  findFrameToken(frame, tokenId).pose.opacity;

const assertNearlyEqual = (
  actual: number,
  expected: number,
  epsilon = 1e-12
): void => {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`
  );
};

const assertFinitePose = (frame: EquationMotionFrame, tokenId: string): void => {
  const pose = findFrameToken(frame, tokenId).pose;
  assert.equal(Number.isFinite(pose.opacity), true);
  assert.equal(Number.isFinite(pose.x), true);
  assert.equal(Number.isFinite(pose.y), true);
  assert.equal(Number.isFinite(pose.scale), true);
};

test("sampleEquationMotion returns lifecycle frames for subtractBothSides", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 = 7",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "3"
    }
  });
  const plan = createEquationMotionPlan(transition);

  const start = sampleEquationMotion(plan, 0);
  const middle = sampleEquationMotion(plan, 0.3);
  const end = sampleEquationMotion(plan, 1);

  assert.equal(findOpacity(start, "lhs.plus"), 1);
  assert.equal(findOpacity(start, "rhs.inverse.3"), 0);
  assert.equal(findOpacity(end, "lhs.plus"), 1);
  assert.equal(findOpacity(end, "rhs.inverse.3"), 1);
  assert.equal(findOpacity(middle, "lhs.plus"), 1);
  assert.ok(findOpacity(middle, "rhs.inverse.3") > 0);
  assert.ok(findOpacity(middle, "rhs.inverse.3") < 1);
});

test("sampleEquationMotion samples cancellation during left simplification", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 - 3 = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });
  const plan = createEquationMotionPlan(transition);

  const start = sampleEquationMotion(plan, 0);
  const middle = sampleEquationMotion(plan, 0.2);
  const end = sampleEquationMotion(plan, 1);

  assert.equal(findOpacity(start, "lhs.plus"), 1);
  assert.equal(findOpacity(end, "lhs.plus"), 0);
  assert.ok(findOpacity(middle, "lhs.plus") > 0);
  assert.ok(findOpacity(middle, "lhs.plus") < 1);
});

test("sampleEquationMotion clamps progress and supports backward sampling", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "right",
      rule: "evaluate-constant-difference"
    }
  });
  const plan = createEquationMotionPlan(transition);

  assert.equal(sampleEquationMotion(plan, -1).progress, 0);
  assert.equal(sampleEquationMotion(plan, 2).progress, 1);
  assert.equal(sampleEquationMotion(plan, Number.NaN).progress, 0);
  assert.equal(sampleEquationMotion(plan, Number.NEGATIVE_INFINITY).progress, 0);
  assert.equal(sampleEquationMotion(plan, Number.POSITIVE_INFINITY).progress, 1);
  assert.equal(findOpacity(sampleEquationMotion(plan, -1), "rhs.4"), 0);
  assert.equal(findOpacity(sampleEquationMotion(plan, 2), "rhs.4"), 1);
  assertFinitePose(sampleEquationMotion(plan, Number.NaN), "rhs.4");

  const later = sampleEquationMotion(plan, 0.75);
  assert.equal(findOpacity(later, "rhs.4"), 1);
  const earlierAfterLater = sampleEquationMotion(plan, 0.25);
  const freshEarlier = sampleEquationMotion(plan, 0.25);

  assert.deepEqual(
    findFrameToken(earlierAfterLater, "rhs.4").pose,
    findFrameToken(freshEarlier, "rhs.4").pose
  );
});

test("sampleEquationMotion linearly interpolates all pose fields", () => {
  const plan: EquationMotionPlan = {
    sourceLatex: "x",
    targetLatex: "x",
    tokens: [
      {
        id: "x",
        lifecycle: "persist",
        correspondenceRelation: "identity",
        label: "x",
        sourceMotionId: "x",
        targetMotionId: "x"
      }
    ],
    tracks: [
      {
        tokenId: "x",
        lifecycle: "persist",
        start: 0,
        end: 1,
        easing: "linear",
        from: { opacity: 0, x: 0, y: 0, scale: 1 },
        to: { opacity: 1, x: 10, y: 20, scale: 2 }
      }
    ]
  };

  assert.deepEqual(findFrameToken(sampleEquationMotion(plan, 0.5), "x").pose, {
    opacity: 0.5,
    x: 5,
    y: 10,
    scale: 1.5
  });
});

test("sampleEquationMotion applies exact ease-out progress", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "right",
      rule: "evaluate-constant-difference"
    }
  });
  const plan = createEquationMotionPlan(transition);

  assertNearlyEqual(findOpacity(sampleEquationMotion(plan, 0.55), "rhs.4"), 0.75);
});

test("sampleEquationMotion returns independent pose objects", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "right",
      rule: "evaluate-constant-difference"
    }
  });
  const plan = createEquationMotionPlan(transition);

  const first = sampleEquationMotion(plan, 0.55);
  const second = sampleEquationMotion(plan, 0.55);

  (findFrameToken(first, "rhs.4").pose as { opacity: number }).opacity = 0;

  assertNearlyEqual(findOpacity(second, "rhs.4"), 0.75);
});

test("sampleEquationMotion defensively samples invalid track ranges", () => {
  const plan: EquationMotionPlan = {
    sourceLatex: "x",
    targetLatex: "x",
    tokens: [
      {
        id: "x",
        lifecycle: "persist",
        correspondenceRelation: "identity",
        label: "x",
        sourceMotionId: "x",
        targetMotionId: "x"
      }
    ],
    tracks: [
      {
        tokenId: "x",
        lifecycle: "persist",
        start: 0.5,
        end: 0.5,
        easing: "linear",
        from: { opacity: 0, x: 0, y: 0, scale: 1 },
        to: { opacity: 1, x: 10, y: 20, scale: 2 }
      }
    ]
  };

  assert.deepEqual(findFrameToken(sampleEquationMotion(plan, 0.49), "x").pose, {
    opacity: 0,
    x: 0,
    y: 0,
    scale: 1
  });
  assert.deepEqual(findFrameToken(sampleEquationMotion(plan, 0.5), "x").pose, {
    opacity: 1,
    x: 10,
    y: 20,
    scale: 2
  });

  const reversedPlan: EquationMotionPlan = {
    ...plan,
    tracks: [
      {
        tokenId: "x",
        lifecycle: "persist",
        start: 0.7,
        end: 0.3,
        easing: "linear",
        from: { opacity: 0, x: 0, y: 0, scale: 1 },
        to: { opacity: 1, x: 10, y: 20, scale: 2 }
      }
    ]
  };

  assert.deepEqual(
    findFrameToken(sampleEquationMotion(reversedPlan, 0.69), "x").pose,
    {
      opacity: 0,
      x: 0,
      y: 0,
      scale: 1
    }
  );
  assert.deepEqual(
    findFrameToken(sampleEquationMotion(reversedPlan, 0.7), "x").pose,
    {
      opacity: 1,
      x: 10,
      y: 20,
      scale: 2
    }
  );
});
