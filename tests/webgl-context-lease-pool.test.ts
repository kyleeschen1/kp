import assert from "node:assert/strict";
import test from "node:test";

import {
  acquireKpWebglContextLease,
  cancelKpWebglContextLeaseWait,
  inspectKpWebglContextLeasePool
} from "../src/rendering/webgl-context-lease-pool.ts";
import {
  kpTutorialTwelvePassagePageFixture
} from "../src/tutorial/kp-tutorial-motion-passage-fixtures.ts";
import {
  projectKpTutorialMotionPassageLifecycle
} from "../src/tutorial/kp-tutorial-motion-passage-lifecycle.ts";

test("structural WebGL leases cap active contexts and wake one waiter", async () => {
  const ownerDocument = {} as Document;
  const first = fakeCanvas(ownerDocument);
  const second = fakeCanvas(ownerDocument);
  const waiting = fakeCanvas(ownerDocument);
  let available = 0;

  const firstLease = acquireKpWebglContextLease({ canvas: first.canvas });
  const secondLease = acquireKpWebglContextLease({ canvas: second.canvas });
  const denied = acquireKpWebglContextLease({
    canvas: waiting.canvas,
    onAvailable: () => {
      available += 1;
    }
  });

  assert.equal(firstLease.status, "acquired");
  assert.equal(secondLease.status, "acquired");
  assert.equal(denied.status, "capacity");
  assert.deepEqual(inspectKpWebglContextLeasePool(ownerDocument), {
    limit: 2,
    active: 2,
    waiting: 1
  });

  if (firstLease.status === "acquired") firstLease.lease.release();
  await Promise.resolve();
  assert.equal(available, 1);
  assert.equal(first.contextLossRequests, 1);
  assert.deepEqual(inspectKpWebglContextLeasePool(ownerDocument), {
    limit: 2,
    active: 1,
    waiting: 0
  });

  if (secondLease.status === "acquired") secondLease.lease.release();
});

test("cancelled waiters stay cancelled and context loss frees a lease", async () => {
  const ownerDocument = {} as Document;
  const first = fakeCanvas(ownerDocument);
  const second = fakeCanvas(ownerDocument);
  const waiting = fakeCanvas(ownerDocument);
  let available = 0;
  let lost = 0;

  const firstLease = acquireKpWebglContextLease({
    canvas: first.canvas,
    onContextLost: () => {
      lost += 1;
    }
  });
  const secondLease = acquireKpWebglContextLease({ canvas: second.canvas });
  acquireKpWebglContextLease({
    canvas: waiting.canvas,
    onAvailable: () => {
      available += 1;
    }
  });
  cancelKpWebglContextLeaseWait(waiting.canvas);
  first.dispatchContextLost();
  await Promise.resolve();

  assert.equal(lost, 1);
  assert.equal(available, 0);
  assert.deepEqual(inspectKpWebglContextLeasePool(ownerDocument), {
    limit: 2,
    active: 1,
    waiting: 0
  });
  if (firstLease.status === "acquired") firstLease.lease.release();
  if (secondLease.status === "acquired") secondLease.lease.release();
});

test("leases can request WebGL2 without changing the WebGL1 default", () => {
  const ownerDocument = {} as Document;
  const requestedKinds: string[] = [];
  const context = {
    getExtension: () => null
  } as unknown as WebGL2RenderingContext;
  const canvas = {
    ownerDocument,
    getContext: (kind: string) => {
      requestedKinds.push(kind);
      return context;
    },
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  } as unknown as HTMLCanvasElement;

  const webgl2 = acquireKpWebglContextLease({
    canvas,
    contextKind: "webgl2"
  });
  assert.equal(webgl2.status, "acquired");
  assert.deepEqual(requestedKinds, ["webgl2"]);
  if (webgl2.status === "acquired") webgl2.lease.release();
});

test("a scheduled waiter can be cancelled before stale offscreen reacquisition", async () => {
  const ownerDocument = {} as Document;
  const first = fakeCanvas(ownerDocument);
  const second = fakeCanvas(ownerDocument);
  const stale = fakeCanvas(ownerDocument);
  const next = fakeCanvas(ownerDocument);
  const notifications: string[] = [];
  const firstLease = acquireKpWebglContextLease({ canvas: first.canvas });
  const secondLease = acquireKpWebglContextLease({ canvas: second.canvas });
  acquireKpWebglContextLease({
    canvas: stale.canvas,
    onAvailable: () => notifications.push("stale")
  });
  acquireKpWebglContextLease({
    canvas: next.canvas,
    onAvailable: () => notifications.push("next")
  });

  if (firstLease.status === "acquired") firstLease.lease.release();
  assert.deepEqual(inspectKpWebglContextLeasePool(ownerDocument), {
    limit: 2,
    active: 1,
    waiting: 2
  });
  cancelKpWebglContextLeaseWait(stale.canvas);
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(notifications, ["next"]);
  assert.deepEqual(inspectKpWebglContextLeasePool(ownerDocument), {
    limit: 2,
    active: 1,
    waiting: 0
  });
  if (secondLease.status === "acquired") secondLease.lease.release();
});

test("a moving twelve-passage live window never exceeds WebGL capacity", async () => {
  const ownerDocument = {} as Document;
  const passages = kpTutorialTwelvePassagePageFixture.passages;
  const canvases = new Map(passages.map(({ id }) => [
    id,
    fakeCanvas(ownerDocument)
  ] as const));
  const leases = new Map<string, { readonly release: () => void }>();
  let maximumActive = 0;
  let maximumWaiting = 0;

  for (let focusedIndex = 0; focusedIndex < passages.length; focusedIndex += 1) {
    const observed = passages.map((passage, index) => ({
      ...passage,
      proximity: index === focusedIndex
        ? "visible" as const
        : Math.abs(index - focusedIndex) === 1
          ? "near" as const
          : "distant" as const
    }));
    const plan = projectKpTutorialMotionPassageLifecycle({
      passages: observed,
      focusedPassageId: observed[focusedIndex]!.id,
      reducedMotion: false,
      policy: kpTutorialTwelvePassagePageFixture.policy
    });
    const desired = new Set(plan.hydratedPassageIds);
    for (const [id, lease] of [...leases]) {
      if (desired.has(id)) continue;
      lease.release();
      leases.delete(id);
      cancelKpWebglContextLeaseWait(canvases.get(id)!.canvas);
    }
    for (const id of plan.hydratedPassageIds) {
      if (leases.has(id)) continue;
      const acquisition = acquireKpWebglContextLease({
        canvas: canvases.get(id)!.canvas,
        onAvailable: () => undefined
      });
      if (acquisition.status === "acquired") leases.set(id, acquisition.lease);
    }
    const snapshot = inspectKpWebglContextLeasePool(ownerDocument);
    maximumActive = Math.max(maximumActive, snapshot.active);
    maximumWaiting = Math.max(maximumWaiting, snapshot.waiting);
    assert.ok(leases.has(plan.activeMotionPassageId!));
    assert.ok(snapshot.active <= snapshot.limit);
    assert.ok(snapshot.waiting <= 1);
    await Promise.resolve();
  }

  for (const lease of leases.values()) lease.release();
  for (const { canvas } of canvases.values()) {
    cancelKpWebglContextLeaseWait(canvas);
  }
  await Promise.resolve();
  assert.equal(maximumActive, 2);
  assert.equal(maximumWaiting, 1);
  assert.deepEqual(inspectKpWebglContextLeasePool(ownerDocument), {
    limit: 2,
    active: 0,
    waiting: 0
  });
});

function fakeCanvas(ownerDocument: Document): {
  readonly canvas: HTMLCanvasElement;
  readonly dispatchContextLost: () => void;
  readonly contextLossRequests: number;
} {
  const listeners = new Set<EventListenerOrEventListenerObject>();
  let contextLossRequests = 0;
  const context = {
    getExtension(name: string) {
      return name === "WEBGL_lose_context"
        ? {
            loseContext() {
              contextLossRequests += 1;
            }
          }
        : null;
    }
  } as unknown as WebGLRenderingContext;
  const canvas = {
    ownerDocument,
    getContext: () => context,
    addEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject
    ) => {
      if (type === "webglcontextlost") listeners.add(listener);
    },
    removeEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject
    ) => {
      if (type === "webglcontextlost") listeners.delete(listener);
    }
  } as unknown as HTMLCanvasElement;
  return {
    canvas,
    dispatchContextLost: () => {
      const event = new Event("webglcontextlost", { cancelable: true });
      listeners.forEach((listener) => {
        if (typeof listener === "function") listener(event);
        else listener.handleEvent(event);
      });
    },
    get contextLossRequests() {
      return contextLossRequests;
    }
  };
}
