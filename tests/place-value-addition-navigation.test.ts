import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPlaceValueAdditionNavigationSession,
  isKpPlaceValueAdditionNavigationSession
} from "../src/rendering/place-value-addition-navigation.ts";

test("one existing player toggle owns place-value playback", () => {
  const navigation = createKpPlaceValueAdditionNavigationSession({
    viewportWidth: 960
  });

  assert.equal(
    isKpPlaceValueAdditionNavigationSession(navigation),
    true
  );
  assert.equal(navigation.playbackAuthority, "editor-animation-player");
  assert.deepEqual(navigation.transportControls, ["toggle"]);
  assert.equal("play" in navigation, false);
  assert.equal("pause" in navigation, false);
  assert.equal(
    isKpPlaceValueAdditionNavigationSession({ ...navigation }),
    false
  );
});

test("every outline action resolves its exact stable semantic start", () => {
  const navigation = createKpPlaceValueAdditionNavigationSession({
    viewportWidth: 960
  });

  const frames = navigation.outlineAnchors.map((anchor) => {
    const frame = navigation.seekOutline(anchor.id);
    return {
      progress: frame.clock.progressPermille,
      checkpoint: frame.clock.checkpointId,
      state: frame.stableState.id,
      beat: frame.beat.id,
      beatProgress: frame.beatProgress
    };
  });

  assert.deepEqual(
    frames.map(({ progress }) => progress),
    [0, 100, 400, 710, 1_000]
  );
  assert.deepEqual(
    frames.map(({ state }) => state),
    [
      "state.place-value.established",
      "state.place-value.established",
      "state.place-value.ones-exchanged",
      "state.place-value.tens-exchanged",
      "state.place-value.settled"
    ]
  );
  assert.ok(frames.every(({ checkpoint }, index) =>
    checkpoint === navigation.outlineAnchors[index]!.id
  ));
  assert.deepEqual(
    frames.slice(1, 4).map(({ beatProgress }) => beatProgress),
    [0, 0, 0]
  );
});

test("direct seek rewind and replay are history-independent", () => {
  const navigation = createKpPlaceValueAdditionNavigationSession({
    viewportWidth: 390,
    selectedView: "written"
  });
  const fingerprint = (
    frame: ReturnType<typeof navigation.sampleProgress>
  ) => ({
    beatId: frame.beat.id,
    beatProgress: frame.beatProgress,
    sourceStateId: frame.sourceState.id,
    targetStateId: frame.targetState.id,
    stableStateId: frame.stableState.id,
    baseTenSourceId: frame.baseTen.source.stateId,
    baseTenTargetId: frame.baseTen.target.stateId,
    baseTenStableId: frame.baseTen.stable.stateId,
    responsive: frame.responsive
  });

  navigation.sampleProgress({ progress: 0.92, source: "controls" });
  const rewind = navigation.sampleProgress({
    progress: 0.325,
    source: "controls"
  });
  navigation.sampleProgress({ progress: 0.03, source: "controls" });
  const replay = navigation.sampleProgress({
    progress: 0.325,
    source: "autoplay"
  });

  assert.equal(rewind.clock.direction, "rewind");
  assert.equal(replay.clock.direction, "forward");
  assert.deepEqual(fingerprint(replay), fingerprint(rewind));
  assert.equal(replay.clock.progress, rewind.clock.progress);
});

test("folding changes disclosure without changing time or truth", () => {
  const navigation = createKpPlaceValueAdditionNavigationSession({
    viewportWidth: 960
  });
  navigation.sampleProgress({ progress: 0.64, source: "controls" });
  const frame = navigation.frame;
  const truth = navigation.fold.semanticTruth;

  const collapsed = navigation.setFold({ mode: "collapsed" });
  const oneOpen = navigation.toggleFold(
    "evaluation.place-value.tens"
  );
  const closedAgain = navigation.toggleFold(
    "evaluation.place-value.tens"
  );

  assert.deepEqual(collapsed.expandedNodeIds, []);
  assert.deepEqual(oneOpen.expandedNodeIds, [
    "evaluation.place-value.tens"
  ]);
  assert.deepEqual(closedAgain.expandedNodeIds, []);
  assert.deepEqual(oneOpen.semanticTruth, truth);
  assert.equal(navigation.frame, frame);
  assert.equal(navigation.frame.clock.progress, 0.64);
  assert.throws(
    () => navigation.toggleFold("beat.place-value.evaluate-tens"),
    /unknown place-value group/
  );
});
