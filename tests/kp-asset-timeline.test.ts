import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpTimelineSpec,
  sampleKpTimeline,
  validateKpTimelineSpec
} from "../src/semantic/asset-timeline.ts";

test("createKpTimelineSpec records beats events and deterministic samples", () => {
  const timeline = createKpTimelineSpec({
    id: "timeline.linear-solve",
    durationMs: 1000,
    beats: [
      {
        id: "beat.subtract",
        label: "Subtract both sides",
        startMs: 0,
        durationMs: 400,
        transformationIds: ["transform.subtract-both-sides.3"]
      },
      {
        id: "beat.cancel",
        label: "Cancel inverses",
        startMs: 400,
        durationMs: 300,
        transformationIds: ["transform.cancel-additive-inverses"]
      }
    ],
    events: [
      {
        id: "event.pause-after-cancel",
        kind: "pause",
        timeMs: 700,
        label: "Pause after cancellation"
      },
      {
        id: "event.checkpoint-subtract",
        kind: "checkpoint",
        timeMs: 400,
        label: "Both sides contain inverse terms"
      }
    ]
  });

  assert.deepEqual(validateKpTimelineSpec(timeline), []);
  assert.deepEqual(sampleKpTimeline(timeline, 250), {
    timeMs: 250,
    progress: 0.25,
    activeBeatIds: ["beat.subtract"],
    elapsedEventIds: []
  });
  assert.deepEqual(sampleKpTimeline(timeline, 650), {
    timeMs: 650,
    progress: 0.65,
    activeBeatIds: ["beat.cancel"],
    elapsedEventIds: ["event.checkpoint-subtract"]
  });
});

test("sampleKpTimeline clamps time to the timeline domain", () => {
  const timeline = createKpTimelineSpec({
    id: "timeline.clamped",
    durationMs: 200,
    beats: [
      {
        id: "beat.only",
        label: "Only beat",
        startMs: 0,
        durationMs: 200
      }
    ]
  });

  assert.deepEqual(sampleKpTimeline(timeline, -20), {
    timeMs: 0,
    progress: 0,
    activeBeatIds: ["beat.only"],
    elapsedEventIds: []
  });
  assert.deepEqual(sampleKpTimeline(timeline, 250), {
    timeMs: 200,
    progress: 1,
    activeBeatIds: ["beat.only"],
    elapsedEventIds: []
  });
});

test("validateKpTimelineSpec reports invalid beat and event boundaries", () => {
  const timeline = createKpTimelineSpec({
    id: "timeline.bad",
    durationMs: 500,
    beats: [
      {
        id: "beat.duplicate",
        label: "Duplicate",
        startMs: 0,
        durationMs: 200
      },
      {
        id: "beat.duplicate",
        label: "Too late",
        startMs: 450,
        durationMs: 100
      }
    ],
    events: [
      {
        id: "event.too-late",
        kind: "checkpoint",
        timeMs: 600,
        label: "Too late"
      }
    ]
  });

  assert.deepEqual(validateKpTimelineSpec(timeline), [
    {
      path: "beats[1].id",
      message: "Duplicate timeline beat id: beat.duplicate."
    },
    {
      path: "beats[1].durationMs",
      message: "Timeline beat beat.duplicate must end within timeline duration."
    },
    {
      path: "events[0].timeMs",
      message: "Timeline event event.too-late must be within timeline duration."
    }
  ]);
});

test("createKpTimelineSpec rejects invalid duration", () => {
  assert.throws(
    () =>
      createKpTimelineSpec({
        id: "timeline.bad-duration",
        durationMs: 0
      }),
    /durationMs must be positive/
  );
});
