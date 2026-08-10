import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpReaderPlaybackRangeWindow,
  projectKpReaderRangeGlobalProgress,
  projectKpReaderRangeLocalProgress,
  sampleKpReaderPlaybackRange
} from "../src/reader/runtime/playback-range-window.ts";
import {
  createKpFractionCompositionArticleRuntimeRanges
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-runtime-ranges.ts";

const authoredRange = createKpFractionCompositionArticleRuntimeRanges()[0]!;
const firstRange = defineKpReaderPlaybackRangeWindow({
  id: authoredRange.path,
  start: authoredRange.start,
  end: authoredRange.end
});
const secondAuthoredRange = createKpFractionCompositionArticleRuntimeRanges()[1]!;
const secondRange = defineKpReaderPlaybackRangeWindow({
  id: secondAuthoredRange.path,
  start: secondAuthoredRange.start,
  end: secondAuthoredRange.end
});

test("named ranges preserve exact canonical endpoints", () => {
  assert.equal(projectKpReaderRangeLocalProgress(firstRange, 0), firstRange.start);
  assert.equal(projectKpReaderRangeLocalProgress(firstRange, 1), firstRange.end);
  assert.equal(projectKpReaderRangeGlobalProgress(firstRange, firstRange.start), 0);
  assert.equal(projectKpReaderRangeGlobalProgress(firstRange, firstRange.end), 1);

  const middle = projectKpReaderRangeLocalProgress(firstRange, 0.5);
  assert.equal(projectKpReaderRangeGlobalProgress(firstRange, middle), 0.5);
});

test("forward and rewind samples share the unchanged global clock", () => {
  const middle = projectKpReaderRangeLocalProgress(firstRange, 0.5);
  const forward = sampleKpReaderPlaybackRange({
    range: firstRange,
    previousGlobalProgress: firstRange.start,
    globalProgress: middle,
    status: "playing"
  });
  const rewind = sampleKpReaderPlaybackRange({
    range: firstRange,
    previousGlobalProgress: firstRange.end,
    globalProgress: middle,
    status: "playing"
  });

  assert.equal(forward.direction, "forward");
  assert.equal(rewind.direction, "rewind");
  assert.equal(forward.globalProgress, middle);
  assert.equal(rewind.globalProgress, middle);
  assert.equal(forward.localProgress, rewind.localProgress);
});

test("pause preserves interruption state without rescaling the range", () => {
  const globalProgress = projectKpReaderRangeLocalProgress(firstRange, 0.37);
  const paused = sampleKpReaderPlaybackRange({
    range: firstRange,
    previousGlobalProgress: globalProgress,
    globalProgress,
    status: "paused"
  });

  assert.equal(paused.status, "paused");
  assert.equal(paused.globalProgress, globalProgress);
  assert.ok(Math.abs(paused.localProgress - 0.37) < Number.EPSILON * 8);
  assert.equal(paused.clockClampProgress, undefined);
});

test("overshoot settles at the exact range boundary for either direction", () => {
  const forward = sampleKpReaderPlaybackRange({
    range: firstRange,
    previousGlobalProgress: firstRange.start,
    globalProgress: Math.min(1, firstRange.end + 0.1),
    status: "playing"
  });
  const rewind = sampleKpReaderPlaybackRange({
    range: secondRange,
    previousGlobalProgress: secondRange.end,
    globalProgress: 0,
    status: "playing"
  });

  assert.deepEqual(
    [forward.status, forward.globalProgress, forward.localProgress],
    ["settled", firstRange.end, 1]
  );
  assert.deepEqual(
    [rewind.status, rewind.globalProgress, rewind.localProgress],
    ["settled", secondRange.start, 0]
  );
  assert.equal(forward.clockClampProgress, firstRange.end);
  assert.equal(rewind.clockClampProgress, secondRange.start);
});

test("invalid or degenerate ranges fail before they can own transport", () => {
  assert.throws(() => defineKpReaderPlaybackRangeWindow({
    id: "bad",
    start: 0.5,
    end: 0.5
  }), /end must follow start/u);
  assert.throws(
    () => projectKpReaderRangeLocalProgress(firstRange, Number.NaN),
    /between 0 and 1/u
  );
});
