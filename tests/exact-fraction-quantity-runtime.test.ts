import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExactFractionQuantityRuntimeSession,
  isKpExactFractionQuantityRuntimeSession,
  sampleKpExactFractionQuantityRuntime
} from "../src/rendering/exact-fraction-quantity-runtime.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../src/reader/compiler/exact-fraction-quantity-preservation-manifest.ts";

test("one sealed runtime session owns one renderer and consumes the shared clock", () => {
  const session = createKpExactFractionQuantityRuntimeSession();

  assert.ok(isKpExactFractionQuantityRuntimeSession(session));
  assert.equal(session.rendererSessionCount, 1);
  assert.equal(session.clockAuthority, "shared-animation-runtime-clock");
  assert.equal(session.presentation.beats.length, 5);
  assert.equal(session.symbolic.endpoints.length, 5);
  assert.equal(session.symbolic.transientEndpoints.length, 1);
  assert.ok(Object.isFrozen(session));
});

test("every beat samples through one immutable synchronized runtime frame", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  for (const progressPermille of manifest.presentation.fullMotionSamplesPermille) {
    const frame = sampleKpExactFractionQuantityRuntime({
      session,
      clock: {
        direction: "forward",
        progress: progressPermille / 1_000
      }
    });

    assert.equal(frame.sessionId, session.id);
    assert.equal(frame.rendererSessionId, session.rendererSessionId);
    assert.equal(
      frame.presentationBeatId,
      frame.projection.neutralFrame.beat.id
    );
    assert.equal(frame.viewPaintOwnership.length, 4);
    assert.equal(frame.visibleOperation.viewBindings.length, 4);
    assert.ok(frame.visibleOperation.viewBindings.every((binding) =>
      binding.invocationId === frame.visibleOperation.invocationId &&
      binding.phase === frame.visibleOperation.phase
    ));
    assert.ok(Object.isFrozen(frame));
  }
});

test("paint ownership is exclusive and native at every settled endpoint", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  for (const checkpoint of manifest.checkpoints) {
    const frame = sampleKpExactFractionQuantityRuntime({
      session,
      clock: {
        direction: "forward",
        progress: checkpoint.progressPermille / 1_000
      }
    });

    assert.equal(frame.ownershipPhase, "target-native");
    assert.equal(frame.settlementPolicy, "reuse-native-endpoint-geometry");
    assert.ok(frame.viewPaintOwnership.every((owner) =>
      owner.owner === (owner.view === "symbolic"
        ? "native-katex"
        : "native-svg") &&
      owner.nativeOpacity === 1 &&
      owner.transientOpacity === 0
    ));
  }

  const moving = sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.29 }
  });
  assert.equal(moving.ownershipPhase, "transient");
  assert.ok(moving.viewPaintOwnership.every((owner) =>
    owner.owner === "shared-transient-paint" &&
    owner.nativeOpacity === 0 &&
    owner.transientOpacity === 1
  ));
});

test("direct and rewind sampling share identical absolute visual state", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  for (const progress of [0, 0.18, 0.29, 0.5, 0.72, 0.91, 1]) {
    const forward = sampleKpExactFractionQuantityRuntime({
      session,
      clock: { direction: "forward", progress }
    });
    const rewind = sampleKpExactFractionQuantityRuntime({
      session,
      clock: { direction: "rewind", progress }
    });

    assert.deepEqual(forward.projection, rewind.projection);
    assert.deepEqual(forward.motifFrame, rewind.motifFrame);
    assert.deepEqual(forward.visibleOperation, rewind.visibleOperation);
    assert.deepEqual(forward.symbolicMotion, rewind.symbolicMotion);
    assert.deepEqual(forward.viewPaintOwnership, rewind.viewPaintOwnership);
    assert.equal(forward.ownershipPhase, rewind.ownershipPhase);
    assert.equal(forward.clock.direction, "forward");
    assert.equal(rewind.clock.direction, "rewind");
  }
});

test("motif progress is sampled once from the canonical beat coordinate", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  const refinement = sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.29 }
  });

  assert.equal(refinement.projection.neutralFrame.beat.localProgress, 0.5);
  assert.equal(refinement.motifFrame?.progress, 0.5);
  assert.equal(refinement.visibleOperation.phase, "action");
  assert.equal(refinement.visibleOperation.actionProgress, 0.5);
  assert.match(
    refinement.symbolicMotion.segment.id,
    /evaluate-unit-multiplier/u
  );
  assert.equal(refinement.symbolicMotion.segmentProgress, 0);
  assert.equal(refinement.symbolicMotion.dispatch, "merge-fan-in");
  assert.equal(refinement.easingApplications, 1);
});

test("runtime is history independent and rejects forged sessions", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  const first = sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.72 }
  });
  sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.1 }
  });
  const repeated = sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.72 }
  });

  assert.deepEqual(first, repeated);
  assert.throws(
    () => sampleKpExactFractionQuantityRuntime({
      session: { ...session },
      clock: { direction: "forward", progress: 0.5 }
    }),
    /sealed canonical session/
  );
  assert.throws(
    () => sampleKpExactFractionQuantityRuntime({
      session,
      clock: { direction: "forward", progress: Number.NaN }
    }),
    /progress must be finite/
  );
});
