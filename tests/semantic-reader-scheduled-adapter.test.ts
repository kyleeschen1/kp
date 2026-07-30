import assert from "node:assert/strict";
import test from "node:test";
import { createKpReaderArtifactRef } from "../src/reader/document/public-api.ts";
import {
  createKpReaderAdapterRegistry,
  defineKpReaderScheduledRendererAdapter
} from "../src/reader/renderers/public-api.ts";
import {
  createKpReaderSessionSnapshot,
  type KpReaderFrameClock
} from "../src/reader/runtime/public-api.ts";

interface FrameInput {
  readonly progress: number;
}

test("scheduled adapters carry production context through owned read-plan-write lifecycle", () => {
  const calls: string[] = [];
  const clock = manualFrameClock();
  const host = { id: "host.story", calls };
  const registry = createKpReaderAdapterRegistry<typeof host, FrameInput>();
  registry.register(defineKpReaderScheduledRendererAdapter<FrameInput>()({
    id: "renderer.production-test",
    frameClock: clock,
    readLayout: (candidate, mount, { revision, reasons }) => {
      candidate.calls.push(
        `read:${mount.blockId}:${mount.asset.id}:${revision}:${reasons.join("+")}`
      );
      return { width: 240 };
    },
    planLayout: (candidate, mount, layout) => {
      candidate.calls.push(`layout:${mount.initialSession.document.id}:${layout.width}`);
      return { scale: layout.width / 120 };
    },
    planFrame: (candidate, { input, rendererRequest, layoutPlan }) => {
      candidate.calls.push(`plan:${rendererRequest.session.document.id}:${input.progress}`);
      return input.progress * layoutPlan.scale;
    },
    writeFrame: (candidate, frame, request) => {
      candidate.calls.push(`write:${request.session.location.checkpointId}:${frame}`);
    }
  }));

  const mounted = registry.mount({
    adapterId: "renderer.production-test",
    host,
    blockId: "story.solve",
    asset: createKpReaderArtifactRef({
      kind: "animation-asset",
      id: "animation.solve",
      version: "1"
    }),
    session: session("lesson.initial", "initial")
  });
  mounted.render({ progress: 0.25 }, session("lesson.current", "move"));
  clock.flush();

  assert.deepEqual(calls, [
    "read:story.solve:animation.solve:0:mount",
    "layout:lesson.initial:240",
    "plan:lesson.current:0.25",
    "write:move:0.5"
  ]);
  assert.deepEqual(mounted.inspect(), {
    disposed: false,
    suspended: false,
    pending: false,
    layoutRevision: 0,
    pendingInvalidationReasons: [],
    readCount: 1,
    layoutPlanCount: 1,
    framePlanCount: 1,
    writeCount: 1
  });

  mounted.refresh("fonts");
  mounted.renderNow({ progress: 0.5 }, session("lesson.current", "settle"));
  assert.deepEqual(calls.slice(-4), [
    "read:story.solve:animation.solve:1:fonts",
    "layout:lesson.initial:240",
    "plan:lesson.current:0.5",
    "write:settle:1"
  ]);
  registry.disposeAll();
  assert.equal(mounted.disposed, true);
});

function session(documentId: string, checkpointId: string) {
  return createKpReaderSessionSnapshot({
    documentId,
    documentVersion: "1",
    checkpointId
  });
}

function manualFrameClock(): KpReaderFrameClock & { flush(): void } {
  let nextId = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  return {
    request(callback) {
      const id = ++nextId;
      callbacks.set(id, callback);
      return id;
    },
    cancel(id) {
      callbacks.delete(id);
    },
    flush() {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback(0));
    }
  };
}
