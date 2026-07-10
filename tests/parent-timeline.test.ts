import { strict as assert } from "node:assert";
import test from "node:test";

import { createKpTutorialCardRuntimeContext } from "../src/tutorial/card-runtime.ts";
import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import {
  createKpParentTimelineFromRuntimeContext,
  sampleKpParentTimeline
} from "../src/tutorial/parent-timeline.ts";

test("parent timeline indexes layout objects and transformations on one clock", () => {
  const context = createKpTutorialCardRuntimeContext(
    createLinearSolveTutorialCardManifest()
  );
  const timeline = createKpParentTimelineFromRuntimeContext(context);

  assert.equal(timeline.id, "timeline.linear-solve.shared");
  assert.equal(timeline.clockId, "solve-x-shared-clock");
  assert.equal(timeline.durationMs, 2400);
  assert.equal(timeline.beatCount, 50);
  assert.equal(timeline.sampleable, true);
  assert.equal(timeline.reversible, true);
  assert.equal(timeline.tracks.length, 9);
  assert.deepEqual(
    timeline.tracks
      .filter((track) => track.kind === "transformation")
      .map((track) => [
        track.targetId,
        track.startProgress,
        track.endProgress,
        track.startBeat,
        track.endBeat
      ]),
    [
      [
        "transform.linear-solve.subtract-both-sides-3",
        0,
        1 / 3,
        0,
        50 / 3
      ],
      [
        "transform.linear-solve.cancel-left-additive-inverse",
        1 / 3,
        2 / 3,
        50 / 3,
        100 / 3
      ],
      [
        "transform.linear-solve.simplify-right-difference",
        2 / 3,
        1,
        100 / 3,
        50
      ]
    ]
  );
  assert.deepEqual(
    timeline.tracks.slice(0, 2).map((track) => [
      track.kind,
      track.targetId,
      track.startProgress,
      track.endProgress
    ]),
    [
      ["layout", "layout.sample.linear-solve-synchronized-panel", 0, 1],
      ["semantic-object", "equation.linear-solve.initial", 0, 1]
    ]
  );
  assert.equal(timeline.markers.length, 6);
  assert.deepEqual(
    timeline.markers.map((marker) => [
      marker.kind,
      marker.targetId,
      marker.startBeat,
      marker.endBeat,
      marker.placeholder
    ]),
    [
      [
        "focus",
        "transform.linear-solve.subtract-both-sides-3",
        0,
        50 / 3,
        true
      ],
      [
        "annotation",
        "transform.linear-solve.subtract-both-sides-3",
        0,
        50 / 3,
        true
      ],
      [
        "focus",
        "transform.linear-solve.cancel-left-additive-inverse",
        50 / 3,
        100 / 3,
        true
      ],
      [
        "annotation",
        "transform.linear-solve.cancel-left-additive-inverse",
        50 / 3,
        100 / 3,
        true
      ],
      [
        "focus",
        "transform.linear-solve.simplify-right-difference",
        100 / 3,
        50,
        true
      ],
      [
        "annotation",
        "transform.linear-solve.simplify-right-difference",
        100 / 3,
        50,
        true
      ]
    ]
  );
});

test("parent timeline sampling is deterministic for direct seek and rewind", () => {
  const timeline = createKpParentTimelineFromRuntimeContext(
    createKpTutorialCardRuntimeContext(createLinearSolveTutorialCardManifest())
  );
  const frame = sampleKpParentTimeline(timeline, 0.5);
  const rewindFrame = sampleKpParentTimeline(timeline, 0.5);
  const startFrame = sampleKpParentTimeline(timeline, Number.NaN);
  const endFrame = sampleKpParentTimeline(timeline, 2);
  const secondTransform = frame.tracks.find(
    (track) =>
      track.kind === "transformation" &&
      track.targetId === "transform.linear-solve.cancel-left-additive-inverse"
  );
  const firstTransform = frame.tracks.find(
    (track) =>
      track.kind === "transformation" &&
      track.targetId === "transform.linear-solve.subtract-both-sides-3"
  );

  assert.deepEqual(frame, rewindFrame);
  assert.equal(frame.progress, 0.5);
  assert.equal(frame.beat, 25);
  assert.equal(frame.elapsedMs, 1200);
  assert.equal(firstTransform?.localProgress, 1);
  assert.equal(firstTransform?.active, false);
  assert.equal(secondTransform?.localProgress, 0.5);
  assert.equal(secondTransform?.active, true);
  assert.deepEqual(
    frame.markers
      .filter((marker) => marker.active)
      .map((marker) => [marker.kind, marker.targetId, marker.localProgress]),
    [
      ["focus", "transform.linear-solve.cancel-left-additive-inverse", 0.5],
      [
        "annotation",
        "transform.linear-solve.cancel-left-additive-inverse",
        0.5
      ]
    ]
  );
  assert.equal(startFrame.progress, 0);
  assert.equal(startFrame.beat, 0);
  assert.equal(endFrame.progress, 1);
  assert.equal(endFrame.beat, 50);
});
