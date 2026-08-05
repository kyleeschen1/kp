import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  KpGraph2DRuntimeSessionLifecycle,
  type KpGraph2DRuntimeSession
} from "../src/rendering/graph-2d-runtime-session.ts";

interface TestSession<Content extends object, Frame, Viewport>
extends KpGraph2DRuntimeSession<Content, Frame, Viewport> {
  readonly applications: Array<{ readonly frame: Frame; readonly viewport: Viewport }>;
  readonly disposeCalls: number;
}

function createTestSession<Content extends object, Frame, Viewport>(input: {
  readonly content: Content;
  readonly frame: Frame;
  readonly viewport: Viewport;
}): TestSession<Content, Frame, Viewport> {
  let disposed = false;
  let disposeCalls = 0;
  const applications = [{ frame: input.frame, viewport: input.viewport }];
  return {
    content: input.content,
    get status() {
      return disposed ? "disposed" as const : "mounted" as const;
    },
    applications,
    get disposeCalls() {
      return disposeCalls;
    },
    apply(next) {
      if (disposed) throw new Error("Cannot apply disposed test session.");
      applications.push(next);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      disposeCalls += 1;
    }
  };
}

test("one lifecycle serves structurally different Graph2D callers without owning their frames", () => {
  type EconomicsFrame = { readonly equilibriumPrice: number };
  type EconomicsViewport = { readonly width: number; readonly height: number };
  type PhysicsFrame = { readonly exactWork: string };
  type PhysicsViewport = { readonly xDomain: readonly [number, number] };

  const economicsSessions: Array<
    TestSession<object, EconomicsFrame, EconomicsViewport>
  > = [];
  const economics = new KpGraph2DRuntimeSessionLifecycle(
    (input: {
      readonly content: object;
      readonly frame: EconomicsFrame;
      readonly viewport: EconomicsViewport;
    }) => {
      const session = createTestSession(input);
      economicsSessions.push(session);
      return session;
    }
  );
  const physicsSessions: Array<TestSession<object, PhysicsFrame, PhysicsViewport>> = [];
  const physics = new KpGraph2DRuntimeSessionLifecycle(
    (input: {
      readonly content: object;
      readonly frame: PhysicsFrame;
      readonly viewport: PhysicsViewport;
    }) => {
      const session = createTestSession(input);
      physicsSessions.push(session);
      return session;
    }
  );

  const economicsOwner = {};
  const economicsContent = {};
  const firstEconomics = economics.apply({
    owner: economicsOwner,
    content: economicsContent,
    frame: { equilibriumPrice: 4 },
    viewport: { width: 720, height: 480 }
  });
  const secondEconomics = economics.apply({
    owner: economicsOwner,
    content: economicsContent,
    frame: { equilibriumPrice: 5 },
    viewport: { width: 640, height: 480 }
  });
  const firstPhysics = physics.apply({
    owner: {},
    content: {},
    frame: { exactWork: "15" },
    viewport: { xDomain: [0, 5] }
  });

  assert.equal(firstEconomics.created, true);
  assert.equal(secondEconomics.created, false);
  assert.equal(secondEconomics.session, firstEconomics.session);
  assert.deepEqual(economicsSessions[0]?.applications, [
    {
      frame: { equilibriumPrice: 4 },
      viewport: { width: 720, height: 480 }
    },
    {
      frame: { equilibriumPrice: 5 },
      viewport: { width: 640, height: 480 }
    }
  ]);
  assert.equal(firstPhysics.created, true);
  assert.deepEqual(physicsSessions[0]?.applications, [
    { frame: { exactWork: "15" }, viewport: { xDomain: [0, 5] } }
  ]);
});

test("content replacement and terminal owner disposal are exact and idempotent", () => {
  const sessions: Array<TestSession<object, number, string>> = [];
  const lifecycle = new KpGraph2DRuntimeSessionLifecycle(
    (input: { readonly content: object; readonly frame: number; readonly viewport: string }) => {
      const session = createTestSession(input);
      sessions.push(session);
      return session;
    }
  );
  const owner = {};

  const first = lifecycle.apply({
    owner,
    content: {},
    frame: 0,
    viewport: "wide"
  });
  const replacement = lifecycle.apply({
    owner,
    content: {},
    frame: 1,
    viewport: "narrow"
  });

  assert.equal(first.session.status, "disposed");
  assert.equal(first.session.disposeCalls, 1);
  assert.equal(replacement.created, true);
  assert.equal(sessions.length, 2);

  lifecycle.dispose(owner);
  lifecycle.dispose(owner);
  assert.equal(replacement.session.status, "disposed");
  assert.equal(replacement.session.disposeCalls, 1);
});

test("invalid and throwing factories fail closed without retaining stale sessions", () => {
  const owner = {};
  const firstContent = {};
  const secondContent = {};
  let shouldThrow = false;
  const sessions: Array<TestSession<object, number, number>> = [];
  const lifecycle = new KpGraph2DRuntimeSessionLifecycle(
    (input: { readonly content: object; readonly frame: number; readonly viewport: number }) => {
      if (shouldThrow) throw new Error("factory failed");
      const session = createTestSession(input);
      sessions.push(session);
      return session;
    }
  );

  lifecycle.apply({ owner, content: firstContent, frame: 0, viewport: 1 });
  shouldThrow = true;
  assert.throws(
    () => lifecycle.apply({ owner, content: secondContent, frame: 1, viewport: 2 }),
    /factory failed/
  );
  assert.equal(sessions[0]?.status, "disposed");

  shouldThrow = false;
  const recovered = lifecycle.apply({
    owner,
    content: firstContent,
    frame: 2,
    viewport: 3
  });
  assert.equal(recovered.created, true);
  assert.notEqual(recovered.session, sessions[0]);

  let invalid: TestSession<object, number, number> | undefined;
  const invalidLifecycle = new KpGraph2DRuntimeSessionLifecycle(
    (input: { readonly content: object; readonly frame: number; readonly viewport: number }) => {
      invalid = createTestSession({ ...input, content: {} });
      return invalid;
    }
  );
  assert.throws(
    () => invalidLifecycle.apply({ owner: {}, content: {}, frame: 0, viewport: 0 }),
    /mounted session for the requested content/
  );
  assert.equal(invalid?.status, "disposed");
  assert.equal(invalid?.disposeCalls, 1);
});

test("the shared lifecycle has no domain, DOM, math, framework, or renderer dependency", () => {
  const source = readFileSync(
    new URL("../src/rendering/graph-2d-runtime-session.ts", import.meta.url),
    "utf8"
  );

  assert.equal(source.match(/^import /gm), null);
  assert.doesNotMatch(
    source,
    /(?:HTMLElement|SVGElement|katex|three|svelte|\.\.\/animation|\.\.\/editor)/i
  );
});
