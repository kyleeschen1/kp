import { strict as assert } from "node:assert";
import type { Server } from "node:http";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createExactRationalLinearProblemProvider } from "../providers/linear-problems/public-api.ts";
import { createAppServer } from "./app.ts";
import { KpDevReviewInboxService } from "./dev-review-inbox.ts";
import { KpDevReviewEventStore } from "./dev-review-store.ts";

function reviewRequest(): unknown {
  return {
    schemaVersion: "kp.dev-review.v1",
    sessionId: "review.http.1",
    comment: "The cancellation handoff jumps.",
    capture: {
      route: "http://127.0.0.1:8000/reader/x-plus-three",
      capturedAt: "2026-07-20T20:00:00.000Z",
      environment: {
        browserName: "Chrome",
        language: "en-US",
        viewport: { width: 1280, height: 720, devicePixelRatio: 2, scrollX: 0, scrollY: 400 },
        reducedMotion: false,
        forcedColors: false,
        colorScheme: "light",
        build: { commit: "abc123", fingerprint: "dev-abc123", dirty: false }
      },
      semantic: { activeTransformationIds: [], focusRefs: [] },
      render: { ownerIds: [] },
      temporalTrace: []
    }
  };
}

test("dev review routes are absent unless the service and capability header are present", async (context) => {
  const root = join(tmpdir(), `kp-dev-review-http-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const service = new KpDevReviewInboxService(await KpDevReviewEventStore.open(root));

  const disabled = createAppServer({ linearProblemProvider: createExactRationalLinearProblemProvider() });
  const disabledUrl = await listen(disabled);
  assert.equal((await fetch(`${disabledUrl}/api/dev/reviews`, { headers: { "x-kp-dev-review": "1" } })).status, 404);
  await close(disabled);

  const enabled = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider(),
    devReviewService: service
  });
  context.after(() => close(enabled));
  const baseUrl = await listen(enabled);
  assert.equal((await fetch(`${baseUrl}/api/dev/reviews`)).status, 404);

  const created = await fetch(`${baseUrl}/api/dev/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-kp-dev-review": "1" },
    body: JSON.stringify(reviewRequest())
  });
  assert.equal(created.status, 201);
  assert.equal((await created.json() as { sequence: number }).sequence, 1);

  const inbox = await fetch(`${baseUrl}/api/dev/reviews`, { headers: { "x-kp-dev-review": "1" } });
  assert.equal(inbox.status, 200);
  assert.equal((await inbox.json() as { notes: unknown[] }).notes.length, 1);
});

test("dev review transport rejects malformed, unsupported, and oversized input", async (context) => {
  const root = join(tmpdir(), `kp-dev-review-http-bounds-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const server = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider(),
    devReviewService: new KpDevReviewInboxService(await KpDevReviewEventStore.open(root))
  });
  context.after(() => close(server));
  const baseUrl = await listen(server);
  const capability = { "x-kp-dev-review": "1" };

  assert.equal((await fetch(`${baseUrl}/api/dev/reviews`, { method: "POST", headers: capability, body: "{}" })).status, 415);
  assert.equal((await fetch(`${baseUrl}/api/dev/reviews`, {
    method: "POST", headers: { ...capability, "content-type": "application/json" }, body: "{"
  })).status, 400);
  assert.equal((await fetch(`${baseUrl}/api/dev/reviews`, {
    method: "POST", headers: { ...capability, "content-type": "application/json" }, body: JSON.stringify({ padding: "x".repeat(140_000) })
  })).status, 413);
});

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Expected TCP address");
  return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
