import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpTutorialMotionBridge,
  projectKpTutorialOrdinaryBeat
} from "../src/tutorial/kp-tutorial-motion-bridge-projection.ts";

test("ordinary beat settles over one fixed interval ending at its anchor", () => {
  assert.deepEqual(projectKpTutorialOrdinaryBeat({
    paragraphTopPx: 392,
    readingAnchorPx: 280,
    approachDistancePx: 112
  }), {
    phase: "waiting",
    progress: 0,
    distanceToAnchorPx: 112
  });
  assert.deepEqual(projectKpTutorialOrdinaryBeat({
    paragraphTopPx: 336,
    readingAnchorPx: 280,
    approachDistancePx: 112
  }), {
    phase: "approaching",
    progress: 0.5,
    distanceToAnchorPx: 56
  });
  assert.deepEqual(projectKpTutorialOrdinaryBeat({
    paragraphTopPx: 280,
    readingAnchorPx: 280,
    approachDistancePx: 112
  }), {
    phase: "settled",
    progress: 1,
    distanceToAnchorPx: 0
  });
});

test("ordinary beat projection is direction and paragraph-height independent", () => {
  const positions = [430, 380, 336, 300, 280, 220];
  const forward = positions.map((paragraphTopPx) =>
    projectKpTutorialOrdinaryBeat({
      paragraphTopPx,
      readingAnchorPx: 280,
      approachDistancePx: 112
    }).progress
  );
  const reverse = [...positions].reverse().map((paragraphTopPx) =>
    projectKpTutorialOrdinaryBeat({
      paragraphTopPx,
      readingAnchorPx: 280,
      approachDistancePx: 112
    }).progress
  ).reverse();
  assert.deepEqual(reverse, forward);
  assert.deepEqual(forward, [0, 3 / 28, 0.5, 23 / 28, 1, 1]);
  assert.equal(
    "paragraphBottomPx" in projectKpTutorialOrdinaryBeat,
    false
  );
});

test("ordinary beat projection rejects invalid geometry", () => {
  assert.throws(() => projectKpTutorialOrdinaryBeat({
    paragraphTopPx: Number.NaN,
    readingAnchorPx: 280,
    approachDistancePx: 112
  }), /paragraph top must be finite/);
  assert.throws(() => projectKpTutorialOrdinaryBeat({
    paragraphTopPx: 392,
    readingAnchorPx: 280,
    approachDistancePx: 0
  }), /approach distance must be positive/);
});

test("motion bridge progress runs exactly between paired prose anchors", () => {
  const input = {
    beforeDocumentTopPx: 1_000,
    afterDocumentTopPx: 1_400,
    readingAnchorPx: 280
  };
  assert.deepEqual(projectKpTutorialMotionBridge({
    ...input,
    scrollY: 720
  }), {
    phase: "before",
    progress: 0,
    startScrollY: 720,
    endScrollY: 1_120,
    distancePx: 400
  });
  assert.deepEqual(projectKpTutorialMotionBridge({
    ...input,
    scrollY: 920
  }), {
    phase: "scrubbing",
    progress: 0.5,
    startScrollY: 720,
    endScrollY: 1_120,
    distancePx: 400
  });
  assert.deepEqual(projectKpTutorialMotionBridge({
    ...input,
    scrollY: 1_120
  }), {
    phase: "after",
    progress: 1,
    startScrollY: 720,
    endScrollY: 1_120,
    distancePx: 400
  });
});

test("motion bridge direct and reverse projections are identical", () => {
  const positions = [700, 720, 820, 920, 1_020, 1_120, 1_200];
  const project = (scrollY: number) => projectKpTutorialMotionBridge({
    scrollY,
    beforeDocumentTopPx: 1_000,
    afterDocumentTopPx: 1_400,
    readingAnchorPx: 280
  });
  const forward = positions.map(project);
  const reverse = [...positions].reverse().map(project).reverse();
  assert.deepEqual(reverse, forward);
  assert.deepEqual(forward.map(({ progress }) => progress), [
    0, 0, 0.25, 0.5, 0.75, 1, 1
  ]);
});

test("motion bridge rejects unordered and non-finite anchors", () => {
  assert.throws(() => projectKpTutorialMotionBridge({
    scrollY: 720,
    beforeDocumentTopPx: 1_000,
    afterDocumentTopPx: 1_000,
    readingAnchorPx: 280
  }), /after anchor must follow/);
  assert.throws(() => projectKpTutorialMotionBridge({
    scrollY: Number.NaN,
    beforeDocumentTopPx: 1_000,
    afterDocumentTopPx: 1_400,
    readingAnchorPx: 280
  }), /scroll position must be finite/);
});
