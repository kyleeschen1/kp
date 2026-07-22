import assert from "node:assert/strict";
import test from "node:test";

import type { KpEquationFontReadiness } from "../src/rendering/equation-font-readiness.ts";
import { createKpReaderFontReviewLifecycle } from "../src/reader/app/reader-font-review-lifecycle.ts";

test("font lifecycle orders invalidation, ready work, and deterministic disposal", async () => {
  let listener: ((reason: "ready" | "loading-done") => void) | undefined;
  let disposed = false;
  const events: string[] = [];
  const readiness: KpEquationFontReadiness = {
    status: "ready",
    revision: 0,
    whenReady: async () => undefined,
    subscribe(next) {
      listener = next;
      return () => { listener = undefined; };
    },
    dispose() { disposed = true; }
  };
  const body = { dataset: {} } as HTMLElement;
  const lifecycle = createKpReaderFontReviewLifecycle({
    readiness,
    ownerDocument: { body } as Document,
    ownerWindow: {} as Window,
    development: false,
    reviewMount: "immediate",
    reflectFontReadyOnBody: true,
    renderReviewFrame: () => undefined,
    onFontInvalidated: () => events.push("invalidated"),
    onReady: () => events.push("ready")
  });

  listener?.("loading-done");
  await lifecycle.ready;
  assert.deepEqual(events, ["invalidated", "ready"]);
  assert.equal(body.dataset["kpReaderFontReady"], "true");
  lifecycle.dispose();
  assert.equal(disposed, true);
  assert.equal(listener, undefined);
});
