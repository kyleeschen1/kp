import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpReaderClockSample
} from "../src/reader/runtime/playback-clock.ts";
import {
  createKpPlaceValueAdditionRuntimeSession,
  isKpPlaceValueAdditionRuntimeFrame,
  isKpPlaceValueAdditionRuntimeSession,
  sampleKpPlaceValueAdditionRuntime,
  type KpPlaceValueAdditionRuntimeSession
} from "../src/rendering/place-value-addition-runtime.ts";

test("one session owns both views, one trace, and one reader clock authority", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();

  assert.equal(isKpPlaceValueAdditionRuntimeSession(session), true);
  assert.equal(session.rendererSessionCount, 1);
  assert.equal(session.clockAuthority, "reader-playback-clock");
  assert.deepEqual(session.mountedViews, ["written", "base-ten"]);
  assert.equal(session.written.traceId, session.foundation.trace.id);
  assert.equal(session.baseTen.traceId, session.foundation.trace.id);
});

test("one immutable sample supplies both projections and exact beat progress", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const clock = createKpReaderClockSample({
    source: "controls",
    progress: 0.325,
    previousProgress: 0.2,
    sequence: 4
  });
  const frame = sampleKpPlaceValueAdditionRuntime({
    session,
    clock,
    viewportWidth: 960
  });

  assert.equal(isKpPlaceValueAdditionRuntimeFrame(frame), true);
  assert.equal(frame.clock.direction, "forward");
  assert.equal(frame.clock, frame.clock);
  assert.equal(frame.beat.id, "beat.place-value.exchange-ones");
  assert.equal(frame.beatProgress, 0.5);
  assert.equal(frame.sourceState.id, "state.place-value.ones-evaluated");
  assert.equal(frame.targetState.id, "state.place-value.ones-exchanged");
  assert.equal(frame.written, session.written);
  assert.equal(frame.baseTen.source.exactUnitCount, 434);
  assert.equal(frame.baseTen.target.exactUnitCount, 434);
  assert.deepEqual(frame.responsive.visibleViews, ["written", "base-ten"]);
  assert.equal(Object.isFrozen(frame), true);
});

test("direction changes control intent but never absolute sampled truth", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const forward = sampleKpPlaceValueAdditionRuntime({
    session,
    clock: createKpReaderClockSample({
      source: "autoplay",
      progress: 0.635,
      previousProgress: 0.5,
      sequence: 1
    }),
    viewportWidth: 960
  });
  const rewind = sampleKpPlaceValueAdditionRuntime({
    session,
    clock: createKpReaderClockSample({
      source: "controls",
      progress: 0.635,
      previousProgress: 0.8,
      sequence: 2
    }),
    viewportWidth: 960
  });

  assert.equal(forward.clock.direction, "forward");
  assert.equal(rewind.clock.direction, "rewind");
  assert.equal(forward.beat, rewind.beat);
  assert.equal(forward.beatProgress, rewind.beatProgress);
  assert.equal(forward.sourceState, rewind.sourceState);
  assert.equal(forward.targetState, rewind.targetState);
  assert.equal(forward.baseTen.source, rewind.baseTen.source);
  assert.equal(forward.baseTen.target, rewind.baseTen.target);
});

test("exact boundaries enter the next beat from the prior stable target", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const frame = sampleKpPlaceValueAdditionRuntime({
    session,
    clock: createKpReaderClockSample({
      source: "url",
      progress: 0.4,
      previousProgress: 0,
      sequence: 1
    }),
    viewportWidth: 960
  });

  assert.equal(frame.beat.id, "beat.place-value.evaluate-tens");
  assert.equal(frame.beatProgress, 0);
  assert.equal(frame.sourceState.id, "state.place-value.ones-exchanged");
  assert.equal(frame.stableState, frame.sourceState);
});

test("phone switches visibility without changing the mounted view inventory", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const clock = createKpReaderClockSample({
    source: "initial",
    progress: 0
  });
  const written = sampleKpPlaceValueAdditionRuntime({
    session,
    clock,
    viewportWidth: 390,
    selectedView: "written"
  });
  const blocks = sampleKpPlaceValueAdditionRuntime({
    session,
    clock,
    viewportWidth: 390,
    selectedView: "base-ten"
  });

  assert.deepEqual(written.responsive.mountedViews, ["written", "base-ten"]);
  assert.deepEqual(blocks.responsive.mountedViews, ["written", "base-ten"]);
  assert.deepEqual(written.responsive.visibleViews, ["written"]);
  assert.deepEqual(blocks.responsive.visibleViews, ["base-ten"]);
  assert.equal(written.written, blocks.written);
  assert.equal(written.baseTen.stable, blocks.baseTen.stable);
});

test("copied sessions and malformed clock samples cannot enter runtime", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const clock = createKpReaderClockSample({
    source: "initial",
    progress: 0
  });

  assert.throws(
    () => sampleKpPlaceValueAdditionRuntime({
      session: { ...session } as KpPlaceValueAdditionRuntimeSession,
      clock,
      viewportWidth: 960
    }),
    /sealed shared session/
  );
  assert.throws(
    () => sampleKpPlaceValueAdditionRuntime({
      session,
      clock: { ...clock, progressPermille: 1 },
      viewportWidth: 960
    }),
    /playback-clock sample/
  );
});
