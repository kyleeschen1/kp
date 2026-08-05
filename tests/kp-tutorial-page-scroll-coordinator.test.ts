import assert from "node:assert/strict";
import test from "node:test";

import {
  KpTutorialPageScrollCoordinator,
  projectKpTutorialPageScrollFrame,
  type KpTutorialPageScrollBlockRegistration,
  type KpTutorialPageScrollProjection
} from "../src/tutorial/kp-tutorial-page-scroll-coordinator.ts";
import {
  kpTutorialTwelvePassagePageFixture
} from "../src/tutorial/kp-tutorial-motion-passage-fixtures.ts";

const corridor = Object.freeze({
  startViewportRatio: 0.6,
  endViewportRatio: 0.2,
  keyframes: Object.freeze([
    Object.freeze({ travel: 0, progress: 0 }),
    Object.freeze({ travel: 1, progress: 1 })
  ])
});

test("page projection preserves passage and local block identity", () => {
  const anchor = {} as HTMLElement;
  const registrations = [
    { id: "r1", passageId: "p1", blockId: "explain", anchor, corridor },
    { id: "r2", passageId: "p2", blockId: "transform", anchor, corridor }
  ] as const;
  const projection = projectKpTutorialPageScrollFrame({
    registrations,
    projection: {
      activeBlockId: "r2",
      readingBandY: 280,
      scrollY: 400,
      scrollChanged: true,
      blocks: [
        {
          id: "r1",
          anchorTop: -120,
          travel: 1,
          progress: 1,
          distanceFromReadingBand: 400,
          ownsScroll: false
        },
        {
          id: "r2",
          anchorTop: 280,
          travel: 0.5,
          progress: 0.5,
          distanceFromReadingBand: 0,
          ownsScroll: true
        }
      ]
    }
  });

  assert.equal(projection.activeRegistrationId, "r2");
  assert.equal(projection.activePassageId, "p2");
  assert.equal(projection.activeBlockId, "transform");
  assert.deepEqual(
    projection.blocks.map(({ passageId, blockId, ownsScroll }) => ({
      passageId,
      blockId,
      ownsScroll
    })),
    [
      { passageId: "p1", blockId: "explain", ownsScroll: false },
      { passageId: "p2", blockId: "transform", ownsScroll: true }
    ]
  );
});

test("twelve passages share one listener, one pending frame, and cached geometry", () => {
  const frameCallbacks = new Map<number, FrameRequestCallback>();
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  let nextFrame = 1;
  let scrollY = 0;
  let layoutReads = 0;
  const view = {
    innerHeight: kpTutorialTwelvePassagePageFixture.viewportBlockSize,
    get scrollY() { return scrollY; },
    requestAnimationFrame(callback: FrameRequestCallback): number {
      const id = nextFrame++;
      frameCallbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id: number): void { frameCallbacks.delete(id); },
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject
    ): void {
      const bucket = listeners.get(type) ?? new Set();
      bucket.add(listener);
      listeners.set(type, bucket);
    },
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject
    ): void {
      listeners.get(type)?.delete(listener);
    }
  } as unknown as Window;
  const registrations = kpTutorialTwelvePassagePageFixture.passages.map(
    (passage) => ({
      id: `registration.${passage.id}`,
      passageId: passage.id,
      blockId: "primary",
      anchor: {
        getBoundingClientRect: () => {
          layoutReads += 1;
          const top = passage.documentTop - scrollY;
          return {
            top,
            bottom: top + passage.reservedStageBlockSize,
            height: passage.reservedStageBlockSize
          } as DOMRect;
        }
      } as HTMLElement,
      corridor
    })
  ) satisfies readonly KpTutorialPageScrollBlockRegistration[];
  const projections: KpTutorialPageScrollProjection[] = [];
  const coordinator = new KpTutorialPageScrollCoordinator(
    view,
    () => registrations,
    (projection) => projections.push(projection),
    { profileExecution: true, now: () => 0 }
  );

  coordinator.connect();
  coordinator.scheduleProjection();
  coordinator.scheduleProjection();
  assert.equal(listeners.get("scroll")?.size, 1);
  assert.equal(listeners.get("resize")?.size, 1);
  assert.equal(frameCallbacks.size, 1);
  runNextFrame(frameCallbacks);
  assert.equal(projections.length, 1);
  assert.equal(projections[0]!.blocks.length, 12);
  assert.equal(layoutReads, 12);

  scrollY = 720;
  dispatch(listeners, "scroll");
  dispatch(listeners, "scroll");
  assert.equal(frameCallbacks.size, 1);
  runNextFrame(frameCallbacks);
  assert.equal(projections.length, 2);
  assert.equal(layoutReads, 12);
  assert.deepEqual(coordinator.snapshotMetrics(), {
    scrollEvents: 2,
    resizeEvents: 0,
    scheduleRequests: 5,
    coalescedRequests: 3,
    requestedFrames: 2,
    executedFrames: 2,
    registrationReads: 12,
    layoutReads: 12,
    totalExecutionMs: 0,
    longestExecutionMs: 0
  });

  coordinator.disconnect();
  assert.equal(listeners.get("scroll")?.size, 0);
  assert.equal(listeners.get("resize")?.size, 0);
});

test("duplicate page registration identity fails before a frame can run", () => {
  const anchor = {} as HTMLElement;
  assert.throws(() => projectKpTutorialPageScrollFrame({
    registrations: [
      { id: "duplicate", passageId: "one", blockId: "a", anchor, corridor },
      { id: "duplicate", passageId: "two", blockId: "b", anchor, corridor }
    ],
    projection: {
      activeBlockId: undefined,
      readingBandY: 0,
      scrollY: 0,
      scrollChanged: false,
      blocks: []
    }
  }), /registration ids must be unique/);
});

function dispatch(
  listeners: ReadonlyMap<string, Set<EventListenerOrEventListenerObject>>,
  type: string
): void {
  for (const listener of listeners.get(type) ?? []) {
    if (typeof listener === "function") listener(new Event(type));
    else listener.handleEvent(new Event(type));
  }
}

function runNextFrame(callbacks: Map<number, FrameRequestCallback>): void {
  const next = callbacks.entries().next().value;
  assert.ok(next);
  callbacks.delete(next[0]);
  next[1](0);
}
