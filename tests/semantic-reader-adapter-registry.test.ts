import assert from "node:assert/strict";
import test from "node:test";

import { createKpReaderArtifactRef } from "../src/reader/document/public-api.ts";
import {
  createKpReaderAdapterRegistry,
  type KpReaderRendererAdapter
} from "../src/reader/renderers/public-api.ts";
import { createKpReaderSessionSnapshot } from "../src/reader/runtime/public-api.ts";

type Host = { readonly id: string };
type Frame = { readonly progress: number };

test("registry owns mount render refresh and idempotent disposal by block", () => {
  const calls: string[] = [];
  const registry = createKpReaderAdapterRegistry<Host, Frame>();
  registry.register(adapter("renderer.equation-dom", calls));
  const mounted = registry.mount({
    adapterId: "renderer.equation-dom",
    host: { id: "host.story" },
    blockId: "story.solve-x",
    asset: asset(),
    session: session()
  });

  mounted.render({ progress: 0.25 }, session());
  mounted.refresh();
  mounted.dispose();
  mounted.dispose();
  assert.equal(mounted.disposed, true);
  assert.deepEqual(registry.mountedBlockIds, []);
  assert.deepEqual(calls, [
    "mount:host.story:story.solve-x",
    "render:story.solve-x:0.25",
    "refresh",
    "dispose"
  ]);
  assert.throws(() => mounted.render({ progress: 0.5 }, session()), /is disposed/);
});

test("registry rejects ambiguous adapter and block ownership", () => {
  const registry = createKpReaderAdapterRegistry<Host, Frame>();
  const candidate = adapter("renderer.equation-dom", []);
  registry.register(candidate);
  assert.throws(() => registry.register(candidate), /already registered/);
  assert.throws(() => registry.mount({
    adapterId: "renderer.missing",
    host: { id: "host" },
    blockId: "story",
    asset: asset(),
    session: session()
  }), /unknown reader adapter/);
  registry.mount({
    adapterId: candidate.id,
    host: { id: "host" },
    blockId: "story",
    asset: asset(),
    session: session()
  });
  assert.throws(() => registry.mount({
    adapterId: candidate.id,
    host: { id: "other" },
    blockId: "story",
    asset: asset(),
    session: session()
  }), /already mounted/);
});

test("disposeAll releases adapters in reverse mount order", () => {
  const calls: string[] = [];
  const registry = createKpReaderAdapterRegistry<Host, Frame>();
  registry.register(adapter("renderer.equation-dom", calls));
  for (const blockId of ["first", "second"]) {
    registry.mount({
      adapterId: "renderer.equation-dom",
      host: { id: blockId },
      blockId,
      asset: asset(),
      session: session()
    });
  }
  registry.disposeAll();
  assert.deepEqual(calls.slice(-2), ["dispose:second", "dispose:first"]);
});

function adapter(id: string, calls: string[]): KpReaderRendererAdapter<Host, Frame> {
  return {
    id,
    mount(input) {
      calls.push(`mount:${input.host.id}:${input.blockId}`);
      return {
        render(request) {
          calls.push(`render:${request.blockId}:${request.frame.progress}`);
        },
        refresh() {
          calls.push("refresh");
        },
        dispose() {
          calls.push(`dispose${input.blockId === "story.solve-x" ? "" : `:${input.blockId}`}`);
        }
      };
    }
  };
}

function asset() {
  return createKpReaderArtifactRef({
    kind: "animation-asset",
    id: "animation.linear-solve.solve-x",
    version: "1"
  });
}

function session() {
  return createKpReaderSessionSnapshot({
    documentId: "lesson.solve-x",
    documentVersion: "1"
  });
}
