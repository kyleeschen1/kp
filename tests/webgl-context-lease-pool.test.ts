import assert from "node:assert/strict";
import test from "node:test";

import {
  acquireKpWebglContextLease,
  cancelKpWebglContextLeaseWait,
  inspectKpWebglContextLeasePool
} from "../src/rendering/webgl-context-lease-pool.ts";

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
