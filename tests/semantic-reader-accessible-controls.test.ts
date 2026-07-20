import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpReaderClockSample,
  createKpReaderControlModel,
  projectKpReaderMotion
} from "../src/reader/runtime/public-api.ts";

const checkpoints = [
  { id: "read", label: "Read the equality", progressPermille: 0 },
  { id: "subtract", label: "Subtract three", progressPermille: 333 },
  { id: "cancel", label: "Cancel opposites", progressPermille: 667 },
  { id: "solve", label: "Read the solution", progressPermille: 1_000 }
] as const;

test("ordinary motion preserves exact continuous learner progress", () => {
  const projection = projectKpReaderMotion({
    clock: createKpReaderClockSample({ source: "scroll", progress: 0.5 }),
    checkpoints,
    reducedMotion: false
  });
  assert.deepEqual(projection, {
    mode: "continuous",
    progress: 0.5,
    progressPermille: 500,
    checkpointId: "subtract",
    checkpointLabel: "Subtract three"
  });
});

test("reduced motion snaps to meaningful checkpoints with directional ties", () => {
  const forward = projectKpReaderMotion({
    clock: createKpReaderClockSample({
      source: "controls",
      progress: 0.5,
      previousProgress: 0.4
    }),
    checkpoints: [checkpoints[0], { ...checkpoints[1], progressPermille: 400 }, { ...checkpoints[2], progressPermille: 600 }, checkpoints[3]],
    reducedMotion: true
  });
  const rewind = projectKpReaderMotion({
    clock: createKpReaderClockSample({
      source: "controls",
      progress: 0.5,
      previousProgress: 0.6
    }),
    checkpoints: [checkpoints[0], { ...checkpoints[1], progressPermille: 400 }, { ...checkpoints[2], progressPermille: 600 }, checkpoints[3]],
    reducedMotion: true
  });
  assert.equal(forward.progressPermille, 600);
  assert.equal(rewind.progressPermille, 400);
});

test("control model exposes native slider values and descriptive navigation labels", () => {
  const projection = projectKpReaderMotion({
    clock: createKpReaderClockSample({ source: "controls", progress: 0.667 }),
    checkpoints,
    reducedMotion: true
  });
  const controls = createKpReaderControlModel({ projection, checkpoints });
  assert.equal(controls.groupLabel, "Animation controls");
  assert.equal(controls.slider.value, 667);
  assert.equal(controls.slider.valueText, "Cancel opposites, 67 percent");
  assert.equal(controls.previous.label, "Previous: Subtract three");
  assert.equal(controls.next.label, "Next: Read the solution");
  assert.equal(controls.previous.disabled, false);
});

test("first and last checkpoint navigation disables unavailable actions", () => {
  const first = createKpReaderControlModel({
    projection: projectKpReaderMotion({
      clock: createKpReaderClockSample({ source: "initial", progress: 0 }),
      checkpoints,
      reducedMotion: true
    }),
    checkpoints
  });
  const last = createKpReaderControlModel({
    projection: projectKpReaderMotion({
      clock: createKpReaderClockSample({ source: "controls", progress: 1 }),
      checkpoints,
      reducedMotion: true
    }),
    checkpoints
  });
  assert.equal(first.previous.disabled, true);
  assert.equal(last.next.disabled, true);
});
