import assert from "node:assert/strict";
import test from "node:test";

import {
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
