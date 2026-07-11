import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveFrameSequencePreviewSmokeFixture } from "../src/tutorial/frame-sequence-preview-smoke-fixture.ts";
import { validateKpTutorialFrameSequenceRewind } from "../src/tutorial/frame-sequence-rewind-check.ts";

test("frame sequence rewind check verifies exact reverse frame ids", () => {
  const fixture = createLinearSolveFrameSequencePreviewSmokeFixture();
  const check = validateKpTutorialFrameSequenceRewind(fixture.sequence);

  assert.equal(
    check.id,
    "rewind-check.frame-sequence.frame-export.tutorial.linear-solve.card.gif"
  );
  assert.equal(check.sequenceId, fixture.sequence.id);
  assert.equal(check.deterministic, true);
  assert.deepEqual(check.forwardFrameIds, [
    "frame-sequence.timeline-linear-solve-shared.0000",
    "frame-sequence.timeline-linear-solve-shared.0001",
    "frame-sequence.timeline-linear-solve-shared.0002",
    "frame-sequence.timeline-linear-solve-shared.0003",
    "frame-sequence.timeline-linear-solve-shared.0004"
  ]);
  assert.deepEqual(check.expectedRewindFrameIds, [
    "frame-sequence.timeline-linear-solve-shared.0004",
    "frame-sequence.timeline-linear-solve-shared.0003",
    "frame-sequence.timeline-linear-solve-shared.0002",
    "frame-sequence.timeline-linear-solve-shared.0001",
    "frame-sequence.timeline-linear-solve-shared.0000"
  ]);
  assert.deepEqual(check.actualRewindFrameIds, check.expectedRewindFrameIds);
  assert.deepEqual(check.diagnostics, []);
});

test("frame sequence rewind check reports drift from expected reverse order", () => {
  const fixture = createLinearSolveFrameSequencePreviewSmokeFixture();
  const check = validateKpTutorialFrameSequenceRewind({
    ...fixture.sequence,
    rewindFrameIds: fixture.sequence.frames.map((frame) => frame.id)
  });

  assert.equal(check.deterministic, false);
  assert.deepEqual(check.diagnostics, [
    {
      path: "rewindFrameIds",
      message:
        "Frame sequence rewind ids must equal forward frame ids in exact reverse order."
    }
  ]);
});
