import assert from "node:assert/strict";
import test from "node:test";

import {
  KpDevReviewCaptureProviderRegistry,
  type KpDevReviewCaptureContext,
  type KpDevReviewCaptureProvider
} from "../src/dev-review/capture-provider.ts";

const context: KpDevReviewCaptureContext = {
  route: new URL("http://127.0.0.1:8000/reader/solve-x/"),
  capturedAtMs: 1_000,
  eventTarget: null
};

function provider(id: string, priority: number, matches: boolean): KpDevReviewCaptureProvider {
  return {
    id,
    priority,
    matches: () => matches,
    capture: async () => ({
      semantic: { documentId: id, activeTransformationIds: [], focusRefs: [] },
      render: { rendererId: id, ownerIds: [] },
      temporalTrace: []
    })
  };
}

test("selects the highest-priority matching provider without knowing surface internals", async () => {
  const registry = new KpDevReviewCaptureProviderRegistry();
  registry.register(provider("generic", 0, true));
  registry.register(provider("reader", 100, true));
  registry.register(provider("editor", 200, false));

  const capture = await registry.capture(context);
  assert.equal(capture?.providerId, "reader");
  assert.equal(capture?.evidence.semantic.documentId, "reader");
  assert.deepEqual(registry.providerIds(), ["editor", "reader", "generic"]);
});

test("registration is reversible and duplicate provider ids fail", async () => {
  const registry = new KpDevReviewCaptureProviderRegistry();
  const remove = registry.register(provider("reader", 100, true));
  assert.throws(() => registry.register(provider("reader", 0, true)), /Duplicate/);
  remove();

  assert.equal(await registry.capture(context), undefined);
  assert.deepEqual(registry.providerIds(), []);
});
