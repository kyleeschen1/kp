import assert from "node:assert/strict";
import test from "node:test";
import {
  getOrCreateKpDevReviewSessionId,
  isReviewSessionId,
  type KpDevReviewSessionStorage
} from "../src/dev-review/review-session.ts";

function memoryStorage(): KpDevReviewSessionStorage & { readonly values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); }
  };
}

test("reuses an anonymous build-scoped session across reloads", () => {
  const storage = memoryStorage();
  const first = getOrCreateKpDevReviewSessionId({
    buildFingerprint: "dev/ABC 123",
    storage,
    nowMs: 1_000,
    random: () => 0.25
  });
  const second = getOrCreateKpDevReviewSessionId({
    buildFingerprint: "dev/ABC 123",
    storage,
    nowMs: 2_000,
    random: () => 0.75
  });

  assert.equal(second, first);
  assert.match(first, /^review\.dev-abc-123\./);
  assert.equal(isReviewSessionId(first), true);
  assert.equal([...storage.values.keys()][0], "kp.dev-review.session.v1.dev-abc-123");
});

test("creates a distinct session for a new build and replaces malformed storage", () => {
  const storage = memoryStorage();
  storage.setItem("kp.dev-review.session.v1.build-a", "../../personal/path");
  const first = getOrCreateKpDevReviewSessionId({
    buildFingerprint: "build-a", storage, nowMs: 1, random: () => 0
  });
  const second = getOrCreateKpDevReviewSessionId({
    buildFingerprint: "build-b", storage, nowMs: 1, random: () => 0
  });

  assert.notEqual(first, second);
  assert.equal(isReviewSessionId(first), true);
  assert.equal(isReviewSessionId("../../personal/path"), false);
});
