import assert from "node:assert/strict";
import test from "node:test";

import {
  adjacentKpDeltaEpsilonFocusDeckBeat,
  kpDeltaEpsilonFocusDeckBeatIds,
  kpDeltaEpsilonFocusDeckBeats,
  kpDeltaEpsilonFocusDeckHash,
  kpDeltaEpsilonMotionStartProgress,
  readKpDeltaEpsilonFocusDeckBeatFromHash,
  sampleKpDeltaEpsilonFocusDeckFrame
} from "../src/experiments/kinetic-figure-delta-epsilon/kinetic-figure-delta-epsilon-model.ts";
import {
  isKpDeltaEpsilonKineticFigureRoute,
  KP_DELTA_EPSILON_KINETIC_FIGURE_PATH
} from "../src/experiments/kinetic-figure-delta-epsilon/kinetic-figure-delta-epsilon-route.ts";
import { renderKpFocusDeckControlIcon } from
  "../src/experiments/focus-deck-control-icons.ts";

test("delta-epsilon deck follows one hermeneutic cycle", () => {
  assert.deepEqual(kpDeltaEpsilonFocusDeckBeatIds, [
    "read-limit",
    "inspect-hole",
    "set-output-challenge",
    "choose-input-window",
    "reintegrate-proof"
  ]);
  assert.deepEqual(kpDeltaEpsilonFocusDeckBeats.map(({ phase }) => phase), [
    "establish-whole",
    "isolate-part",
    "isolate-part",
    "relate",
    "reintegrate"
  ]);
  assert.deepEqual(
    kpDeltaEpsilonFocusDeckBeats.filter(({ ownsMotion }) => ownsMotion)
      .map(({ id }) => id),
    ["reintegrate-proof"]
  );
});

test("delta equals epsilon throughout the proof motion", () => {
  for (const progress of [kpDeltaEpsilonMotionStartProgress, 0.7, 0.85, 1]) {
    const frame = sampleKpDeltaEpsilonFocusDeckFrame({
      beatId: "reintegrate-proof",
      lens: "context",
      progress
    });
    assert.equal(frame.deltaRadius, frame.epsilonRadius);
    assert.ok(Math.abs(
      (frame.sampleY - 2) - (frame.sampleX - 1)
    ) < 1e-12);
  }
  const start = sampleKpDeltaEpsilonFocusDeckFrame({
    beatId: "reintegrate-proof",
    lens: "context",
    progress: kpDeltaEpsilonMotionStartProgress
  });
  const end = sampleKpDeltaEpsilonFocusDeckFrame({
    beatId: "reintegrate-proof",
    lens: "context",
    progress: 1
  });
  assert.ok(end.epsilonRadius < start.epsilonRadius);
  assert.equal(end.definitionPresent, true);
});

test("inspect changes salience without changing geometry or presence", () => {
  const context = sampleKpDeltaEpsilonFocusDeckFrame({
    beatId: "set-output-challenge",
    lens: "context",
    progress: 0.38
  });
  const inspect = sampleKpDeltaEpsilonFocusDeckFrame({
    beatId: "set-output-challenge",
    lens: "inspect",
    progress: 0.38
  });
  assert.equal(context.epsilonRadius, inspect.epsilonRadius);
  assert.equal(context.epsilonBandPresent, inspect.epsilonBandPresent);
  assert.equal(inspect.entitySalience["epsilon-band"], "focus");
  assert.equal(inspect.entitySalience.curve, "context");
});

test("delta-epsilon beats have semantic URLs and bounded adjacency", () => {
  assert.equal(
    readKpDeltaEpsilonFocusDeckBeatFromHash("#beat.inspect-hole").id,
    "inspect-hole"
  );
  assert.equal(
    kpDeltaEpsilonFocusDeckHash("reintegrate-proof"),
    "#beat.reintegrate-proof"
  );
  assert.equal(adjacentKpDeltaEpsilonFocusDeckBeat({
    beatId: "read-limit",
    direction: -1
  }).id, "read-limit");
});

test("delta-epsilon route and transport icons remain exact", () => {
  assert.equal(KP_DELTA_EPSILON_KINETIC_FIGURE_PATH,
    "/experiments/kinetic-figure/delta-epsilon/");
  assert.equal(isKpDeltaEpsilonKineticFigureRoute(
    "/experiments/kinetic-figure/delta-epsilon"), true);
  assert.match(renderKpFocusDeckControlIcon("play"),
    /data-kp-focus-deck-control-icon="play"/u);
  assert.doesNotMatch(renderKpFocusDeckControlIcon("next"), />Next</u);
});
