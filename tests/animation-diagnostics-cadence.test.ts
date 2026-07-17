import assert from "node:assert/strict";
import test from "node:test";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  decideKpEditorAnimationDiagnosticsCadence,
  KP_EDITOR_ANIMATION_DIAGNOSTICS_INTERVAL_MS
} from "../src/editor/animation-diagnostics-cadence.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import {
  createKpEditorAnimationPlayerState,
  type KpEditorAnimationPlaybackStatus
} from "../src/editor/animation-player-state.ts";

const catalog = createKpAnimationAssets();
const descriptor = createKpEditorAnimationLibrary().find(
  (candidate) => candidate.animationId === "animation.linear-solve.solve-x"
)!;
const animation = catalog.find(
  (candidate) => candidate.id === descriptor.animationId
)!;

test("progress-only playback diagnostics publish at a bounded cadence", () => {
  const initial = decideKpEditorAnimationDiagnosticsCadence({
    state: playerState(0.101),
    nowMs: 1_000
  });
  assert.equal(initial.publish, true);
  assert.equal(initial.reason, "initial");

  const early = decideKpEditorAnimationDiagnosticsCadence({
    state: playerState(0.102),
    nowMs: 1_000 + KP_EDITOR_ANIMATION_DIAGNOSTICS_INTERVAL_MS - 1,
    previous: initial.state
  });
  assert.equal(early.publish, false);
  assert.equal(early.reason, "deferred");
  assert.equal(early.state, initial.state);

  const due = decideKpEditorAnimationDiagnosticsCadence({
    state: playerState(0.103),
    nowMs: 1_000 + KP_EDITOR_ANIMATION_DIAGNOSTICS_INTERVAL_MS,
    previous: early.state
  });
  assert.equal(due.publish, true);
  assert.equal(due.reason, "cadence");
  assert.equal(due.state?.publishCount, 2);
});

test("semantic and authoring changes bypass the progress cadence", () => {
  const initial = decideKpEditorAnimationDiagnosticsCadence({
    state: playerState(0.1),
    nowMs: 500,
    revisionKey: "revision:0"
  });
  const phaseChange = decideKpEditorAnimationDiagnosticsCadence({
    state: playerState(0.8),
    nowMs: 501,
    revisionKey: "revision:0",
    previous: initial.state
  });
  assert.equal(phaseChange.publish, true);
  assert.equal(phaseChange.reason, "semantic-change");

  const authoringChange = decideKpEditorAnimationDiagnosticsCadence({
    state: playerState(0.8),
    nowMs: 502,
    revisionKey: "revision:1",
    previous: phaseChange.state
  });
  assert.equal(authoringChange.publish, true);
  assert.equal(authoringChange.reason, "semantic-change");
});

test("paused controls and a reset clock publish exact diagnostics immediately", () => {
  const initial = decideKpEditorAnimationDiagnosticsCadence({
    state: playerState(0.2),
    nowMs: 1_000
  });
  const paused = decideKpEditorAnimationDiagnosticsCadence({
    state: playerState(0.201, "paused"),
    nowMs: 1_001,
    previous: initial.state
  });
  assert.equal(paused.publish, true);
  assert.equal(paused.reason, "semantic-change");

  const pausedSeek = decideKpEditorAnimationDiagnosticsCadence({
    state: playerState(0.202, "paused"),
    nowMs: 1_002,
    previous: paused.state
  });
  assert.equal(pausedSeek.publish, true);
  assert.equal(pausedSeek.reason, "explicit-control");

  const resumed = decideKpEditorAnimationDiagnosticsCadence({
    state: playerState(0.202),
    nowMs: 1_003,
    previous: pausedSeek.state
  });
  const clockReset = decideKpEditorAnimationDiagnosticsCadence({
    state: playerState(0.203),
    nowMs: 20,
    previous: resumed.state
  });
  assert.equal(clockReset.publish, true);
  assert.equal(clockReset.reason, "clock-reset");
});

function playerState(
  progress: number,
  playbackStatus: KpEditorAnimationPlaybackStatus = "playing"
) {
  return createKpEditorAnimationPlayerState({
    descriptor,
    animation,
    catalog,
    playbackStatus,
    progress
  });
}
