import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpReaderViewportAnchorCache
} from "../src/reader/runtime/viewport-anchor-cache.ts";

test("viewport anchor measurement is retained until explicit invalidation", () => {
  let reads = 0;
  const cache = createKpReaderViewportAnchorCache(() => {
    reads += 1;
    return reads / 10;
  });

  assert.equal(cache.read(), 0.1);
  assert.equal(cache.read(), 0.1);
  assert.equal(reads, 1);

  cache.invalidate();
  assert.equal(cache.read(), 0.2);
  assert.equal(cache.read(), 0.2);
  assert.equal(reads, 2);
});
