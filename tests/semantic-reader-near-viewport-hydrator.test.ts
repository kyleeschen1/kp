import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpReaderNearViewportHydrator,
  type KpReaderHydrationMount
} from "../src/reader/app/public-api.ts";

test("offscreen blocks remain static and hydrate only when near the viewport", async () => {
  const events: string[] = [];
  const hydrator = createKpReaderNearViewportHydrator();
  hydrator.register(candidate("story.solve-x", events, async () => mount(events)));
  assert.deepEqual(events, ["static:true"]);
  assert.equal(hydrator.getSnapshot("story.solve-x").status, "idle");

  hydrator.setNearViewport("story.solve-x", true);
  assert.equal(hydrator.getSnapshot("story.solve-x").status, "loading");
  assert.equal(events.includes("static:false"), false);
  await settle();
  assert.equal(hydrator.getSnapshot("story.solve-x").status, "hydrated");
  assert.deepEqual(events, ["static:true", "hydrate", "static:false"]);
});

test("failed hydration preserves static reading and can retry after proximity changes", async () => {
  const events: string[] = [];
  let attempt = 0;
  const hydrator = createKpReaderNearViewportHydrator();
  hydrator.register(candidate("story", events, async () => {
    attempt += 1;
    events.push(`hydrate:${attempt}`);
    if (attempt === 1) throw new Error("adapter unavailable");
    return mount(events);
  }));
  hydrator.setNearViewport("story", true);
  await settle();
  assert.equal(hydrator.getSnapshot("story").status, "failed");
  assert.equal(hydrator.getSnapshot("story").error, "adapter unavailable");
  assert.equal(events.at(-1), "static:true");
  hydrator.setNearViewport("story", false);
  hydrator.setNearViewport("story", true);
  await settle();
  assert.equal(hydrator.getSnapshot("story").status, "hydrated");
  assert.equal(hydrator.getSnapshot("story").attempt, 2);
});

test("late asynchronous mounts cannot replace static content after disposal", async () => {
  const events: string[] = [];
  let resolveMount: ((mount: KpReaderHydrationMount) => void) | undefined;
  const hydrator = createKpReaderNearViewportHydrator();
  hydrator.register(candidate("story", events, () => new Promise((resolve) => {
    resolveMount = resolve;
  })));
  hydrator.setNearViewport("story", true);
  hydrator.dispose();
  resolveMount?.(mount(events));
  await settle();
  assert.equal(events.includes("static:false"), false);
  assert.ok(events.includes("dispose-mount"));
});

test("registration and lifecycle ownership are unambiguous", () => {
  const hydrator = createKpReaderNearViewportHydrator();
  const item = candidate("story", [], async () => ({ dispose() {} }));
  hydrator.register(item);
  assert.throws(() => hydrator.register(item), /already registered/);
  assert.throws(() => hydrator.setNearViewport("missing", true), /unknown hydration block/);
  hydrator.dispose();
  assert.throws(() => hydrator.register(item), /is disposed/);
});

function candidate(
  blockId: string,
  events: string[],
  hydrate: () => Promise<KpReaderHydrationMount>
) {
  return {
    blockId,
    async hydrate() {
      if (!events.some((event) => event.startsWith("hydrate:"))) events.push("hydrate");
      return hydrate();
    },
    setStaticVisible(visible: boolean) {
      events.push(`static:${visible}`);
    }
  };
}

function mount(events: string[]): KpReaderHydrationMount {
  return { dispose() { events.push("dispose-mount"); } };
}

async function settle(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}
