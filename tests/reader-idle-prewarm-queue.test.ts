import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpReaderCanonicalEquationSession,
  type KpReaderCanonicalEquationFrame
} from "../src/reader/app/reader-canonical-equation-session.ts";
import {
  createKpReaderIdlePrewarmQueue,
  type KpReaderIdleDeadline
} from "../src/reader/runtime/public-api.ts";

test("idle prewarm is bounded, latest-only, and consumes one task per idle turn", () => {
  const callbacks = new Map<number, (deadline: KpReaderIdleDeadline) => void>();
  const cancelled: number[] = [];
  const ran: string[] = [];
  let nextId = 0;
  const queue = createKpReaderIdlePrewarmQueue({
    maximumPending: 2,
    clock: {
      request(callback) {
        nextId += 1;
        callbacks.set(nextId, callback);
        return nextId;
      },
      cancel(requestId) {
        cancelled.push(requestId);
        callbacks.delete(requestId);
      }
    }
  });
  queue.replace([
    { id: "old", run: () => ran.push("old") }
  ]);
  queue.replace([
    { id: "next", run: () => ran.push("next") },
    { id: "prior", run: () => ran.push("prior") },
    { id: "out-of-bound", run: () => ran.push("out-of-bound") }
  ]);
  assert.deepEqual(cancelled, [1]);

  callbacks.get(2)?.({ didTimeout: false, timeRemaining: () => 5 });
  callbacks.get(3)?.({ didTimeout: true, timeRemaining: () => 0 });
  assert.deepEqual(ran, ["next", "prior"]);
  assert.equal(callbacks.size, 2);

  queue.dispose();
});

for (const mutation of ["width", "height", "font", "pixel-ratio"] as const) {
  test(`queued native prewarm discards stale ${mutation} before observing paint`, () => {
    const fixture = queuedNativePrewarm();
    fixture.session.prewarm([fixture.frame]);
    if (mutation === "width") fixture.surface.offsetWidth = 360;
    if (mutation === "height") fixture.surface.offsetHeight = 200;
    if (mutation === "font") fixture.font.revision += 1;
    if (mutation === "pixel-ratio") fixture.ownerWindow.devicePixelRatio = 2;
    assert.doesNotThrow(fixture.flush);
    assert.equal(fixture.session.inspect().purePlanCacheSize, 0);
    fixture.session.dispose();
  });
}

test("fresh queued prewarm still enters native observation and propagates errors", () => {
  const fixture = queuedNativePrewarm();
  fixture.session.prewarm([fixture.frame]);
  assert.throws(fixture.flush, /native observation reached/);
  fixture.session.dispose();
});

test("prewarm cannot observe a host-invalidated layout even when queued dimensions match", () => {
  const fixture = queuedNativePrewarm();
  let current = true;
  fixture.session.prewarm([fixture.frame], () => current);
  current = false;
  assert.doesNotThrow(fixture.flush);
  assert.equal(fixture.session.inspect().purePlanCacheSize, 0);
  fixture.session.dispose();
});

function queuedNativePrewarm() {
  let callback: ((deadline: KpReaderIdleDeadline) => void) | undefined;
  const ownerWindow = {
    devicePixelRatio: 1,
    requestIdleCallback(run: (deadline: KpReaderIdleDeadline) => void) {
      callback = run; return 1;
    },
    cancelIdleCallback() { callback = undefined; }
  };
  const surface = {
    offsetWidth: 640, offsetHeight: 240,
    ownerDocument: { defaultView: ownerWindow },
    closest() { return { dataset: { kpReaderTransition: "transition" } }; },
    querySelector() { throw new Error("native observation reached"); }
  };
  const font = { revision: 0 };
  // Only the scheduling boundary is under test; paint access is a fail-fast spy.
  const frame = {
    renderPlan: { id: "render", transitions: [{ id: "transition", source: [], target: [] }] },
    materialPlan: { id: "material", transitions: [{ transitionId: "transition", anchors: [] }] },
    fitSurface: surface, fontReadiness: font,
    measurementIdentity: { revision: 0, coordinateSpaceId: "stage" },
    typographyCacheKey: "type", presentationRevision: "revision",
    motionMode: "continuous", progress: 0
  } as unknown as KpReaderCanonicalEquationFrame;
  const unexpected = (): never => { throw new Error("Unexpected compositor call"); };
  const session = createKpReaderCanonicalEquationSession({
    transitionIds: ["transition"], enableAdjacentPrewarm: true,
    createSession: unexpected, compilePurePlan: unexpected, observeScene: unexpected
  });
  return {
    session, frame, surface, font, ownerWindow,
    flush: () => {
      assert.ok(callback);
      callback({ didTimeout: true, timeRemaining: () => 0 });
    }
  };
}
