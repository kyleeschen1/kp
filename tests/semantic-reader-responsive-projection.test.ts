import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_READER_WIDE_MIN_WIDTH,
  resolveKpReaderResponsiveProjection
} from "../src/reader/runtime/public-api.ts";

test("attention stories switch projection at the reader layout boundary", () => {
  assert.equal(KP_READER_WIDE_MIN_WIDTH, 881);
  assert.equal(resolveKpReaderResponsiveProjection({
    viewportWidth: 881,
    attentionAvailable: true
  }), "wide-scrollytelling");
  assert.equal(resolveKpReaderResponsiveProjection({
    viewportWidth: 880,
    attentionAvailable: true
  }), "focus-stepper");
});

test("stories without attention preserve their fallback presentation", () => {
  assert.equal(resolveKpReaderResponsiveProjection({
    viewportWidth: 390,
    attentionAvailable: false
  }), "fallback");
  assert.equal(resolveKpReaderResponsiveProjection({
    viewportWidth: 1_440,
    attentionAvailable: false
  }), "fallback");
  assert.throws(() => resolveKpReaderResponsiveProjection({
    viewportWidth: 0,
    attentionAvailable: true
  }), /positive and finite/);
});
