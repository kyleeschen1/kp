import assert from "node:assert/strict";
import test from "node:test";

import { kpEconomicsMotionBlocks } from "../src/tutorial/economics-demand-shift/economics-demand-shift-motion-blocks.ts";
import { kpLispLessonMotionBlocks } from "../src/tutorial/lisp-function-application/lisp-function-application-motion-blocks.ts";
import {
  KpTutorialScrollCoordinator,
  projectKpTutorialCorridorTravel,
  projectKpTutorialCumulativeMotion,
  projectKpTutorialRebasedCorridor,
  projectKpTutorialScrollFrame,
  resolveKpTutorialCorridorTravelForProgress,
  type KpTutorialMotionBlock
} from "../src/tutorial/kp-tutorial-motion.ts";

test("cumulative projection obeys the same predecessor law for both callers", () => {
  for (const blocks of [kpEconomicsMotionBlocks, kpLispLessonMotionBlocks]) {
    const projection = projectKpTutorialCumulativeMotion({
      blocks: blocks as readonly KpTutorialMotionBlock<string>[],
      activeBlockId: blocks[1]!.id,
      localProgress: 0.37
    });
    assert.deepEqual(
      projection.map(({ status, progress }) => ({ status, progress })),
      blocks.map((_, index) => index < 1
        ? { status: "settled", progress: 1 }
        : index === 1
          ? { status: "active", progress: 0.37 }
          : { status: "inactive", progress: 0 })
    );
  }
});

test("dense corridor samples stay bounded monotone and exactly reversible", () => {
  for (const block of [...kpEconomicsMotionBlocks, ...kpLispLessonMotionBlocks]) {
    let previous = -1;
    for (let index = 0; index <= 1_000; index += 1) {
      const travel = index / 1_000;
      const progress = projectKpTutorialCorridorTravel(block.corridor, travel);
      assert.ok(progress >= previous - Number.EPSILON);
      assert.ok(progress >= 0 && progress <= 1);
      const resolved = resolveKpTutorialCorridorTravelForProgress({
        corridor: block.corridor,
        progress,
        preferredTravel: travel
      });
      assert.ok(Math.abs(
        projectKpTutorialCorridorTravel(block.corridor, resolved) - progress
      ) < 1e-10);
      previous = progress;
    }
  }
});

test("manual rebase is continuous for economics and Lisp corridors", () => {
  for (const block of [kpEconomicsMotionBlocks[0]!, kpLispLessonMotionBlocks[0]!]) {
    const takeover = projectKpTutorialRebasedCorridor({
      corridor: block.corridor,
      rawTravelAtTakeover: 0.43,
      manualProgress: 0.81,
      rawTravel: 0.43
    });
    assert.ok(Math.abs(takeover.progress - 0.81) < 1e-12);
    assert.ok(projectKpTutorialRebasedCorridor({
      corridor: block.corridor,
      rawTravelAtTakeover: 0.43,
      manualProgress: 0.81,
      rawTravel: 0.47
    }).progress > takeover.progress);
    assert.ok(projectKpTutorialRebasedCorridor({
      corridor: block.corridor,
      rawTravelAtTakeover: 0.43,
      manualProgress: 0.81,
      rawTravel: 0.39
    }).progress < takeover.progress);
  }
});

test("one reading-band owner is selected for either caller's block ids", () => {
  for (const blocks of [kpEconomicsMotionBlocks, kpLispLessonMotionBlocks]) {
    const projection = projectKpTutorialScrollFrame({
      viewportHeight: 1_000,
      blocks: blocks.map((block, index) => ({
        id: block.id,
        corridor: block.corridor,
        anchorTop: index === 0 ? 440 : 920
      }))
    });
    assert.equal(projection.blocks.filter(({ ownsScroll }) => ownsScroll).length, 1);
    assert.equal(projection.activeBlockId, blocks[0]!.id);
  }
});

test("the host-neutral coordinator coalesces frames and disconnects listeners", () => {
  const callbacks = new Map<number, FrameRequestCallback>();
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  let nextFrame = 1;
  const view = {
    innerHeight: 1_000,
    scrollY: 0,
    requestAnimationFrame(callback: FrameRequestCallback): number {
      const id = nextFrame++;
      callbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id: number): void { callbacks.delete(id); },
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
      const bucket = listeners.get(type) ?? new Set();
      bucket.add(listener);
      listeners.set(type, bucket);
    },
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
      listeners.get(type)?.delete(listener);
    }
  } as unknown as Window;
  const anchor = {
    getBoundingClientRect: () => ({ top: 440 })
  } as unknown as HTMLElement;
  const projections: number[] = [];
  let clock = 0;
  const coordinator = new KpTutorialScrollCoordinator(
    view,
    () => [{ id: "block", anchor, corridor: kpLispLessonMotionBlocks[0]!.corridor }],
    ({ blocks }) => projections.push(blocks[0]!.progress),
    { profileExecution: true, now: () => clock++ }
  );
  coordinator.connect();
  coordinator.scheduleProjection();
  assert.equal(callbacks.size, 1);
  const first = callbacks.entries().next().value;
  assert.ok(first !== undefined);
  const [id, callback] = first;
  callbacks.delete(id);
  callback(0);
  assert.equal(projections.length, 1);
  assert.deepEqual(coordinator.snapshotMetrics(), {
    scrollEvents: 0,
    resizeEvents: 0,
    scheduleRequests: 2,
    coalescedRequests: 1,
    requestedFrames: 1,
    executedFrames: 1,
    registrationReads: 1,
    layoutReads: 1,
    totalExecutionMs: 1,
    longestExecutionMs: 1
  });
  const scrollListener = [...(listeners.get("scroll") ?? [])][0];
  assert.equal(typeof scrollListener, "function");
  if (typeof scrollListener === "function") scrollListener(new Event("scroll"));
  const second = callbacks.entries().next().value;
  assert.ok(second !== undefined);
  callbacks.delete(second[0]);
  second[1](1);
  assert.equal(coordinator.snapshotMetrics().scrollEvents, 1);
  coordinator.resetMetrics();
  assert.equal(coordinator.snapshotMetrics().executedFrames, 0);
  assert.equal(listeners.get("scroll")?.size, 1);
  coordinator.disconnect();
  assert.equal(listeners.get("scroll")?.size, 0);
  assert.equal(listeners.get("resize")?.size, 0);
});
