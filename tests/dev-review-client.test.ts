import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_DEV_REVIEW_SCREENSHOT_REQUEST_SCHEMA_VERSION,
  KP_DEV_REVIEW_SCREENSHOT_SCHEMA_VERSION,
  type KpDevReviewCreateRequestV1
} from "../protocols/dev-review-v1.ts";
import { KpDevReviewClient, KpDevReviewClientError } from "../src/dev-review/client.ts";

function request(): KpDevReviewCreateRequestV1 {
  return {
    schemaVersion: "kp.dev-review.v1",
    sessionId: "review.client.1",
    comment: "The result appears too abruptly.",
    capture: {
      route: "http://127.0.0.1:8000/reader/solve-x/",
      capturedAt: "2026-07-20T20:00:00.000Z",
      environment: {
        browserName: "Chrome", language: "en-US",
        viewport: { width: 1280, height: 720, devicePixelRatio: 2, scrollX: 0, scrollY: 300 },
        reducedMotion: false, forcedColors: false, colorScheme: "light",
        build: { commit: "abc123", fingerprint: "dev-abc123", dirty: false }
      },
      semantic: { activeTransformationIds: [], focusRefs: [] },
      render: { ownerIds: [] },
      temporalTrace: []
    }
  };
}

test("typed client sends the capability and validates the returned note", async () => {
  let observed: { input: string; init: RequestInit | undefined } | undefined;
  const client = new KpDevReviewClient({
    fetch: async (input, init) => {
      observed = { input, init };
      return Response.json({ ...request(), id: "review-note.1.abc", sequence: 1, status: "new" }, { status: 201 });
    }
  });

  const note = await client.create(request());
  assert.equal(note.sequence, 1);
  assert.equal(observed?.input, "/api/dev/reviews");
  assert.equal(new Headers(observed?.init?.headers).get("x-kp-dev-review"), "1");
  assert.deepEqual(JSON.parse(String(observed?.init?.body)), request());
});

test("typed client rejects transport errors and malformed inbox responses", async () => {
  const unavailable = new KpDevReviewClient({ fetch: async () => new Response(null, { status: 404 }) });
  await assert.rejects(() => unavailable.read(), (error) =>
    error instanceof KpDevReviewClientError && error.status === 404
  );

  const malformed = new KpDevReviewClient({ fetch: async () => Response.json({ notes: [] }) });
  await assert.rejects(() => malformed.read(), /schemaVersion/);
});

test("v2 client validates operation inputs and returned round state", async () => {
  let observed: { input: string; body: unknown } | undefined;
  const client = new KpDevReviewClient({
    fetch: async (input, init) => {
      observed = { input, body: JSON.parse(String(init?.body)) };
      return Response.json({
        id: "round.1",
        sequence: 1,
        label: "Polish pass",
        status: "open",
        openedAt: "2026-07-21T00:00:00.000Z",
        baseline: { commit: "abc", fingerprint: "abc", dirty: false },
        synthetic: false
      }, { status: 201 });
    }
  });

  const round = await client.openRound({
    label: "Polish pass",
    baseline: { commit: "abc", fingerprint: "abc", dirty: false }
  });
  assert.equal(round.id, "round.1");
  assert.equal(observed?.input, "/api/dev/reviews/v2/rounds/open");
  assert.deepEqual(observed?.body, {
    label: "Polish pass",
    baseline: { commit: "abc", fingerprint: "abc", dirty: false }
  });
  await assert.rejects(
    () => client.query({ scope: "all", roundId: "round.1" }),
    /cannot be combined/
  );
});

test("typed client requests one bounded screenshot for captured state", async () => {
  let observed: { input: string; body: unknown } | undefined;
  const screenshot = {
    schemaVersion: KP_DEV_REVIEW_SCREENSHOT_SCHEMA_VERSION,
    kind: "bitmap-data-url" as const,
    scope: "selected-stage" as const,
    mediaType: "image/jpeg" as const,
    dataUrl: "data:image/jpeg;base64,/9j/2Q==",
    pixelWidth: 640,
    pixelHeight: 360,
    sourceViewport: { left: 0, top: 80, width: 640, height: 420 }
  };
  const client = new KpDevReviewClient({
    fetch: async (input, init) => {
      observed = { input, body: JSON.parse(String(init?.body)) };
      return Response.json(screenshot, { status: 201 });
    }
  });
  const result = await client.captureScreenshot({
    schemaVersion: KP_DEV_REVIEW_SCREENSHOT_REQUEST_SCHEMA_VERSION,
    surface: "animation-catalogue",
    capture: request().capture
  });

  assert.deepEqual(result, screenshot);
  assert.equal(observed?.input, "/api/dev/reviews/v2/screenshots");
  assert.deepEqual(observed?.body, {
    schemaVersion: KP_DEV_REVIEW_SCREENSHOT_REQUEST_SCHEMA_VERSION,
    surface: "animation-catalogue",
    capture: request().capture
  });
});
