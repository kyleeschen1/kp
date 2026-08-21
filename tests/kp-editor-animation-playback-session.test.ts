import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import {
  createKpEditorAnimationPlaybackSession,
  reduceKpEditorAnimationPlaybackSession,
  replaceKpEditorAnimationPlaybackSessionAsset
} from "../src/editor/animation-playback-session.ts";

function createSolveXSession() {
  const catalog = createKpAnimationAssets();
  const descriptor = createKpEditorAnimationLibrary().find(
    (candidate) => candidate.animationId === "animation.linear-solve.solve-x"
  );
  const animation = catalog.find(
    (candidate) => candidate.id === descriptor?.animationId
  );

  assert.ok(descriptor);
  assert.ok(animation);

  return createKpEditorAnimationPlaybackSession({
    descriptor,
    animation,
    catalog
  });
}

test("editor playback session advances, pauses, seeks, and steps on the runtime clock", () => {
  const initial = createSolveXSession();
  const playing = reduceKpEditorAnimationPlaybackSession(initial, {
    type: "play",
    nowMs: 1_000
  });
  const advanced = reduceKpEditorAnimationPlaybackSession(playing, {
    type: "tick",
    nowMs: 1_600
  });
  const paused = reduceKpEditorAnimationPlaybackSession(advanced, {
    type: "pause"
  });
  const sought = reduceKpEditorAnimationPlaybackSession(paused, {
    type: "seek",
    progress: 0.5
  });
  const stepped = reduceKpEditorAnimationPlaybackSession(sought, {
    type: "step"
  });

  assert.equal(initial.player.playbackStatus, "idle");
  assert.equal(playing.player.playbackStatus, "playing");
  assert.equal(advanced.player.progress, 0.25);
  assert.equal(advanced.player.runtimeFrame.clock.elapsedMs, 600);
  assert.equal(paused.player.playbackStatus, "paused");
  assert.equal(paused.lastTickMs, undefined);
  assert.equal(sought.player.progress, 0.5);
  assert.equal(
    stepped.player.progress,
    0.5 + 1 / (stepped.player.beatCount ?? 1)
  );
  assert.equal(stepped.player.runtimeFrame.clock.progress, stepped.player.progress);
});

test("presentation resampling preserves a playing session's clock", () => {
  const playing = reduceKpEditorAnimationPlaybackSession(
    createSolveXSession(),
    { type: "play", nowMs: 1_000 }
  );
  const resampled = reduceKpEditorAnimationPlaybackSession(playing, {
    type: "resample"
  });
  const advanced = reduceKpEditorAnimationPlaybackSession(resampled, {
    type: "tick",
    nowMs: 1_600
  });

  assert.equal(resampled.player.playbackStatus, "playing");
  assert.equal(resampled.lastTickMs, 1_000);
  assert.equal(advanced.player.progress, 0.25);
});

test("editor playback session mirrors position before advancing rewind", () => {
  const sought = reduceKpEditorAnimationPlaybackSession(createSolveXSession(), {
    type: "seek",
    progress: 0.25
  });
  const rewinding = reduceKpEditorAnimationPlaybackSession(sought, {
    type: "rewind",
    nowMs: 2_000
  });
  const advanced = reduceKpEditorAnimationPlaybackSession(rewinding, {
    type: "tick",
    nowMs: 2_600
  });

  assert.equal(rewinding.player.direction, "rewind");
  assert.equal(rewinding.player.progress, 0.75);
  assert.equal(advanced.player.progress, 1);
  assert.equal(advanced.player.playbackStatus, "complete");
  assert.equal(advanced.player.runtimeFrame.clock.direction, "rewind");
});

test("editor playback session changes from rewind to forward without a frame jump", () => {
  const sought = reduceKpEditorAnimationPlaybackSession(createSolveXSession(), {
    type: "seek",
    progress: 0.25
  });
  const rewinding = reduceKpEditorAnimationPlaybackSession(sought, {
    type: "rewind",
    nowMs: 2_000
  });
  const forwarding = reduceKpEditorAnimationPlaybackSession(rewinding, {
    type: "forward",
    nowMs: 2_100
  });

  assert.equal(rewinding.player.direction, "rewind");
  assert.equal(rewinding.player.progress, 0.75);
  assert.equal(forwarding.player.direction, "forward");
  assert.equal(forwarding.player.progress, 0.25);
  assert.deepEqual(forwarding.player.runtimeFrame.phase, sought.player.runtimeFrame.phase);
  assert.deepEqual(
    forwarding.player.runtimeFrame.activeTransformationIds,
    sought.player.runtimeFrame.activeTransformationIds
  );
});

test("editor playback restarts after the scrubber seeks to the terminal frame", () => {
  const terminal = reduceKpEditorAnimationPlaybackSession(
    createSolveXSession(),
    { type: "seek", progress: 1 }
  );
  const replaying = reduceKpEditorAnimationPlaybackSession(terminal, {
    type: "play",
    nowMs: 2_000
  });
  const advanced = reduceKpEditorAnimationPlaybackSession(replaying, {
    type: "tick",
    nowMs: 2_240
  });

  assert.equal(terminal.player.playbackStatus, "paused");
  assert.equal(terminal.player.progress, 1);
  assert.equal(replaying.player.playbackStatus, "playing");
  assert.equal(replaying.player.progress, 0);
  assert.equal(advanced.player.progress, 0.1);
});

test("explicit forward playback restarts a terminal frame after direction normalization", () => {
  const terminalRewindCoordinate = reduceKpEditorAnimationPlaybackSession(
    reduceKpEditorAnimationPlaybackSession(createSolveXSession(), {
      type: "rewind",
      nowMs: 1_000
    }),
    { type: "seek", progress: 0 }
  );
  const forwarding = reduceKpEditorAnimationPlaybackSession(
    terminalRewindCoordinate,
    { type: "forward", nowMs: 2_000 }
  );

  assert.equal(terminalRewindCoordinate.player.direction, "rewind");
  assert.equal(forwarding.player.direction, "forward");
  assert.equal(forwarding.player.playbackStatus, "playing");
  assert.equal(forwarding.player.progress, 0);
});

test("editor playback session reset restores the forward idle frame", () => {
  const rewinding = reduceKpEditorAnimationPlaybackSession(
    reduceKpEditorAnimationPlaybackSession(createSolveXSession(), {
      type: "seek",
      progress: 0.75
    }),
    { type: "rewind", nowMs: 100 }
  );
  const reset = reduceKpEditorAnimationPlaybackSession(rewinding, {
    type: "reset"
  });

  assert.equal(reset.player.playbackStatus, "idle");
  assert.equal(reset.player.direction, "forward");
  assert.equal(reset.player.progress, 0);
  assert.equal(reset.lastTickMs, undefined);
});

test("editor playback seeks stable semantic checkpoints without direction jumps", () => {
  const checkpoint = {
    id: "timeline.solve.semantic-checkpoint.20",
    progress: 0.4,
    beat: 20,
    startingPhaseIds: ["cancel-collapse" as const],
    endingPhaseIds: ["cancel-meet" as const],
    label: "Finish meeting; begin collapse"
  };
  const forward = reduceKpEditorAnimationPlaybackSession(createSolveXSession(), {
    type: "seek-semantic-checkpoint",
    checkpoint
  });
  const rewindSession = reduceKpEditorAnimationPlaybackSession(
    createSolveXSession(),
    { type: "rewind", nowMs: 100 }
  );
  const rewind = reduceKpEditorAnimationPlaybackSession(rewindSession, {
    type: "seek-semantic-checkpoint",
    checkpoint
  });

  assert.equal(forward.player.progress, 0.4);
  assert.equal(rewind.player.progress, 0.6);
  assert.equal(forward.semanticCheckpointId, checkpoint.id);
  assert.equal(rewind.semanticCheckpointId, checkpoint.id);
  assert.equal(rewind.player.direction, "rewind");
});

test("editor playback applies authoring tempo without changing the shared clock contract", () => {
  const faster = reduceKpEditorAnimationPlaybackSession(createSolveXSession(), {
    type: "set-tempo",
    multiplier: 2
  });
  const playing = reduceKpEditorAnimationPlaybackSession(faster, {
    type: "play",
    nowMs: 1_000
  });
  const advanced = reduceKpEditorAnimationPlaybackSession(playing, {
    type: "tick",
    nowMs: 1_300
  });

  assert.equal(faster.tempoMultiplier, 2);
  assert.equal(advanced.player.progress, 0.25);
  assert.equal(advanced.player.runtimeFrame.clock.progress, 0.25);
});

test("same-identity parameter replacement preserves playhead and pauses playback", () => {
  const playing = reduceKpEditorAnimationPlaybackSession(
    reduceKpEditorAnimationPlaybackSession(createSolveXSession(), {
      type: "seek",
      progress: 0.5
    }),
    { type: "play", nowMs: 1_000 }
  );
  const replacement = {
    ...playing.animation,
    title: "Parameterized same-identity solve-x"
  };
  const next = replaceKpEditorAnimationPlaybackSessionAsset({
    session: playing,
    animation: replacement
  });

  assert.equal(next.animation, replacement);
  assert.equal(next.player.progress, 0.5);
  assert.equal(next.player.direction, "forward");
  assert.equal(next.player.playbackStatus, "paused");
  assert.equal(next.lastTickMs, undefined);
  assert.equal(
    next.catalog.find(({ id }) => id === replacement.id),
    replacement
  );
  assert.throws(
    () => replaceKpEditorAnimationPlaybackSessionAsset({
      session: playing,
      animation: { ...replacement, id: "animation.other" }
    }),
    /Cannot replace/
  );
});
